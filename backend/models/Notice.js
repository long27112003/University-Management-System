const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề thông báo là bắt buộc'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Nội dung thông báo là bắt buộc'],
    },
    audience: {
      type: String,
      enum: {
        values: ['all', 'teacher', 'student', 'receptionist'],
        message: 'Đối tượng nhận phải là: all, teacher, student, hoặc receptionist',
      },
      default: 'all',
      lowercase: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người tạo thông báo là bắt buộc'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
