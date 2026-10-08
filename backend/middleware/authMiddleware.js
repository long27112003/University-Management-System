const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (req.user.status === 'inactive') {
        return res.status(401).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const hasRole = (...roles) => {
  const flatRoles = roles.flat();
  return (req, res, next) => {
    if (req.user && flatRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        message: `Not authorized. Required role: [${flatRoles.join(', ')}], current role: ${req.user ? req.user.role : 'None'}`
      });
    }
  };
};

const adminOnly = hasRole('Admin');
const receptionistOnly = hasRole('Receptionist');
const teacherOnly = hasRole('Teacher');
const studentOnly = hasRole('Student');
const staffOnly = hasRole('Admin', 'Receptionist');

module.exports = {
  protect,
  hasRole,
  adminOnly,
  receptionistOnly,
  teacherOnly,
  studentOnly,
  staffOnly,
};
