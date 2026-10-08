const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
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
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassSession',
      required: [true, 'Buổi học là bắt buộc']
    },
    status: {
      type: String,
      enum: {
        values: ['Present', 'Absent', 'Late', 'Excused'],
        message: 'Trạng thái điểm danh phải là: Present, Absent, Late, hoặc Excused'
      },
      required: [true, 'Trạng thái điểm danh là bắt buộc'],
      default: 'Present'
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người điểm danh là bắt buộc']
    },
    markedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: A student can only have ONE attendance record per ClassSession
attendanceSchema.index(
  { student: 1, session: 1 },
  { unique: true }
);

// Query optimization index for class and session lookups
attendanceSchema.index({ class: 1, session: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
