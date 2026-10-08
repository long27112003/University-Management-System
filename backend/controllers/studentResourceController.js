const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Student = require('../models/Student');

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

// Helper to generate unique studentCode
const generateUniqueStudentCode = async (session) => {
  const currentYear = new Date().getFullYear();
  const prefix = `VL-HV${currentYear}`;
  
  const query = Student.findOne({
    studentCode: new RegExp(`^${prefix}`)
  }).sort({ studentCode: -1 });

  if (session) query.session(session);
  const lastStudent = await query;

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

// POST /api/students
const createStudent = async (req, res) => {
  const {
    fullName,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    address,
    emergencyContact,
    academicStatus,
    notes,
    avatar,
    _simulateFailure // testing hook for TC2.2
  } = req.body;

  if (!fullName || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Họ tên, Email và Số điện thoại là bắt buộc'
    });
  }

  const validStatuses = ['waiting', 'active', 'paused', 'completed', 'inactive'];
  const statusToSet = academicStatus || 'active';
  if (!validStatuses.includes(statusToSet)) {
    return res.status(400).json({
      success: false,
      message: `academicStatus không hợp lệ. Cho phép: ${validStatuses.join(', ')}`
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

  try {
    const result = await executeWithSafety(async (session, onRollback) => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password || 'student123', salt);

      const userOptions = session ? { session } : {};
      const [user] = await User.create([{
        name: fullName.trim(),
        email: normalizedEmail,
        password: passwordHash,
        role: 'Student',
        status: 'active',
        avatar: avatar || ''
      }], userOptions);

      onRollback(async () => {
        await User.findByIdAndDelete(user._id);
      });

      if (_simulateFailure) {
        throw new Error('Simulated failure during student profile creation');
      }

      const studentCode = await generateUniqueStudentCode(session);
      const studentOptions = session ? { session } : {};

      const [student] = await Student.create([{
        userId: user._id,
        studentCode,
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        dateOfBirth: dateOfBirth || null,
        gender: gender || 'other',
        address: address || {},
        emergencyContact: emergencyContact || {},
        academicStatus: statusToSet,
        notes: notes || '',
        avatar: avatar || ''
      }], studentOptions);

      onRollback(async () => {
        await Student.findByIdAndDelete(student._id);
      });

      return {
        ...student.toObject(),
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
      message: 'Khởi tạo hồ sơ học viên thành công',
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo học viên'
    });
  }
};

// GET /api/students
const getStudents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.academicStatus) {
      query.academicStatus = req.query.academicStatus;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { studentCode: searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ];
    }

    const sortOption = req.query.sort || '-createdAt';

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('userId', 'status lastLogin')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Student.countDocuments(query)
    ]);

    return res.json({
      success: true,
      data: students,
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

// GET /api/students/:id
const getStudentById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'ID học viên không hợp lệ'
    });
  }

  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'email role status lastLogin createdAt');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học viên'
      });
    }

    // Authorization: if Student, can only view own profile
    if (req.user.role === 'Student' && !student.userId._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập hồ sơ học viên khác'
      });
    }

    // Authorization: if Teacher, only allowed if student belongs to at least one assigned class
    if (req.user.role === 'Teacher') {
      const Teacher = require('../models/Teacher');
      const Class = require('../models/Class');
      const Enrollment = require('../models/Enrollment');
      const teacherDoc = await Teacher.findOne({ userId: req.user._id });
      if (!teacherDoc) {
        return res.status(403).json({
          success: false,
          message: 'Không tìm thấy hồ sơ giáo viên'
        });
      }
      const teacherClasses = await Class.find({ teacher: teacherDoc._id }).select('_id');
      const teacherClassIds = teacherClasses.map(c => c._id);
      const isSharedStudent = await Enrollment.exists({
        student: student._id,
        class: { $in: teacherClassIds }
      });
      if (!isSharedStudent) {
        return res.status(403).json({
          success: false,
          message: 'Giáo viên chỉ có thể xem hồ sơ học viên thuộc các lớp do mình giảng dạy'
        });
      }
    }

    // Quick metrics for Overview tab
    const metrics = {
      activeClassesCount: 0,
      attendancePercentage: 0,
      totalTuitionRemaining: 0
    };

    return res.json({
      success: true,
      data: {
        ...student.toObject(),
        metrics
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// PUT /api/students/:id
const updateStudent = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID học viên không hợp lệ' });
  }

  const {
    fullName,
    email,
    phone,
    dateOfBirth,
    gender,
    address,
    emergencyContact,
    academicStatus,
    notes,
    avatar
  } = req.body;

  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học viên'
      });
    }

    const newEmail = email ? email.toLowerCase().trim() : null;
    const isEmailChanging = newEmail && newEmail !== student.email;

    if (isEmailChanging) {
      const emailTaken = await User.findOne({
        email: newEmail,
        _id: { $ne: student.userId }
      });
      if (emailTaken) {
        return res.status(409).json({
          success: false,
          message: 'Email đã được sử dụng bởi tài khoản khác'
        });
      }
    }

    await executeWithSafety(async (session, onRollback) => {
      const oldEmail = student.email;
      const oldName = student.fullName;
      const oldAvatar = student.avatar;

      if (isEmailChanging || fullName || avatar !== undefined) {
        const userUpdate = {};
        if (isEmailChanging) userUpdate.email = newEmail;
        if (fullName) userUpdate.name = fullName.trim();
        if (avatar !== undefined) userUpdate.avatar = avatar;

        const opt = session ? { session } : {};
        await User.findByIdAndUpdate(student.userId, userUpdate, opt);

        onRollback(async () => {
          await User.findByIdAndUpdate(student.userId, { email: oldEmail, name: oldName, avatar: oldAvatar });
        });
      }

      if (fullName) student.fullName = fullName.trim();
      if (isEmailChanging) student.email = newEmail;
      if (phone) student.phone = phone.trim();
      if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth || null;
      if (gender) student.gender = gender;
      if (address) student.address = address;
      if (emergencyContact) student.emergencyContact = emergencyContact;
      if (academicStatus) {
        const validStatuses = ['waiting', 'active', 'paused', 'completed', 'inactive'];
        if (validStatuses.includes(academicStatus)) {
          student.academicStatus = academicStatus;
        }
      }
      if (notes !== undefined) student.notes = notes;
      if (avatar !== undefined) student.avatar = avatar;

      const saveOpt = session ? { session } : {};
      await student.save(saveOpt);
    });

    return res.json({
      success: true,
      message: 'Cập nhật thông tin học viên thành công',
      data: student
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// PATCH /api/students/:id/status
const updateStudentStatus = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID học viên không hợp lệ' });
  }

  const { academicStatus } = req.body;
  const validStatuses = ['waiting', 'active', 'paused', 'completed', 'inactive'];

  if (!academicStatus || !validStatuses.includes(academicStatus)) {
    return res.status(400).json({
      success: false,
      message: `academicStatus không hợp lệ. Cho phép: ${validStatuses.join(', ')}`
    });
  }

  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { academicStatus },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học viên'
      });
    }

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái học vụ thành công',
      data: student
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getStudentEnrollments = async (req, res) => {
  const { getStudentEnrollments: fetchEnrollments } = require('./enrollmentController');
  return fetchEnrollments(req, res);
};

const getStudentAttendance = async (req, res) => {
  const { getStudentAttendanceById } = require('./attendanceController');
  return getStudentAttendanceById(req, res);
};

const getStudentResults = async (req, res) => {
  const { getStudentResultsById } = require('./learningResultController');
  return getStudentResultsById(req, res);
};

const getStudentInvoices = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID học viên không hợp lệ' });
  }

  try {
    const TuitionInvoice = require('../models/TuitionInvoice');
    const { getEffectiveInvoiceStatus } = require('../services/tuitionService');
    const invoices = await TuitionInvoice.find({ student: req.params.id })
      .populate('class', 'className classCode skill startDate endDate room tuitionFee')
      .populate('createdBy', 'name email role')
      .sort('-createdAt');

    const formatted = invoices.map((inv) => {
      const doc = inv.toObject();
      doc.effectiveStatus = getEffectiveInvoiceStatus(inv);
      return doc;
    });

    return res.json({ success: true, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentPayments = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID học viên không hợp lệ' });
  }

  try {
    const Payment = require('../models/Payment');
    const payments = await Payment.find({ student: req.params.id })
      .populate('invoice', 'invoiceCode totalAmount paidAmount remainingAmount status')
      .populate('createdBy', 'name email role')
      .populate('voidedBy', 'name email role')
      .sort('-paymentDate -createdAt');

    return res.json({ success: true, data: payments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateStudentStatus,
  getStudentEnrollments,
  getStudentAttendance,
  getStudentResults,
  getStudentInvoices,
  getStudentPayments
};
