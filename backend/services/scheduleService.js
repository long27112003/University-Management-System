const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const ClassSession = require('../models/ClassSession');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Helper: Check if two time ranges overlap
// Formula: existing.startTime < new.endTime && existing.endTime > new.startTime
const isTimeOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

// Helper: Normalize room string
const normalizeRoom = (room) => {
  return room ? room.trim() : '';
};

// Helper: Map UTC Date to dayOfWeek (2 = Monday ... 8 = Sunday)
const dateToDayOfWeek = (date) => {
  const jsDay = date.getUTCDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  return jsDay === 0 ? 8 : jsDay + 1;
};

const dayOfWeekNames = {
  2: 'Thứ Hai',
  3: 'Thứ Ba',
  4: 'Thứ Tư',
  5: 'Thứ Năm',
  6: 'Thứ Sáu',
  7: 'Thứ Bảy',
  8: 'Chủ Nhật'
};

// Helper: Parse Date to start of day UTC
const parseDateOnly = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const [year, month, day] = dateInput.slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

// Resolve effective teacher for a schedule
const resolveEffectiveTeacher = (schedule, classDoc) => {
  if (schedule.teacher) return schedule.teacher;
  return classDoc ? classDoc.teacher : null;
};

// Check Teacher Schedule Conflict
const checkTeacherScheduleConflict = async (teacherId, dayOfWeek, startTime, endTime, excludeScheduleId = null) => {
  if (!teacherId) return null;

  // Find all schedules on the same dayOfWeek
  const schedules = await Schedule.find({ dayOfWeek })
    .populate('class', 'className classCode status teacher')
    .populate('teacher', 'fullName teacherCode');

  for (const item of schedules) {
    if (excludeScheduleId && item._id.toString() === excludeScheduleId.toString()) {
      continue;
    }

    // Ignore inactive classes
    if (item.class && ['completed', 'cancelled', 'archived'].includes(item.class.status)) {
      continue;
    }

    const itemTeacherId = (item.teacher?._id || item.teacher || item.class?.teacher?._id || item.class?.teacher)?.toString();

    if (itemTeacherId && itemTeacherId === teacherId.toString()) {
      if (isTimeOverlap(item.startTime, item.endTime, startTime, endTime)) {
        const teacherName = item.teacher?.fullName || 'Giáo viên';
        return {
          type: 'teacher',
          message: `${teacherName} đã có lịch dạy lớp [${item.class?.className || 'khác'}] từ ${item.startTime} đến ${item.endTime} vào ${dayOfWeekNames[dayOfWeek]}`,
          conflict: {
            type: 'teacher',
            teacherId,
            classId: item.class?._id,
            className: item.class?.className,
            classCode: item.class?.classCode,
            startTime: item.startTime,
            endTime: item.endTime,
            dayOfWeek
          }
        };
      }
    }
  }

  return null;
};

// Check Room Schedule Conflict
const checkRoomScheduleConflict = async (room, dayOfWeek, startTime, endTime, excludeScheduleId = null) => {
  const normRoom = normalizeRoom(room);
  if (!normRoom) return null;

  const schedules = await Schedule.find({
    dayOfWeek,
    room: new RegExp(`^${normRoom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  }).populate('class', 'className classCode status');

  for (const item of schedules) {
    if (excludeScheduleId && item._id.toString() === excludeScheduleId.toString()) {
      continue;
    }

    if (item.class && ['completed', 'cancelled', 'archived'].includes(item.class.status)) {
      continue;
    }

    if (isTimeOverlap(item.startTime, item.endTime, startTime, endTime)) {
      return {
        type: 'room',
        message: `Phòng ${normRoom} đã được xếp lịch cho lớp [${item.class?.className || 'khác'}] từ ${item.startTime} đến ${item.endTime} vào ${dayOfWeekNames[dayOfWeek]}`,
        conflict: {
          type: 'room',
          room: normRoom,
          classId: item.class?._id,
          className: item.class?.className,
          classCode: item.class?.classCode,
          startTime: item.startTime,
          endTime: item.endTime,
          dayOfWeek
        }
      };
    }
  }

  return null;
};

// Check Student Schedule Conflict for a class that already has active students
const checkClassScheduleConflictsForEnrolledStudents = async (classId, dayOfWeek, startTime, endTime, excludeScheduleId = null) => {
  // Find all active enrollments in this class
  const activeEnrollments = await Enrollment.find({
    class: classId,
    status: 'active'
  }).populate('student', 'fullName studentCode');

  if (!activeEnrollments.length) return null;

  for (const enrollment of activeEnrollments) {
    const student = enrollment.student;
    if (!student) continue;

    // Find student's other active enrollments
    const otherEnrollments = await Enrollment.find({
      student: student._id,
      class: { $ne: classId },
      status: 'active'
    });

    const otherClassIds = otherEnrollments.map((e) => e.class);
    if (!otherClassIds.length) continue;

    // Find schedules of those other classes
    const otherSchedules = await Schedule.find({
      class: { $in: otherClassIds },
      dayOfWeek
    }).populate('class', 'className classCode status');

    for (const otherSched of otherSchedules) {
      if (otherSched.class && ['completed', 'cancelled', 'archived'].includes(otherSched.class.status)) {
        continue;
      }

      if (isTimeOverlap(otherSched.startTime, otherSched.endTime, startTime, endTime)) {
        return {
          type: 'student',
          message: `Học viên [${student.studentCode} - ${student.fullName}] bị trùng lịch với lớp [${otherSched.class?.className}] (${otherSched.startTime} - ${otherSched.endTime}) vào ${dayOfWeekNames[dayOfWeek]}`,
          conflict: {
            type: 'student',
            studentId: student._id,
            studentCode: student.studentCode,
            studentName: student.fullName,
            classId: otherSched.class?._id,
            className: otherSched.class?.className,
            startTime: otherSched.startTime,
            endTime: otherSched.endTime,
            dayOfWeek
          }
        };
      }
    }
  }

  return null;
};

// Check Student Schedule Conflict when enrolling student into destination class
const checkStudentScheduleConflictOnEnroll = async (studentId, destinationClassId, excludeClassId = null) => {
  // Get schedules of destination class
  const destSchedules = await Schedule.find({ class: destinationClassId });
  if (!destSchedules.length) return null; // No schedules yet, no conflict

  const excluded = [destinationClassId];
  if (excludeClassId) excluded.push(excludeClassId);

  // Get other active classes of this student
  const otherEnrollments = await Enrollment.find({
    student: studentId,
    class: { $nin: excluded },
    status: 'active'
  });

  const otherClassIds = otherEnrollments.map((e) => e.class);
  if (!otherClassIds.length) return null;

  // Get schedules of other active classes
  const otherSchedules = await Schedule.find({
    class: { $in: otherClassIds }
  }).populate('class', 'className classCode status');

  for (const destSched of destSchedules) {
    for (const otherSched of otherSchedules) {
      if (otherSched.class && ['completed', 'cancelled', 'archived'].includes(otherSched.class.status)) {
        continue;
      }

      if (destSched.dayOfWeek === otherSched.dayOfWeek) {
        if (isTimeOverlap(destSched.startTime, destSched.endTime, otherSched.startTime, otherSched.endTime)) {
          return {
            type: 'student',
            message: `Học viên bị trùng lịch với lớp đang học [${otherSched.class?.className}] từ ${otherSched.startTime} đến ${otherSched.endTime} vào ${dayOfWeekNames[destSched.dayOfWeek]}`,
            conflict: {
              type: 'student',
              studentId,
              classId: otherSched.class?._id,
              className: otherSched.class?.className,
              startTime: otherSched.startTime,
              endTime: otherSched.endTime,
              dayOfWeek: destSched.dayOfWeek
            }
          };
        }
      }
    }
  }

  return null;
};

// Check Real-Date Session Conflicts (for session PUT/status updates)
const checkSessionConflicts = async (sessionDate, startTime, endTime, teacherId, room, excludeSessionId = null) => {
  const normDate = parseDateOnly(sessionDate);
  const normRoom = normalizeRoom(room);

  // Check teacher conflict on this date
  if (teacherId) {
    const teacherConflict = await ClassSession.findOne({
      _id: { $ne: excludeSessionId },
      sessionDate: normDate,
      teacher: teacherId,
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    }).populate('class', 'className classCode');

    if (teacherConflict) {
      return {
        type: 'teacher',
        message: `Giáo viên đã có buổi dạy khác vào ngày này từ ${teacherConflict.startTime} đến ${teacherConflict.endTime}`,
        conflict: teacherConflict
      };
    }
  }

  // Check room conflict on this date
  if (normRoom) {
    const roomConflict = await ClassSession.findOne({
      _id: { $ne: excludeSessionId },
      sessionDate: normDate,
      room: new RegExp(`^${normRoom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    }).populate('class', 'className classCode');

    if (roomConflict) {
      return {
        type: 'room',
        message: `Phòng ${normRoom} đã có lớp học khác sử dụng vào ngày này từ ${roomConflict.startTime} đến ${roomConflict.endTime}`,
        conflict: roomConflict
      };
    }
  }

  return null;
};

// Generate Sessions for a Class between startDate and endDate
const generateClassSessions = async (classId) => {
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new Error('Không tìm thấy lớp học');
  }

  const startDate = parseDateOnly(classDoc.startDate);
  const endDate = parseDateOnly(classDoc.endDate);

  if (!startDate || !endDate || endDate < startDate) {
    throw new Error('Ngày khai giảng và bế giảng không hợp lệ');
  }

  const schedules = await Schedule.find({ class: classId });
  if (!schedules.length) {
    throw new Error('Lớp học chưa có thời khóa biểu tuần nào được thiết lập');
  }

  let createdCount = 0;
  let skippedCount = 0;

  // Iterate day by day from startDate to endDate
  const currentDate = new Date(startDate.getTime());

  while (currentDate <= endDate) {
    const dayOfWeek = dateToDayOfWeek(currentDate);

    // Find schedules matching this dayOfWeek
    const matchingSchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);

    for (const sched of matchingSchedules) {
      const effectiveTeacher = sched.teacher || classDoc.teacher;
      const normalizedSessionDate = new Date(currentDate.getTime());

      // Idempotency: check if session for (class, schedule, sessionDate) exists
      const existing = await ClassSession.findOne({
        class: classId,
        schedule: sched._id,
        sessionDate: normalizedSessionDate
      });

      if (existing) {
        skippedCount++;
      } else {
        await ClassSession.create({
          class: classId,
          schedule: sched._id,
          sessionNumber: 1, // Will be re-indexed after all are created
          sessionDate: normalizedSessionDate,
          startTime: sched.startTime,
          endTime: sched.endTime,
          teacher: effectiveTeacher,
          room: sched.room,
          status: 'scheduled',
          note: ''
        });
        createdCount++;
      }
    }

    // Step to next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  // Renumber sessions chronologically
  const allSessions = await ClassSession.find({ class: classId })
    .sort({ sessionDate: 1, startTime: 1 });

  for (let i = 0; i < allSessions.length; i++) {
    const s = allSessions[i];
    const newSessionNum = i + 1;
    if (s.sessionNumber !== newSessionNum) {
      s.sessionNumber = newSessionNum;
      await s.save();
    }
  }

  return {
    created: createdCount,
    skipped: skippedCount,
    totalSessions: allSessions.length
  };
};

module.exports = {
  isTimeOverlap,
  normalizeRoom,
  dateToDayOfWeek,
  dayOfWeekNames,
  parseDateOnly,
  resolveEffectiveTeacher,
  checkTeacherScheduleConflict,
  checkRoomScheduleConflict,
  checkClassScheduleConflictsForEnrolledStudents,
  checkStudentScheduleConflictOnEnroll,
  checkSessionConflicts,
  generateClassSessions
};
