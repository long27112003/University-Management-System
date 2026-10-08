const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

/**
 * Lấy danh sách điểm danh của 1 buổi học (ClassSession)
 * Tự động hợp nhất (merge) toàn bộ học viên đang theo học (active enrollments)
 */
const getSessionAttendanceRoster = async (sessionId, requestingUser) => {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const error = new Error('sessionId không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const sessionDoc = await ClassSession.findById(sessionId)
    .populate('class', 'classCode className skill teacher room status startDate endDate')
    .populate('teacher', 'fullName teacherCode email phone');

  if (!sessionDoc) {
    const error = new Error('Không tìm thấy buổi học');
    error.statusCode = 404;
    throw error;
  }

  // Scoping check for Teacher
  if (requestingUser.role === 'Teacher') {
    const teacherProfile = await Teacher.findOne({ userId: requestingUser._id });
    const effectiveTeacherId = sessionDoc.teacher?._id?.toString() || sessionDoc.class?.teacher?.toString();

    if (!teacherProfile || effectiveTeacherId !== teacherProfile._id.toString()) {
      const error = new Error('Bạn không có quyền xem điểm danh của buổi học này');
      error.statusCode = 403;
      throw error;
    }
  } else if (requestingUser.role === 'Student') {
    const error = new Error('Học viên không có quyền truy cập danh sách điểm danh buổi học');
    error.statusCode = 403;
    throw error;
  }

  // Lấy danh sách học viên có ghi danh đang hoạt động (active)
  const activeEnrollments = await Enrollment.find({
    class: sessionDoc.class._id,
    status: 'active'
  }).populate('student', 'studentCode fullName gender phone email academicStatus avatar');

  // Lấy các bản ghi điểm danh hiện có của buổi học này
  const existingRecords = await Attendance.find({ session: sessionId }).lean();
  const existingMap = new Map();
  for (const record of existingRecords) {
    existingMap.set(record.student.toString(), record);
  }

  // Hợp nhất dữ liệu học viên và điểm danh
  const mergedRecords = activeEnrollments
    .filter(enr => enr.student != null)
    .map(enr => {
      const st = enr.student;
      const existing = existingMap.get(st._id.toString());
      return {
        studentId: st._id,
        studentCode: st.studentCode,
        fullName: st.fullName,
        gender: st.gender,
        phone: st.phone,
        avatar: st.avatar || '',
        status: existing ? existing.status : null,
        note: existing ? (existing.note || '') : '',
        markedAt: existing ? existing.markedAt : null
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));

  return {
    session: {
      _id: sessionDoc._id,
      sessionNumber: sessionDoc.sessionNumber,
      sessionDate: sessionDoc.sessionDate,
      startTime: sessionDoc.startTime,
      endTime: sessionDoc.endTime,
      room: sessionDoc.room,
      status: sessionDoc.status,
      teacher: sessionDoc.teacher ? {
        _id: sessionDoc.teacher._id,
        fullName: sessionDoc.teacher.fullName,
        teacherCode: sessionDoc.teacher.teacherCode
      } : null
    },
    class: {
      _id: sessionDoc.class._id,
      classCode: sessionDoc.class.classCode,
      className: sessionDoc.class.className,
      skill: sessionDoc.class.skill
    },
    records: mergedRecords
  };
};

/**
 * Bulk Upsert danh sách điểm danh theo buổi học
 */
const bulkUpsertAttendance = async (sessionId, records, requestingUser) => {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const error = new Error('sessionId không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const sessionDoc = await ClassSession.findById(sessionId)
    .populate('class', 'teacher status');

  if (!sessionDoc) {
    const error = new Error('Không tìm thấy buổi học');
    error.statusCode = 404;
    throw error;
  }

  // 1. Kiểm tra trạng thái buổi học: Không được điểm danh buổi đã hủy (409 Conflict)
  if (sessionDoc.status === 'cancelled') {
    const error = new Error('Không thể điểm danh cho buổi học đã bị hủy');
    error.statusCode = 409;
    throw error;
  }

  // 2. Kiểm tra phân quyền cập nhật
  if (requestingUser.role === 'Receptionist') {
    const error = new Error('Nhân viên lễ tân chỉ có quyền xem, không được cập nhật điểm danh');
    error.statusCode = 403;
    throw error;
  }

  if (requestingUser.role === 'Student') {
    const error = new Error('Học viên không có quyền điểm danh');
    error.statusCode = 403;
    throw error;
  }

  if (requestingUser.role === 'Teacher') {
    const teacherProfile = await Teacher.findOne({ userId: requestingUser._id });
    const effectiveTeacherId = sessionDoc.teacher?.toString() || sessionDoc.class?.teacher?.toString();

    if (!teacherProfile || effectiveTeacherId !== teacherProfile._id.toString()) {
      const error = new Error('Bạn chỉ được điểm danh cho buổi học mà mình phụ trách');
      error.statusCode = 403;
      throw error;
    }
  }

  // 3. Kiểm tra payload records
  if (!Array.isArray(records) || records.length === 0) {
    const error = new Error('Danh sách bản ghi điểm danh (records) không hợp lệ hoặc đang trống');
    error.statusCode = 400;
    throw error;
  }

  // 4. Kiểm tra ghi danh đang hoạt động (active enrollment) của từng học viên
  const activeEnrollments = await Enrollment.find({
    class: sessionDoc.class._id,
    status: 'active'
  });
  const activeStudentIdSet = new Set(activeEnrollments.map(e => e.student.toString()));

  const validStatuses = ['Present', 'Absent', 'Late', 'Excused'];

  for (const r of records) {
    if (!r.studentId || !mongoose.Types.ObjectId.isValid(r.studentId)) {
      const error = new Error(`studentId '${r.studentId}' không hợp lệ`);
      error.statusCode = 400;
      throw error;
    }

    if (!activeStudentIdSet.has(r.studentId.toString())) {
      const error = new Error(`Học viên ID ${r.studentId} không có ghi danh đang hoạt động (active) trong lớp này`);
      error.statusCode = 422;
      throw error;
    }

    if (!r.status || !validStatuses.includes(r.status)) {
      const error = new Error(`Trạng thái điểm danh '${r.status}' không hợp lệ. Phải là một trong: Present, Absent, Late, Excused`);
      error.statusCode = 422;
      throw error;
    }
  }

  // 5. Chuẩn bị bulkWrite operations với upsert: true
  const now = new Date();
  const bulkOps = records.map(r => ({
    updateOne: {
      filter: {
        student: r.studentId,
        session: sessionId
      },
      update: {
        $set: {
          class: sessionDoc.class._id,
          status: r.status,
          note: (r.note || '').trim(),
          markedBy: requestingUser._id,
          markedAt: now
        }
      },
      upsert: true
    }
  }));

  const writeResult = await Attendance.bulkWrite(bulkOps);

  return {
    matchedCount: writeResult.matchedCount,
    modifiedCount: writeResult.modifiedCount,
    upsertedCount: writeResult.upsertedCount
  };
};

/**
 * Lấy lịch sử và thống kê điểm danh của 1 học viên
 */
const getStudentAttendanceSummary = async (studentId) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    const error = new Error('studentId không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(studentId);
  if (!student) {
    const error = new Error('Không tìm thấy học viên');
    error.statusCode = 404;
    throw error;
  }

  const records = await Attendance.find({ student: studentId })
    .populate('class', 'classCode className skill status')
    .populate('session', 'sessionNumber sessionDate startTime endTime room status')
    .populate('markedBy', 'name email')
    .sort({ createdAt: -1 });

  const totalSessionsMarked = records.length;
  const presentCount = records.filter(r => r.status === 'Present').length;
  const lateCount = records.filter(r => r.status === 'Late').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const excusedCount = records.filter(r => r.status === 'Excused').length;

  // Formula: (Present + Late) / totalSessionsMarked * 100
  const attendedCount = presentCount + lateCount;
  const attendanceRate = totalSessionsMarked > 0
    ? Number(((attendedCount / totalSessionsMarked) * 100).toFixed(1))
    : 0;

  const formattedRecords = records.map(r => ({
    _id: r._id,
    classId: r.class?._id,
    classCode: r.class?.classCode || '',
    className: r.class?.className || '',
    skill: r.class?.skill || '',
    sessionId: r.session?._id,
    sessionNumber: r.session?.sessionNumber || 0,
    sessionDate: r.session?.sessionDate || null,
    startTime: r.session?.startTime || '',
    endTime: r.session?.endTime || '',
    room: r.session?.room || '',
    sessionStatus: r.session?.status || 'scheduled',
    status: r.status,
    note: r.note || '',
    markedAt: r.markedAt,
    markedBy: r.markedBy?.name || 'Giảng viên'
  }));

  return {
    student: {
      _id: student._id,
      studentCode: student.studentCode,
      fullName: student.fullName
    },
    summary: {
      totalSessionsMarked,
      presentCount,
      lateCount,
      absentCount,
      excusedCount,
      attendanceRate
    },
    records: formattedRecords
  };
};

module.exports = {
  getSessionAttendanceRoster,
  bulkUpsertAttendance,
  getStudentAttendanceSummary
};
