const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Receptionist', 'Teacher', 'Student'], required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'male', 'female', 'other'] },
  dateOfBirth: { type: Date },
  mobileNumber: { type: String },
  address: {
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  avatar: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
