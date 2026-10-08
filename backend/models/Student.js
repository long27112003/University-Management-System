const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studentCode: {
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
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  phone: {
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
  address: {
    street: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' }
  },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' }
  },
  academicStatus: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'completed', 'inactive'],
    default: 'active'
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

studentSchema.index({ academicStatus: 1 });
studentSchema.index({ phone: 1 });
studentSchema.index({ email: 1 });

module.exports = mongoose.model('Student', studentSchema);
