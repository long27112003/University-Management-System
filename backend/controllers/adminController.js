const mongoose = require('mongoose');
const User = require('../models/User');
const Notice = require('../models/Notice');
const bcrypt = require('bcrypt');

const getUsers = async (req, res) => {
  try {
    const role = req.query.role;
    const query = role ? { role } : { role: { $ne: 'Admin' } };
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, gender, dateOfBirth, mobileNumber, address } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      gender,
      dateOfBirth,
      mobileNumber,
      address,
    });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.role) user.role = req.body.role;
    if (req.body.status) user.status = req.body.status;
    if (req.body.mobileNumber !== undefined) user.mobileNumber = req.body.mobileNumber;
    if (req.body.address !== undefined) user.address = req.body.address;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().populate('createdBy', 'name');
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createNotice = async (req, res) => {
  try {
    const notice = new Notice({
      ...req.body,
      createdBy: req.user._id,
    });
    const createdNotice = await notice.save();
    res.status(201).json(createdNotice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNotice = async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getNotices,
  createNotice,
  deleteNotice,
};
