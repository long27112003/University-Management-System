const mongoose = require('mongoose');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');

// Helper to generate unique classCode
const generateUniqueClassCode = async (skill) => {
  const skillPrefixMap = {
    listening: 'VL-LIS',
    speaking: 'VL-SPK',
    reading: 'VL-REA',
    writing: 'VL-WRI'
  };
  const prefix = skillPrefixMap[skill] || 'VL-CLS';

  const lastClass = await Class.findOne({
    classCode: new RegExp(`^${prefix}-K`)
  }).sort({ classCode: -1 });

  let nextSeq = 1;
  if (lastClass && lastClass.classCode) {
    const matched = lastClass.classCode.match(/-K(\d+)/i);
    if (matched && matched[1]) {
      nextSeq = parseInt(matched[1], 10) + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(2, '0');
  return `${prefix}-K${paddedSeq}`;
};

// GET /api/classes
const getClasses = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    // Role-based scoping
    if (req.user.role === 'Teacher') {
      const teacherProfile = await Teacher.findOne({ userId: req.user._id });
      if (!teacherProfile) {
        return res.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        });
      }
      query.teacher = teacherProfile._id;
    } else if (req.user.role === 'Student') {
      const studentProfile = await Student.findOne({ userId: req.user._id });
      if (!studentProfile) {
        return res.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        });
      }
      // Find class IDs where student has active enrollment
      const activeEnrollments = await Enrollment.find({
        student: studentProfile._id,
        status: 'active'
      }).select('class');
      const classIds = activeEnrollments.map((e) => e.class);
      query._id = { $in: classIds };
    }

    // Filter by skill
    if (req.query.skill) {
      query.skill = req.query.skill.toLowerCase().trim();
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status.toLowerCase().trim();
    }

    // Filter by teacherId (Admin / Receptionist)
    if (req.query.teacherId && req.user.role !== 'Teacher') {
      if (mongoose.Types.ObjectId.isValid(req.query.teacherId)) {
        query.teacher = req.query.teacherId;
      }
    }

    // Search by className or classCode
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [{ className: searchRegex }, { classCode: searchRegex }];
    }

    const [classes, total] = await Promise.all([
      Class.find(query)
        .populate('teacher', 'fullName teacherCode email phone specialization avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Class.countDocuments(query)
    ]);

    // Attach active enrollment counts
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

    const enrichedClasses = classes.map((c) => {
      const obj = c.toObject();
      obj.activeEnrollmentsCount = countMap[c._id.toString()] || 0;
      obj.availableSlots = Math.max(0, c.maxCapacity - obj.activeEnrollmentsCount);
      return obj;
    });

    return res.json({
      success: true,
      data: enrichedClasses,
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

// POST /api/classes (Admin only)
const createClass = async (req, res) => {
  const {
    classCode,
    className,
    skill,
    teacher,
    maxCapacity,
    startDate,
    endDate,
    tuitionFee,
    room,
    status
  } = req.body;

  if (!className || !skill || !teacher || !startDate || !endDate || !room) {
    return res.status(400).json({
      success: false,
      message: 'Tên lớp, kỹ năng, giáo viên, ngày bắt đầu, ngày kết thúc và phòng học là bắt buộc'
    });
  }

  const validSkills = ['listening', 'speaking', 'reading', 'writing'];
  if (!validSkills.includes(skill.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Kỹ năng không hợp lệ. Cho phép: ${validSkills.join(', ')}`
    });
  }

  if (!mongoose.Types.ObjectId.isValid(teacher)) {
    return res.status(400).json({
      success: false,
      message: 'teacher ID không hợp lệ'
    });
  }

  const teacherExists = await Teacher.findById(teacher);
  if (!teacherExists) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy giáo viên tương ứng'
    });
  }

  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({
      success: false,
      message: 'Ngày bế giảng phải sau hoặc bằng ngày khai giảng'
    });
  }

  const capacity = parseInt(maxCapacity, 10) || 15;
  if (capacity < 1 || capacity > 30) {
    return res.status(400).json({
      success: false,
      message: 'Sĩ số tối đa phải nằm trong khoảng từ 1 đến 30'
    });
  }

  try {
    let finalClassCode = classCode ? classCode.toUpperCase().trim() : null;
    if (!finalClassCode) {
      finalClassCode = await generateUniqueClassCode(skill.toLowerCase());
    } else {
      const codeTaken = await Class.findOne({ classCode: finalClassCode });
      if (codeTaken) {
        return res.status(409).json({
          success: false,
          message: `Mã lớp ${finalClassCode} đã tồn tại`
        });
      }
    }

    const newClass = await Class.create({
      classCode: finalClassCode,
      className: className.trim(),
      skill: skill.toLowerCase(),
      teacher,
      maxCapacity: capacity,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      tuitionFee: tuitionFee !== undefined ? Math.max(0, Number(tuitionFee)) : 0,
      room: room.trim(),
      status: status || 'upcoming'
    });

    const populated = await Class.findById(newClass._id).populate(
      'teacher',
      'fullName teacherCode email phone specialization'
    );

    return res.status(201).json({
      success: true,
      message: 'Tạo lớp học thành công',
      data: populated
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Mã lớp học đã tồn tại trong hệ thống'
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/classes/:id
const getClassById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ' });
  }

  try {
    const classDoc = await Class.findById(req.params.id).populate(
      'teacher',
      'fullName teacherCode email phone specialization avatar'
    );

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    // Role-based scope authorization
    if (req.user.role === 'Teacher') {
      const teacherProfile = await Teacher.findOne({ userId: req.user._id });
      if (!teacherProfile || !classDoc.teacher._id.equals(teacherProfile._id)) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập lớp học của giáo viên khác'
        });
      }
    } else if (req.user.role === 'Student') {
      const studentProfile = await Student.findOne({ userId: req.user._id });
      if (!studentProfile) {
        return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ học viên' });
      }
      const isEnrolled = await Enrollment.findOne({
        student: studentProfile._id,
        class: classDoc._id,
        status: 'active'
      });
      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập lớp học bạn chưa ghi danh'
        });
      }
    }

    const activeEnrollmentsCount = await Enrollment.countDocuments({
      class: classDoc._id,
      status: 'active'
    });

    const result = classDoc.toObject();
    result.activeEnrollmentsCount = activeEnrollmentsCount;
    result.availableSlots = Math.max(0, classDoc.maxCapacity - activeEnrollmentsCount);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/classes/:id (Admin only)
const updateClass = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ' });
  }

  const {
    className,
    skill,
    teacher,
    maxCapacity,
    startDate,
    endDate,
    tuitionFee,
    room,
    status
  } = req.body;

  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    if (skill) {
      const validSkills = ['listening', 'speaking', 'reading', 'writing'];
      if (!validSkills.includes(skill.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Kỹ năng không hợp lệ. Cho phép: ${validSkills.join(', ')}`
        });
      }
      classDoc.skill = skill.toLowerCase();
    }

    if (teacher) {
      if (!mongoose.Types.ObjectId.isValid(teacher)) {
        return res.status(400).json({ success: false, message: 'teacher ID không hợp lệ' });
      }
      const teacherExists = await Teacher.findById(teacher);
      if (!teacherExists) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy giáo viên' });
      }
      classDoc.teacher = teacher;
    }

    if (maxCapacity !== undefined) {
      const capacity = parseInt(maxCapacity, 10);
      if (capacity < 1 || capacity > 30) {
        return res.status(400).json({
          success: false,
          message: 'Sĩ số tối đa phải nằm trong khoảng từ 1 đến 30'
        });
      }
      classDoc.maxCapacity = capacity;
    }

    const finalStart = startDate ? new Date(startDate) : classDoc.startDate;
    const finalEnd = endDate ? new Date(endDate) : classDoc.endDate;
    if (finalEnd < finalStart) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bế giảng phải sau hoặc bằng ngày khai giảng'
      });
    }

    if (startDate) classDoc.startDate = finalStart;
    if (endDate) classDoc.endDate = finalEnd;
    if (className) classDoc.className = className.trim();
    if (room) classDoc.room = room.trim();
    if (tuitionFee !== undefined) classDoc.tuitionFee = Math.max(0, Number(tuitionFee));
    if (status) {
      const validStatuses = ['upcoming', 'active', 'completed', 'cancelled', 'archived'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
      }
      classDoc.status = status;
    }

    await classDoc.save();

    const populated = await Class.findById(classDoc._id).populate(
      'teacher',
      'fullName teacherCode email phone specialization'
    );

    return res.json({
      success: true,
      message: 'Cập nhật thông tin lớp học thành công',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/classes/:id/status (Admin only)
const updateClassStatus = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ' });
  }

  const { status } = req.body;
  const validStatuses = ['upcoming', 'active', 'completed', 'cancelled', 'archived'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Trạng thái không hợp lệ. Cho phép: ${validStatuses.join(', ')}`
    });
  }

  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    classDoc.status = status;
    await classDoc.save();

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái lớp học thành công',
      data: classDoc
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getClasses,
  createClass,
  getClassById,
  updateClass,
  updateClassStatus
};
