const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    classCode: {
      type: String,
      required: [true, 'Mã lớp học là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true
    },
    className: {
      type: String,
      required: [true, 'Tên lớp học là bắt buộc'],
      trim: true
    },
    skill: {
      type: String,
      required: [true, 'Kỹ năng là bắt buộc'],
      enum: {
        values: ['listening', 'speaking', 'reading', 'writing'],
        message: 'Kỹ năng phải là một trong: listening, speaking, reading, writing'
      }
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Giáo viên phụ trách là bắt buộc']
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Sĩ số tối đa là bắt buộc'],
      default: 15,
      min: [1, 'Sĩ số tối thiểu là 1'],
      max: [30, 'Sĩ số tối đa không vượt quá 30']
    },
    startDate: {
      type: Date,
      required: [true, 'Ngày khai giảng là bắt buộc']
    },
    endDate: {
      type: Date,
      required: [true, 'Ngày bế giảng là bắt buộc'],
      validate: {
        validator: function (val) {
          if (!this.startDate || !val) return true;
          return val >= this.startDate;
        },
        message: 'Ngày bế giảng phải sau hoặc bằng ngày khai giảng'
      }
    },
    tuitionFee: {
      type: Number,
      required: [true, 'Học phí là bắt buộc'],
      default: 0,
      min: [0, 'Học phí không được âm']
    },
    room: {
      type: String,
      required: [true, 'Phòng học là bắt buộc'],
      trim: true
    },
    status: {
      type: String,
      required: [true, 'Trạng thái lớp là bắt buộc'],
      enum: {
        values: ['upcoming', 'active', 'completed', 'cancelled', 'archived'],
        message: 'Trạng thái không hợp lệ'
      },
      default: 'upcoming'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
classSchema.index({ status: 1 });
classSchema.index({ skill: 1 });
classSchema.index({ teacher: 1 });

module.exports = mongoose.model('Class', classSchema);
