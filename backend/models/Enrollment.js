const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
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
    enrolledAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    status: {
      type: String,
      required: [true, 'Trạng thái ghi danh là bắt buộc'],
      enum: {
        values: ['active', 'completed', 'dropped', 'transferred'],
        message: 'Trạng thái không hợp lệ'
      },
      default: 'active'
    },
    transferredFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null
    },
    droppedAt: {
      type: Date,
      default: null
    },
    note: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// CRITICAL: Partial Unique Index
// A student cannot have two ACTIVE enrollments in the same class.
// Historical completed/dropped/transferred records are allowed.
enrollmentSchema.index(
  { student: 1, class: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' }
  }
);

enrollmentSchema.index({ class: 1, status: 1 });
enrollmentSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
