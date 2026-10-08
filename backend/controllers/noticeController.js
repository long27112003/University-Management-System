const mongoose = require('mongoose');
const Notice = require('../models/Notice');

/**
 * GET /api/notices
 * Accessible to all authenticated users, filtered by role audience
 */
const getNotices = async (req, res) => {
  try {
    const userRole = req.user?.role;
    let query = {};

    if (userRole === 'Admin') {
      // Admin sees all notices
      query = {};
    } else if (userRole === 'Teacher') {
      query = { audience: { $in: ['all', 'teacher'] } };
    } else if (userRole === 'Student') {
      query = { audience: { $in: ['all', 'student'] } };
    } else if (userRole === 'Receptionist') {
      query = { audience: { $in: ['all', 'receptionist'] } };
    } else {
      query = { audience: 'all' };
    }

    const notices = await Notice.find(query)
      .populate('createdBy', 'name email role')
      .sort('-createdAt')
      .lean();

    res.json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ message: error.message || 'Lỗi tải danh sách thông báo' });
  }
};

/**
 * POST /api/notices
 * Allowed: Admin, Receptionist
 */
const createNotice = async (req, res) => {
  try {
    const { title, content, audience } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Tiêu đề thông báo là bắt buộc' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Nội dung thông báo là bắt buộc' });
    }

    const validAudiences = ['all', 'teacher', 'student', 'receptionist'];
    const targetAudience = (audience || 'all').toLowerCase().trim();
    if (!validAudiences.includes(targetAudience)) {
      return res.status(422).json({
        message: 'Đối tượng nhận không hợp lệ. Phải là một trong: all, teacher, student, receptionist',
      });
    }

    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      audience: targetAudience,
      createdBy: req.user._id,
    });

    const populatedNotice = await Notice.findById(notice._id).populate('createdBy', 'name email role');
    res.status(201).json(populatedNotice);
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ message: error.message || 'Lỗi tạo thông báo' });
  }
};

/**
 * PUT /api/notices/:id
 * Allowed: Admin, Receptionist
 */
const updateNotice = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID thông báo không hợp lệ' });
  }

  try {
    const { title, content, audience } = req.body;
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: 'Tiêu đề không được để trống' });
      }
      notice.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ message: 'Nội dung không được để trống' });
      }
      notice.content = content.trim();
    }

    if (audience !== undefined) {
      const validAudiences = ['all', 'teacher', 'student', 'receptionist'];
      const targetAudience = audience.toLowerCase().trim();
      if (!validAudiences.includes(targetAudience)) {
        return res.status(422).json({
          message: 'Đối tượng nhận không hợp lệ. Phải là: all, teacher, student, hoặc receptionist',
        });
      }
      notice.audience = targetAudience;
    }

    await notice.save();
    const updated = await Notice.findById(notice._id).populate('createdBy', 'name email role');
    res.json(updated);
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ message: error.message || 'Lỗi cập nhật thông báo' });
  }
};

/**
 * DELETE /api/notices/:id
 * Allowed: Admin only
 */
const deleteNotice = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID thông báo không hợp lệ' });
  }

  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa thông báo thành công' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ message: error.message || 'Lỗi xóa thông báo' });
  }
};

module.exports = {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
};
