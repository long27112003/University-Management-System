const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const ClassSession = require('../models/ClassSession');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const {
  checkTeacherScheduleConflict,
  checkRoomScheduleConflict,
  checkClassScheduleConflictsForEnrolledStudents,
  resolveEffectiveTeacher,
  normalizeRoom
} = require('../services/scheduleService');

// GET /api/classes/:classId/schedules
const getClassSchedules = async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ success: false, message: 'classId không hợp lệ' });
  }

  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    // Role scoping
    if (req.user.role === 'Teacher') {
      const teacherProfile = await Teacher.findOne({ userId: req.user._id });
      if (!teacherProfile || classDoc.teacher?.toString() !== teacherProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ được xem lịch học của các lớp được phân công'
        });
      }
    } else if (req.user.role === 'Student') {
      const studentProfile = await Student.findOne({ userId: req.user._id });
      if (!studentProfile) {
        return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ học viên' });
      }
      const activeEnrollment = await Enrollment.findOne({
        class: classId,
        student: studentProfile._id,
        status: 'active'
      });
      if (!activeEnrollment) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ được xem lịch học của các lớp mình đang theo học'
        });
      }
    }

    const schedules = await Schedule.find({ class: classId })
      .populate('teacher', 'fullName teacherCode email')
      .populate('class', 'className classCode skill teacher room')
      .sort({ dayOfWeek: 1, startTime: 1 });

    return res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/classes/:classId/schedules (Admin only)
const createClassSchedule = async (req, res) => {
  const { classId } = req.params;
  const { dayOfWeek, startTime, endTime, room, teacher } = req.body;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ success: false, message: 'classId không hợp lệ' });
  }

  if (!dayOfWeek || !startTime || !endTime || !room) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đầy đủ: dayOfWeek, startTime, endTime, room'
    });
  }

  if (endTime <= startTime) {
    return res.status(422).json({
      success: false,
      message: 'Giờ kết thúc phải lớn hơn giờ bắt đầu'
    });
  }

  const numDay = Number(dayOfWeek);
  if (isNaN(numDay) || numDay < 2 || numDay > 8) {
    return res.status(422).json({
      success: false,
      message: 'dayOfWeek phải là số từ 2 (Thứ Hai) đến 8 (Chủ Nhật)'
    });
  }

  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    const normRoom = normalizeRoom(room);
    const effectiveTeacherId = teacher || classDoc.teacher;

    // 1. Check Teacher Conflict
    const teacherConflict = await checkTeacherScheduleConflict(
      effectiveTeacherId,
      numDay,
      startTime,
      endTime
    );
    if (teacherConflict) {
      return res.status(409).json({
        success: false,
        message: teacherConflict.message,
        conflict: teacherConflict.conflict
      });
    }

    // 2. Check Room Conflict
    const roomConflict = await checkRoomScheduleConflict(
      normRoom,
      numDay,
      startTime,
      endTime
    );
    if (roomConflict) {
      return res.status(409).json({
        success: false,
        message: roomConflict.message,
        conflict: roomConflict.conflict
      });
    }

    // 3. Check Student Conflict (enrolled students)
    const studentConflict = await checkClassScheduleConflictsForEnrolledStudents(
      classId,
      numDay,
      startTime,
      endTime
    );
    if (studentConflict) {
      return res.status(409).json({
        success: false,
        message: studentConflict.message,
        conflict: studentConflict.conflict
      });
    }

    const newSchedule = await Schedule.create({
      class: classId,
      dayOfWeek: numDay,
      startTime,
      endTime,
      room: normRoom,
      teacher: teacher || null
    });

    const populated = await Schedule.findById(newSchedule._id)
      .populate('teacher', 'fullName teacherCode email')
      .populate('class', 'className classCode skill teacher room');

    return res.status(201).json({
      success: true,
      message: 'Thêm thời khóa biểu thành công',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/schedules/:id (Admin only)
const updateSchedule = async (req, res) => {
  const { id } = req.params;
  const { dayOfWeek, startTime, endTime, room, teacher } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Schedule ID không hợp lệ' });
  }

  try {
    const existingSchedule = await Schedule.findById(id).populate('class');
    if (!existingSchedule) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thời khóa biểu' });
    }

    const classDoc = existingSchedule.class;
    const newDay = dayOfWeek ? Number(dayOfWeek) : existingSchedule.dayOfWeek;
    const newStart = startTime || existingSchedule.startTime;
    const newEnd = endTime || existingSchedule.endTime;
    const newRoom = room ? normalizeRoom(room) : existingSchedule.room;
    const effectiveTeacherId = teacher !== undefined ? (teacher || classDoc.teacher) : resolveEffectiveTeacher(existingSchedule, classDoc);

    if (newEnd <= newStart) {
      return res.status(422).json({
        success: false,
        message: 'Giờ kết thúc phải lớn hơn giờ bắt đầu'
      });
    }

    // 1. Check Teacher Conflict
    const teacherConflict = await checkTeacherScheduleConflict(
      effectiveTeacherId,
      newDay,
      newStart,
      newEnd,
      id
    );
    if (teacherConflict) {
      return res.status(409).json({
        success: false,
        message: teacherConflict.message,
        conflict: teacherConflict.conflict
      });
    }

    // 2. Check Room Conflict
    const roomConflict = await checkRoomScheduleConflict(
      newRoom,
      newDay,
      newStart,
      newEnd,
      id
    );
    if (roomConflict) {
      return res.status(409).json({
        success: false,
        message: roomConflict.message,
        conflict: roomConflict.conflict
      });
    }

    // 3. Check Student Conflict
    const studentConflict = await checkClassScheduleConflictsForEnrolledStudents(
      classDoc._id,
      newDay,
      newStart,
      newEnd,
      id
    );
    if (studentConflict) {
      return res.status(409).json({
        success: false,
        message: studentConflict.message,
        conflict: studentConflict.conflict
      });
    }

    existingSchedule.dayOfWeek = newDay;
    existingSchedule.startTime = newStart;
    existingSchedule.endTime = newEnd;
    existingSchedule.room = newRoom;
    if (teacher !== undefined) {
      existingSchedule.teacher = teacher || null;
    }

    await existingSchedule.save();

    const populated = await Schedule.findById(id)
      .populate('teacher', 'fullName teacherCode email')
      .populate('class', 'className classCode skill teacher room');

    return res.json({
      success: true,
      message: 'Cập nhật thời khóa biểu thành công',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/schedules/:id (Admin only)
const deleteSchedule = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Schedule ID không hợp lệ' });
  }

  try {
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thời khóa biểu' });
    }

    // Delete rule: Only allow if no ClassSessions have been generated from it
    const sessionsCount = await ClassSession.countDocuments({ schedule: id });
    if (sessionsCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Không thể xóa thời khóa biểu vì đã có ${sessionsCount} buổi học được sinh ra từ lịch này. Vui lòng kiểm tra lại.`
      });
    }

    await Schedule.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Xóa thời khóa biểu thành công'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/schedules (Filtered list)
const getSchedules = async (req, res) => {
  const { classId, teacherId, dayOfWeek, room, page = 1, limit = 50 } = req.query;

  try {
    const query = {};

    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      query.class = classId;
    }
    if (dayOfWeek) {
      query.dayOfWeek = Number(dayOfWeek);
    }
    if (room) {
      query.room = new RegExp(room.trim(), 'i');
    }

    // Scoped access
    if (req.user.role === 'Teacher') {
      const teacherProfile = await Teacher.findOne({ userId: req.user._id });
      if (!teacherProfile) {
        return res.json({ success: true, data: [], pagination: { total: 0 } });
      }
      // Teacher sees schedules where they are either schedule.teacher or class.teacher
      const teacherClassIds = await Class.find({ teacher: teacherProfile._id }).distinct('_id');
      query.$or = [
        { teacher: teacherProfile._id },
        { class: { $in: teacherClassIds } }
      ];
    } else if (req.user.role === 'Student') {
      const studentProfile = await Student.findOne({ userId: req.user._id });
      if (!studentProfile) {
        return res.json({ success: true, data: [], pagination: { total: 0 } });
      }
      const activeEnrollments = await Enrollment.find({
        student: studentProfile._id,
        status: 'active'
      });
      const enrolledClassIds = activeEnrollments.map((e) => e.class);
      query.class = { $in: enrolledClassIds };
    } else if (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) {
      const teacherClassIds = await Class.find({ teacher: teacherId }).distinct('_id');
      query.$or = [
        { teacher: teacherId },
        { class: { $in: teacherClassIds } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const total = await Schedule.countDocuments(query);
    const schedules = await Schedule.find(query)
      .populate('teacher', 'fullName teacherCode email')
      .populate('class', 'className classCode skill teacher room status')
      .sort({ dayOfWeek: 1, startTime: 1 })
      .skip(skip)
      .limit(limitNum);

    return res.json({
      success: true,
      data: schedules,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getClassSchedules,
  createClassSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedules
};
