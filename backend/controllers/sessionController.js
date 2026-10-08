const mongoose = require('mongoose');
const ClassSession = require('../models/ClassSession');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const {
  generateClassSessions,
  checkSessionConflicts,
  parseDateOnly,
  normalizeRoom
} = require('../services/scheduleService');

// GET /api/classes/:classId/sessions
const getClassSessions = async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ success: false, message: 'classId không hợp lệ' });
  }

  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    // Role-based access scoping
    if (req.user.role === 'Teacher') {
      const teacherProfile = await Teacher.findOne({ userId: req.user._id });
      if (!teacherProfile || classDoc.teacher?.toString() !== teacherProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ được xem buổi học của các lớp mình được phân công'
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
          message: 'Bạn chỉ được xem buổi học của các lớp mình đang theo học'
        });
      }
    }

    const sessions = await ClassSession.find({ class: classId })
      .populate('teacher', 'fullName teacherCode email')
      .populate('class', 'className classCode skill teacher room')
      .populate('schedule', 'dayOfWeek startTime endTime room')
      .sort({ sessionDate: 1, startTime: 1 });

    return res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/classes/:classId/sessions/generate (Admin only)
const generateSessions = async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ success: false, message: 'classId không hợp lệ' });
  }

  try {
    const result = await generateClassSessions(classId);

    return res.status(201).json({
      success: true,
      message: `Đã sinh thành công ${result.created} buổi học mới (Bỏ qua ${result.skipped} buổi đã tồn tại). Tổng số: ${result.totalSessions} buổi.`,
      data: result
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/sessions/:id
const getSessionById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Session ID không hợp lệ' });
  }

  try {
    const sessionDoc = await ClassSession.findById(id)
      .populate('teacher', 'fullName teacherCode email phone')
      .populate('class', 'className classCode skill teacher room startDate endDate status')
      .populate('schedule', 'dayOfWeek startTime endTime room');

    if (!sessionDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
    }

    // Role scoping
    if (req.user.role === 'Teacher') {
      const teacherProfile = await Teacher.findOne({ userId: req.user._id });
      if (!teacherProfile || sessionDoc.teacher?._id?.toString() !== teacherProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ được xem chi tiết buổi học mà mình phụ trách'
        });
      }
    } else if (req.user.role === 'Student') {
      const studentProfile = await Student.findOne({ userId: req.user._id });
      if (!studentProfile) {
        return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ học viên' });
      }
      const activeEnrollment = await Enrollment.findOne({
        class: sessionDoc.class?._id,
        student: studentProfile._id,
        status: 'active'
      });
      if (!activeEnrollment) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ được xem buổi học của lớp mình đang theo học'
        });
      }
    }

    return res.json({
      success: true,
      data: sessionDoc
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/sessions/:id/status (Admin, Teacher)
const updateSessionStatus = async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Session ID không hợp lệ' });
  }

  const validStatuses = ['scheduled', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(422).json({
      success: false,
      message: 'status không hợp lệ. Phải là một trong: scheduled, completed, cancelled'
    });
  }

  try {
    const sessionDoc = await ClassSession.findById(id);
    if (!sessionDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
    }

    // Teacher permission check:
    // Teacher may ONLY mark their assigned session as 'completed'
    if (req.user.role === 'Teacher') {
      const teacherProfile = await Teacher.findOne({ userId: req.user._id });
      if (!teacherProfile || sessionDoc.teacher?.toString() !== teacherProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ được cập nhật trạng thái buổi học của chính mình'
        });
      }

      if (status !== 'completed') {
        return res.status(403).json({
          success: false,
          message: 'Giáo viên chỉ có quyền đánh dấu hoàn thành (completed) cho buổi học'
        });
      }
    }

    sessionDoc.status = status;
    if (note !== undefined) {
      sessionDoc.note = note.trim();
    }
    await sessionDoc.save();

    const populated = await ClassSession.findById(id)
      .populate('teacher', 'fullName teacherCode email')
      .populate('class', 'className classCode skill teacher room');

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái buổi học thành công',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/sessions/:id (Admin only)
const updateSession = async (req, res) => {
  const { id } = req.params;
  const { sessionDate, startTime, endTime, teacher, room, note } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Session ID không hợp lệ' });
  }

  try {
    const sessionDoc = await ClassSession.findById(id);
    if (!sessionDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
    }

    const newDate = sessionDate ? parseDateOnly(sessionDate) : sessionDoc.sessionDate;
    const newStart = startTime || sessionDoc.startTime;
    const newEnd = endTime || sessionDoc.endTime;
    const newTeacher = teacher || sessionDoc.teacher;
    const newRoom = room ? normalizeRoom(room) : sessionDoc.room;

    if (newEnd <= newStart) {
      return res.status(422).json({
        success: false,
        message: 'Giờ kết thúc phải lớn hơn giờ bắt đầu'
      });
    }

    // Validate real session conflicts
    const conflict = await checkSessionConflicts(
      newDate,
      newStart,
      newEnd,
      newTeacher,
      newRoom,
      id
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: conflict.message,
        conflict: conflict.conflict
      });
    }

    sessionDoc.sessionDate = newDate;
    sessionDoc.startTime = newStart;
    sessionDoc.endTime = newEnd;
    sessionDoc.teacher = newTeacher;
    sessionDoc.room = newRoom;
    if (note !== undefined) {
      sessionDoc.note = note.trim();
    }

    await sessionDoc.save();

    const populated = await ClassSession.findById(id)
      .populate('teacher', 'fullName teacherCode email')
      .populate('class', 'className classCode skill teacher room');

    return res.json({
      success: true,
      message: 'Cập nhật thông tin buổi học thành công',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getClassSessions,
  generateSessions,
  getSessionById,
  updateSessionStatus,
  updateSession
};
