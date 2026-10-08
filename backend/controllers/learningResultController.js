const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const {
  getClassResultsService,
  createClassResultsService,
  updateResultService,
  getStudentResultsService
} = require('../services/learningResultService');

/**
 * GET /api/classes/:classId/results
 * Allowed: Admin, Receptionist, Teacher (Scoped to assigned class)
 */
const getClassResults = async (req, res) => {
  const { classId } = req.params;

  try {
    const data = await getClassResultsService(classId, req.query, req.user);
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
 * POST /api/classes/:classId/results
 * Allowed: Admin, Teacher (Assigned class only)
 * Receptionist: Forbidden (403)
 */
const createClassResults = async (req, res) => {
  const { classId } = req.params;

  try {
    const results = await createClassResultsService(classId, req.body, req.user);
    return res.status(201).json({
      success: true,
      message: `Đã nhập bảng điểm thành công cho ${results.length} học viên`,
      data: results
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
 * PUT /api/results/:id
 * Allowed: Admin, Teacher (Assigned class only)
 */
const updateResult = async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await updateResultService(id, req.body, req.user);
    return res.json({
      success: true,
      message: 'Cập nhật điểm kiểm tra thành công',
      data: updated
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
 * GET /api/student/me/results
 * Allowed: Student (Self Only)
 */
const getMyResults = async (req, res) => {
  try {
    const studentProfile = await Student.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ học viên của tài khoản này'
      });
    }

    const data = await getStudentResultsService(studentProfile._id);
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
 * GET /api/students/:id/results
 * Allowed: Admin, Receptionist (All), Teacher (Scoped to assigned classes)
 */
const getStudentResultsById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'ID học viên không hợp lệ' });
  }

  try {
    if (req.user.role === 'Teacher') {
      const teacherProfile = await Teacher.findOne({ userId: req.user._id });
      if (!teacherProfile) {
        return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ giáo viên' });
      }

      const teacherClasses = await Class.find({ teacher: teacherProfile._id }).select('_id');
      const teacherClassIds = teacherClasses.map(c => c._id);

      const hasSharedEnrollment = await Enrollment.exists({
        student: id,
        class: { $in: teacherClassIds }
      });

      if (!hasSharedEnrollment) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ được xem bảng điểm của học viên thuộc các lớp do mình giảng dạy'
        });
      }
    }

    const data = await getStudentResultsService(id);
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
  getClassResults,
  createClassResults,
  updateResult,
  getMyResults,
  getStudentResultsById
};
