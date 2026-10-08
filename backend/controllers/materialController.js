const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const StudyMaterial = require('../models/StudyMaterial');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

/**
 * Helper to verify user has read access to class materials
 */
const verifyClassReadAccess = async (user, classId) => {
  if (user.role === 'Admin' || user.role === 'Receptionist') {
    return true;
  }

  if (user.role === 'Teacher') {
    const teacherDoc = await Teacher.findOne({ userId: user._id });
    if (!teacherDoc) return false;
    const targetClass = await Class.findById(classId);
    if (!targetClass) return false;
    return targetClass.teacher && targetClass.teacher.toString() === teacherDoc._id.toString();
  }

  if (user.role === 'Student') {
    const studentDoc = await Student.findOne({ userId: user._id });
    if (!studentDoc) return false;
    const enrollment = await Enrollment.findOne({
      student: studentDoc._id,
      class: classId,
      status: 'active',
    });
    return Boolean(enrollment);
  }

  return false;
};

/**
 * Helper to verify user has write/upload access to class materials
 */
const verifyClassUploadAccess = async (user, classId) => {
  if (user.role === 'Admin') {
    return true;
  }

  if (user.role === 'Teacher') {
    const teacherDoc = await Teacher.findOne({ userId: user._id });
    if (!teacherDoc) return false;
    const targetClass = await Class.findById(classId);
    if (!targetClass) return false;
    return targetClass.teacher && targetClass.teacher.toString() === teacherDoc._id.toString();
  }

  return false;
};

/**
 * GET /api/classes/:classId/materials
 */
const getClassMaterials = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Mã lớp học không hợp lệ' });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    const hasAccess = await verifyClassReadAccess(req.user, classId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập tài liệu của lớp học này' });
    }

    const materials = await StudyMaterial.find({ class: classId })
      .populate('uploadedBy', 'name email role')
      .populate('class', 'className classCode skill')
      .sort('-createdAt')
      .lean();

    res.json(materials);
  } catch (error) {
    console.error('Error fetching class materials:', error);
    res.status(500).json({ message: error.message || 'Lỗi lấy tài liệu lớp học' });
  }
};

/**
 * POST /api/classes/:classId/materials
 * Multipart form data: title, description, file
 */
const uploadClassMaterial = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      // Clean up uploaded file if present
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'Mã lớp học không hợp lệ' });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    const hasAccess = await verifyClassUploadAccess(req.user, classId);
    if (!hasAccess) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(403).json({ message: 'Chỉ giáo viên phụ trách lớp hoặc quản trị viên mới được tải tài liệu lên' });
    }

    const { title, description } = req.body;
    if (!title || !title.trim()) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'Tiêu đề tài liệu là bắt buộc' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng đính kèm tệp tin tài liệu' });
    }

    // Relative web URL
    const fileUrl = `/uploads/materials/${req.file.filename}`;
    const fileExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    const material = await StudyMaterial.create({
      title: title.trim(),
      description: (description || '').trim(),
      fileUrl,
      class: classId,
      uploadedBy: req.user._id,
      fileSize: req.file.size,
      fileType: fileExt,
    });

    const populated = await StudyMaterial.findById(material._id)
      .populate('uploadedBy', 'name email role')
      .populate('class', 'className classCode skill');

    res.status(201).json(populated);
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error('Error uploading material:', error);
    res.status(500).json({ message: error.message || 'Lỗi tải lên tài liệu' });
  }
};

/**
 * DELETE /api/materials/:id
 */
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Mã tài liệu không hợp lệ' });
    }

    const material = await StudyMaterial.findById(id).populate('class');
    if (!material) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const user = req.user;
    let canDelete = false;

    if (user.role === 'Admin') {
      canDelete = true;
    } else if (user.role === 'Teacher') {
      const teacherDoc = await Teacher.findOne({ userId: user._id });
      if (teacherDoc) {
        // Teacher may delete if material belongs to their assigned class
        const classTeacherId = material.class?.teacher?.toString();
        if (classTeacherId === teacherDoc._id.toString()) {
          canDelete = true;
        } else if (material.uploadedBy?.toString() === user._id.toString()) {
          canDelete = true;
        }
      }
    }

    if (!canDelete) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa tài liệu này' });
    }

    // Safe physical file removal
    if (material.fileUrl) {
      const relativePath = material.fileUrl.startsWith('/') ? material.fileUrl.slice(1) : material.fileUrl;
      const normalizedPath = path.normalize(relativePath);
      // Prevent directory traversal: must be inside uploads/
      if (normalizedPath.startsWith('uploads')) {
        const fullFilePath = path.join(__dirname, '..', normalizedPath);
        if (fs.existsSync(fullFilePath)) {
          try {
            fs.unlinkSync(fullFilePath);
          } catch (fileErr) {
            console.warn('Could not delete physical file:', fullFilePath, fileErr.message);
          }
        }
      }
    }

    await StudyMaterial.findByIdAndDelete(id);
    res.json({ message: 'Xóa tài liệu học tập thành công' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ message: error.message || 'Lỗi xóa tài liệu' });
  }
};

module.exports = {
  getClassMaterials,
  uploadClassMaterial,
  deleteMaterial,
};
