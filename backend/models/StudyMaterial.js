const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề tài liệu là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'Đường dẫn tệp tin là bắt buộc'],
      trim: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người tải lên là bắt buộc'],
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileType: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Indexes
studyMaterialSchema.index({ class: 1, createdAt: -1 });
studyMaterialSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
