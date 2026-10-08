const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  teacherCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  address: {
    type: String,
    default: ''
  },
  specialization: [{
    type: String,
    enum: ['listening', 'speaking', 'reading', 'writing', 'ielts']
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

teacherSchema.index({ status: 1 });
teacherSchema.index({ email: 1 });
teacherSchema.index({ phone: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
