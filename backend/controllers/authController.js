const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (role && role !== 'Student') {
      return res.status(403).json({ message: 'Không được phép tự đăng ký với vai trò nhân sự hoặc quản trị' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'Student'
    });
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
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
