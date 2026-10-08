const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc']
    },
    dayOfWeek: {
      type: Number,
      required: [true, 'Thứ trong tuần là bắt buộc'],
      min: [2, 'Thứ trong tuần từ 2 (Thứ Hai) đến 8 (Chủ Nhật)'],
      max: [8, 'Thứ trong tuần từ 2 (Thứ Hai) đến 8 (Chủ Nhật)']
    },
    startTime: {
      type: String,
      required: [true, 'Giờ bắt đầu là bắt buộc'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ bắt đầu phải có định dạng HH:mm (VD: 17:30)']
    },
    endTime: {
      type: String,
      required: [true, 'Giờ kết thúc là bắt buộc'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ kết thúc phải có định dạng HH:mm (VD: 19:00)']
    },
    room: {
      type: String,
      required: [true, 'Phòng học là bắt buộc'],
      trim: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null // Optional override; if null, effective teacher = class.teacher
    }
  },
  {
    timestamps: true
  }
);

// Schema-level validation: endTime > startTime
scheduleSchema.pre('validate', function () {
  if (this.startTime && this.endTime) {
    if (this.endTime <= this.startTime) {
      throw new Error('Giờ kết thúc phải lớn hơn giờ bắt đầu');
    }
  }
});

// Indexes for query performance (conflict checks are handled in service layer)
scheduleSchema.index({ class: 1 });
scheduleSchema.index({ room: 1, dayOfWeek: 1 });
scheduleSchema.index({ teacher: 1, dayOfWeek: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = Schedule;
