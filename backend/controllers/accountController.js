const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// GET /api/accounts (Admin only)
const getAccounts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.role) {
      query.role = req.query.role;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { email: searchRegex },
        { name: searchRegex }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/accounts (Admin only)
const createAccount = async (req, res) => {
  const { name, email, password, role, status } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email và Mật khẩu là bắt buộc' });
  }

  const allowedRoles = ['Admin', 'Receptionist', 'Teacher', 'Student'];
  const targetRole = role || 'Receptionist';

  if (!allowedRoles.includes(targetRole)) {
    return res.status(400).json({
      success: false,
      message: `Role không hợp lệ. Cho phép: ${allowedRoles.join(', ')}`
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email đã tồn tại' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name ? name.trim() : normalizedEmail.split('@')[0],
      email: normalizedEmail,
      password: hashedPassword,
      role: targetRole,
      status: status || 'active'
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: userObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/accounts/:id
const getAccountById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID tài khoản không hợp lệ' });
  }

  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/accounts/:id
const updateAccount = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID tài khoản không hợp lệ' });
  }

  const { name, email, password } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const emailTaken = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id }
      });
      if (emailTaken) {
        return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name.trim();

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return res.json({
      success: true,
      message: 'Cập nhật tài khoản thành công',
      data: userObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/accounts/:id/status
const updateAccountStatus = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID tài khoản không hợp lệ' });
  }

  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'status phải là active hoặc inactive'
    });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    // Safety rule: Admin cannot deactivate their own account
    if (user._id.equals(req.user._id) && status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'Không thể tự vô hiệu hóa tài khoản của chính mình'
      });
    }

    // Safety rule: Do not allow deactivating the last remaining active Admin
    if (user.role === 'Admin' && status === 'inactive') {
      const activeAdminCount = await User.countDocuments({ role: 'Admin', status: 'active' });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Không thể vô hiệu hóa Quản trị viên duy nhất đang hoạt động trong hệ thống'
        });
      }
    }

    user.status = status;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái tài khoản thành công',
      data: userObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/accounts/:id/role
const updateAccountRole = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID tài khoản không hợp lệ' });
  }

  const { role } = req.body;
  const allowedRoles = ['Admin', 'Receptionist', 'Teacher', 'Student'];

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Role không hợp lệ. Cho phép: ${allowedRoles.join(', ')}`
    });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    if (user.role === role) {
      return res.json({ success: true, message: 'Role không thay đổi', data: user });
    }

    // Safety rule: Do not allow demoting the last active Admin
    if (user.role === 'Admin' && role !== 'Admin') {
      const activeAdminCount = await User.countDocuments({ role: 'Admin', status: 'active' });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Không thể thay đổi vai trò của Quản trị viên duy nhất đang hoạt động trong hệ thống'
        });
      }
    }

    // Safety rule for MVP:
    // Admin <-> Receptionist transitions are permitted directly.
    // Transitions involving Teacher or Student directly would break profile linkage.
    const isDirectStaffTransition =
      (user.role === 'Admin' || user.role === 'Receptionist') &&
      (role === 'Admin' || role === 'Receptionist');

    if (!isDirectStaffTransition) {
      return res.status(409).json({
        success: false,
        message: `Không thể chuyển đổi trực tiếp giữa vai trò [${user.role}] sang [${role}] để tránh xung đột hồ sơ nghiệp vụ Học viên / Giáo viên.`
      });
    }

    user.role = role;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return res.json({
      success: true,
      message: `Chuyển đổi vai trò sang [${role}] thành công`,
      data: userObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  updateAccountStatus,
  updateAccountRole
};
