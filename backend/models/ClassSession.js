const mongoose = require('mongoose');

const classSessionSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc']
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      default: null
    },
    sessionNumber: {
      type: Number,
      required: [true, 'Thứ tự buổi học là bắt buộc'],
      min: [1, 'Thứ tự buổi học tối thiểu là 1']
    },
    sessionDate: {
      type: Date,
      required: [true, 'Ngày học là bắt buộc']
    },
    startTime: {
      type: String,
      required: [true, 'Giờ bắt đầu là bắt buộc'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ bắt đầu phải có định dạng HH:mm']
    },
    endTime: {
      type: String,
      required: [true, 'Giờ kết thúc là bắt buộc'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ kết thúc phải có định dạng HH:mm']
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Giáo viên là bắt buộc']
    },
    room: {
      type: String,
      required: [true, 'Phòng học là bắt buộc'],
      trim: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    note: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes
classSessionSchema.index({ class: 1, sessionDate: 1, startTime: 1 });
classSessionSchema.index({ teacher: 1, sessionDate: 1 });
classSessionSchema.index({ room: 1, sessionDate: 1 });

// Idempotent unique index for sessions generated from recurring schedules
classSessionSchema.index(
  { class: 1, schedule: 1, sessionDate: 1 },
  {
    unique: true,
    partialFilterExpression: { schedule: { $type: 'objectId' } }
  }
);

const ClassSession = mongoose.model('ClassSession', classSessionSchema);
module.exports = ClassSession;
