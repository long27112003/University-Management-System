const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Schedule = require('../models/Schedule');
const ClassSession = require('../models/ClassSession');

let isReplicaSet = null;

const checkReplicaSet = async () => {
  if (isReplicaSet !== null) return isReplicaSet;
  try {
    const adminDb = mongoose.connection.db.admin();
    const hello = await adminDb.command({ hello: 1 });
    isReplicaSet = Boolean(hello.setName || hello.msg === 'isdbgrid');
  } catch (e) {
    isReplicaSet = false;
  }
  return isReplicaSet;
};

// Helper to run transaction on replica set / Atlas or standalone compensating rollback
const executeWithSafety = async (workFn) => {
  const supportsTransactions = await checkReplicaSet();

  if (supportsTransactions) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const result = await workFn(session, () => {});
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    const rollbacks = [];
    const onRollback = (fn) => rollbacks.push(fn);
    try {
      return await workFn(null, onRollback);
    } catch (err) {
      for (const action of rollbacks.reverse()) {
        try { await action(); } catch (e) {}
      }
      throw err;
    }
  }
};

// Helper to generate unique teacherCode
const generateUniqueTeacherCode = async (session) => {
  const prefix = 'VL-GV';
  
  const query = Teacher.findOne({
    teacherCode: new RegExp(`^${prefix}`)
  }).sort({ teacherCode: -1 });

  if (session) query.session(session);
  const lastTeacher = await query;

  let nextSeq = 1;
  if (lastTeacher && lastTeacher.teacherCode) {
    const matched = lastTeacher.teacherCode.match(/VL-GV(\d+)/);
    if (matched && matched[1]) {
      nextSeq = parseInt(matched[1], 10) + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(3, '0');
  return `${prefix}${paddedSeq}`;
};

// Helper to normalize teacher address safely (object or legacy string)
const normalizeAddress = (addr) => {
  if (!addr) {
    return { street: '', ward: '', district: '', city: '' };
  }
  if (typeof addr === 'string') {
    return { street: addr.trim(), ward: '', district: '', city: '' };
  }
  if (typeof addr === 'object') {
    return {
      street: typeof addr.street === 'string' ? addr.street.trim() : '',
      ward: typeof addr.ward === 'string' ? addr.ward.trim() : '',
      district: typeof addr.district === 'string' ? addr.district.trim() : '',
      city: typeof addr.city === 'string' ? addr.city.trim() : '',
    };
  }
  return { street: '', ward: '', district: '', city: '' };
};

// POST /api/teachers (Admin only)
const createTeacher = async (req, res) => {
  const {
    fullName,
    email,
    phone,
    password,
    gender,
    address,
    specialization,
    status,
    notes,
    avatar
  } = req.body;

  if (!fullName || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Họ tên, Email và Số điện thoại là bắt buộc'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Pre-check email existence
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email đã tồn tại trên hệ thống'
    });
  }

  const validStatuses = ['active', 'inactive'];
  const statusToSet = status || 'active';
  if (!validStatuses.includes(statusToSet)) {
    return res.status(400).json({
      success: false,
      message: 'status phải là active hoặc inactive'
    });
  }

  try {
    const result = await executeWithSafety(async (session, onRollback) => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password || 'teacher123', salt);

      const userOpt = session ? { session } : {};
      const [user] = await User.create([{
        name: fullName.trim(),
        email: normalizedEmail,
        password: passwordHash,
        role: 'Teacher',
        status: 'active',
        avatar: avatar || ''
      }], userOpt);

      onRollback(async () => {
        await User.findByIdAndDelete(user._id);
      });

      const teacherCode = await generateUniqueTeacherCode(session);
      const teacherOpt = session ? { session } : {};

      const [teacher] = await Teacher.create([{
        userId: user._id,
        teacherCode,
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        gender: gender || 'other',
        address: normalizeAddress(address),
        specialization: Array.isArray(specialization) ? specialization : [],
        status: statusToSet,
        notes: notes || '',
        avatar: avatar || ''
      }], teacherOpt);

      onRollback(async () => {
        await Teacher.findByIdAndDelete(teacher._id);
      });

      return {
        ...teacher.toObject(),
        account: {
          _id: user._id,
          email: user.email,
          role: user.role,
          status: user.status
        }
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Khởi tạo hồ sơ giáo viên thành công',
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo giáo viên'
    });
  }
};

// GET /api/teachers
const getTeachers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.specialization) {
      query.specialization = req.query.specialization;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { teacherCode: searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ];
    }

    const sortOption = req.query.sort || '-createdAt';

    const [teachers, total] = await Promise.all([
      Teacher.find(query)
        .populate('userId', 'status lastLogin')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Teacher.countDocuments(query)
    ]);

    return res.json({
      success: true,
      data: teachers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/teachers/:id
const getTeacherById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'ID giáo viên không hợp lệ'
    });
  }

  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('userId', 'email role status lastLogin createdAt');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }

    return res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// PUT /api/teachers/:id (Admin only)
const updateTeacher = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'ID giáo viên không hợp lệ'
    });
  }

  const {
    fullName,
    email,
    phone,
    gender,
    address,
    specialization,
    status,
    notes,
    avatar
  } = req.body;

  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }

    const newEmail = email ? email.toLowerCase().trim() : null;
    const isEmailChanging = newEmail && newEmail !== teacher.email;

    if (isEmailChanging) {
      const emailTaken = await User.findOne({
        email: newEmail,
        _id: { $ne: teacher.userId }
      });
      if (emailTaken) {
        return res.status(409).json({
          success: false,
          message: 'Email đã được sử dụng bởi tài khoản khác'
        });
      }
    }

    await executeWithSafety(async (session, onRollback) => {
      const oldEmail = teacher.email;
      const oldName = teacher.fullName;
      const oldAvatar = teacher.avatar;

      if (isEmailChanging || fullName || avatar !== undefined) {
        const userUpdate = {};
        if (isEmailChanging) userUpdate.email = newEmail;
        if (fullName) userUpdate.name = fullName.trim();
        if (avatar !== undefined) userUpdate.avatar = avatar;

        const opt = session ? { session } : {};
        await User.findByIdAndUpdate(teacher.userId, userUpdate, opt);

        onRollback(async () => {
          await User.findByIdAndUpdate(teacher.userId, { email: oldEmail, name: oldName, avatar: oldAvatar });
        });
      }

      if (fullName) teacher.fullName = fullName.trim();
      if (isEmailChanging) teacher.email = newEmail;
      if (phone) teacher.phone = phone.trim();
      if (gender) teacher.gender = gender;
      if (address !== undefined) teacher.address = normalizeAddress(address);
      if (specialization && Array.isArray(specialization)) teacher.specialization = specialization;
      if (status && ['active', 'inactive'].includes(status)) teacher.status = status;
      if (notes !== undefined) teacher.notes = notes;
      if (avatar !== undefined) teacher.avatar = avatar;

      const opt = session ? { session } : {};
      await teacher.save(opt);
    });

    return res.json({
      success: true,
      message: 'Cập nhật thông tin giáo viên thành công',
      data: teacher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// PATCH /api/teachers/:id/status (Admin only)
const updateTeacherStatus = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'ID giáo viên không hợp lệ'
    });
  }

  const { status } = req.body;
  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'status phải là active hoặc inactive'
    });
  }

  try {
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái giáo viên thành công',
      data: teacher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Teacher Self APIs (/api/teacher/me, /classes, /schedule)
const getMyTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate('userId', 'email role status lastLogin');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ giáo viên cho tài khoản này'
      });
    }

    return res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getMyClasses = async (req, res) => {
  try {
    const teacherProfile = await Teacher.findOne({ userId: req.user._id });
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ giáo viên'
      });
    }

    const Class = require('../models/Class');
    const Enrollment = require('../models/Enrollment');

    const classes = await Class.find({ teacher: teacherProfile._id })
      .populate('teacher', 'fullName teacherCode email phone specialization')
      .sort('-createdAt');

    const classIds = classes.map((c) => c._id);
    const enrollmentCounts = await Enrollment.aggregate([
      {
        $match: {
          class: { $in: classIds },
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$class',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    enrollmentCounts.forEach((ec) => {
      countMap[ec._id.toString()] = ec.count;
    });

    const enriched = classes.map((c) => {
      const obj = c.toObject();
      obj.activeEnrollmentsCount = countMap[c._id.toString()] || 0;
      obj.availableSlots = Math.max(0, c.maxCapacity - obj.activeEnrollmentsCount);
      return obj;
    });

    return res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMySchedule = async (req, res) => {
  try {
    const teacherProfile = await Teacher.findOne({ userId: req.user._id });
    if (!teacherProfile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ giáo viên' });
    }

    const assignedClasses = await Class.find({ teacher: teacherProfile._id });
    const assignedClassIds = assignedClasses.map((c) => c._id);

    const schedules = await Schedule.find({
      $or: [
        { teacher: teacherProfile._id },
        { class: { $in: assignedClassIds } }
      ]
    })
      .populate('class', 'className classCode skill room startDate endDate status teacher')
      .populate('teacher', 'fullName teacherCode email')
      .sort({ dayOfWeek: 1, startTime: 1 });

    const sessions = await ClassSession.find({
      teacher: teacherProfile._id
    })
      .populate('class', 'className classCode skill room')
      .sort({ sessionDate: 1, startTime: 1 });

    return res.json({
      success: true,
      data: schedules,
      sessions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  updateTeacherStatus,
  getMyTeacherProfile,
  getMyClasses,
  getMySchedule
};
