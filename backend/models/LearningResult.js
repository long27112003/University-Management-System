const mongoose = require('mongoose');

const learningResultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Học viên là bắt buộc']
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc']
    },
    testType: {
      type: String,
      enum: {
        values: ['placement', 'midterm', 'final', 'mock'],
        message: 'Loại bài kiểm tra phải là: placement, midterm, final, hoặc mock'
      },
      default: 'midterm',
      required: [true, 'Loại bài kiểm tra là bắt buộc']
    },
    testDate: {
      type: Date,
      default: Date.now,
      required: [true, 'Ngày kiểm tra là bắt buộc']
    },
    listeningScore: {
      type: Number,
      min: [0, 'Điểm Nghe tối thiểu là 0'],
      max: [100, 'Điểm Nghe tối đa là 100'],
      default: null
    },
    speakingScore: {
      type: Number,
      min: [0, 'Điểm Nói tối thiểu là 0'],
      max: [100, 'Điểm Nói tối đa là 100'],
      default: null
    },
    readingScore: {
      type: Number,
      min: [0, 'Điểm Đọc tối thiểu là 0'],
      max: [100, 'Điểm Đọc tối đa là 100'],
      default: null
    },
    writingScore: {
      type: Number,
      min: [0, 'Điểm Viết tối thiểu là 0'],
      max: [100, 'Điểm Viết tối đa là 100'],
      default: null
    },
    overallScore: {
      type: Number,
      min: [0, 'Điểm tổng kết tối thiểu là 0'],
      max: [100, 'Điểm tổng kết tối đa là 100'],
      required: [true, 'Điểm tổng kết là bắt buộc'],
      default: 0
    },
    teacherComment: {
      type: String,
      trim: true,
      default: ''
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người nhập điểm là bắt buộc']
    }
  },
  {
    timestamps: true
  }
);

// Indexes according to Data Model Spec
learningResultSchema.index({ student: 1, class: 1, testType: 1 });
learningResultSchema.index({ class: 1, testType: 1, testDate: 1 });

const LearningResult = mongoose.model('LearningResult', learningResultSchema);

module.exports = LearningResult;
