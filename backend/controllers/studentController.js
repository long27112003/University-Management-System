const User = require('../models/User');
const Notice = require('../models/Notice');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const Schedule = require('../models/Schedule');
const ClassSession = require('../models/ClassSession');
const bcrypt = require('bcrypt');

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.body.email) user.email = req.body.email;
    if (req.body.mobileNumber !== undefined) user.mobileNumber = req.body.mobileNumber;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ audience: { $in: ['all', 'student'] } }).populate('createdBy', 'name');
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMySchedule = async (req, res) => {
  try {
    const studentProfile = await Student.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học viên' });
    }

    const activeEnrollments = await Enrollment.find({
      student: studentProfile._id,
      status: 'active',
    });

    const enrolledClassIds = activeEnrollments.map((e) => e.class);

    const schedules = await Schedule.find({
      class: { $in: enrolledClassIds },
    })
      .populate('class', 'className classCode skill teacher room startDate endDate status')
      .populate('teacher', 'fullName teacherCode email')
      .sort({ dayOfWeek: 1, startTime: 1 });

    const sessions = await ClassSession.find({
      class: { $in: enrolledClassIds },
    })
      .populate('class', 'className classCode skill room')
      .populate('teacher', 'fullName teacherCode')
      .sort({ sessionDate: 1, startTime: 1 });

    return res.json({
      success: true,
      data: schedules,
      sessions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateProfile,
  getNotices,
  getMySchedule,
};
