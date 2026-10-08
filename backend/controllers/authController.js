const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper to generate unique studentCode
const generateUniqueStudentCode = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `VL-HV${currentYear}`;
  
  const lastStudent = await Student.findOne({
    studentCode: new RegExp(`^${prefix}`)
  }).sort({ studentCode: -1 });

  let nextSeq = 1;
  if (lastStudent && lastStudent.studentCode) {
    const matched = lastStudent.studentCode.match(/VL-HV\d{4}(\d+)/);
    if (matched && matched[1]) {
      nextSeq = parseInt(matched[1], 10) + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(3, '0');
  return `${prefix}${paddedSeq}`;
};

const registerUser = async (req, res) => {
  const { name, fullName, email, password, phone, role, gender, dateOfBirth } = req.body;
  const studentName = (fullName || name || '').trim();
  const studentEmail = (email || '').trim().toLowerCase();
  const studentPhone = (phone || '').trim();

  if (!studentName || !studentEmail || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có tối thiểu 6 ký tự' });
  }

  if (role && role !== 'Student') {
    return res.status(403).json({ message: 'Không được phép tự đăng ký với vai trò nhân sự hoặc quản trị' });
  }

  try {
    const userExists = await User.findOne({ email: studentEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Email này đã tồn tại trên hệ thống. Vui lòng đăng nhập.' });
    }

    if (studentPhone) {
      const phoneExists = await Student.findOne({ phone: studentPhone });
      if (phoneExists) {
        return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng bởi một tài khoản khác' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: studentName,
      email: studentEmail,
      password: hashedPassword,
      role: 'Student',
      status: 'active'
    });

    let studentDoc = null;
    try {
      const studentCode = await generateUniqueStudentCode();
      studentDoc = await Student.create({
        userId: user._id,
        studentCode,
        fullName: studentName,
        email: studentEmail,
        phone: studentPhone || `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        gender: gender || 'other',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        academicStatus: 'waiting'
      });
    } catch (profileError) {
      // Rollback user creation if student profile creation fails
      await User.findByIdAndDelete(user._id);
      throw profileError;
    }

    const token = generateToken(user._id, user.role);
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản học viên thành công',
      ...userObj,
      studentId: studentDoc._id,
      studentCode: studentDoc.studentCode,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Lỗi xử lý đăng ký tài khoản' });
  }
};
const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.status === 'inactive') {
        return res.status(401).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
      }
      user.lastLogin = new Date();
      await user.save();
      const userObj = user.toObject();
      delete userObj.password;
      res.json({
        ...userObj,
        token: generateToken(user._id, user.role)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      if (user.status === 'inactive') {
        return res.status(401).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
      }
      const userObj = user.toObject();
      delete userObj.password;
      res.json(userObj);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { registerUser, authUser, getUserProfile };
