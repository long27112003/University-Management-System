const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const {
  getSessionAttendanceRoster,
  bulkUpsertAttendance,
  getStudentAttendanceSummary
} = require('../services/attendanceService');

/**
 * GET /api/sessions/:sessionId/attendance
 * Allowed: Admin, Receptionist, Teacher (Scoped to assigned session/class)
 */
const getSessionAttendance = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const data = await getSessionAttendanceRoster(sessionId, req.user);
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * PUT /api/sessions/:sessionId/attendance
 * Allowed: Admin, Teacher (Assigned Only)
 * Receptionist: Forbidden (403)
 */
const bulkUpdateSessionAttendance = async (req, res) => {
  const { sessionId } = req.params;
  const { records } = req.body;

  try {
    const result = await bulkUpsertAttendance(sessionId, records, req.user);
    return res.json({
      success: true,
      message: 'Lưu điểm danh buổi học thành công',
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/student/me/attendance
 * Allowed: Student (Self Only)
 */
const getMyAttendance = async (req, res) => {
  try {
    const studentProfile = await Student.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ học viên của tài khoản này'
      });
    }

    const data = await getStudentAttendanceSummary(studentProfile._id);
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/students/:id/attendance
 * Allowed: Admin, Receptionist (All), Teacher (Scoped to assigned classes)
 */
const getStudentAttendanceById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'ID học viên không hợp lệ' });
  }

  try {
    // Role scoping for Teacher
    if (req.user.role === 'Teacher') {
      const teacherProfile = await Teacher.findOne({ userId: req.user._id });
      if (!teacherProfile) {
        return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ giáo viên' });
      }

      // Check if student is actively enrolled in any class taught by this teacher
      const teacherClasses = await Class.find({ teacher: teacherProfile._id }).select('_id');
      const teacherClassIds = teacherClasses.map(c => c._id);

      const hasSharedEnrollment = await Enrollment.exists({
        student: id,
        class: { $in: teacherClassIds }
      });

      if (!hasSharedEnrollment) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ được xem lịch sử điểm danh của học viên thuộc các lớp do mình giảng dạy'
        });
      }
    }

    const data = await getStudentAttendanceSummary(id);
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getSessionAttendance,
  bulkUpdateSessionAttendance,
  getMyAttendance,
  getStudentAttendanceById
};
