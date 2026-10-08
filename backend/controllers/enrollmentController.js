const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const TuitionInvoice = require('../models/TuitionInvoice');
const { checkStudentScheduleConflictOnEnroll } = require('../services/scheduleService');
const { generateInvoiceCode } = require('../services/tuitionService');

// Helper to run transaction on replica set / Atlas or standalone compensating rollback
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
        try {
          await action();
        } catch (e) {}
      }
      throw err;
    }
  }
};

// POST /api/classes/:classId/enrollments (Admin, Receptionist)
const enrollStudent = async (req, res) => {
  const { classId } = req.params;
  const { studentId, note } = req.body;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ success: false, message: 'classId không hợp lệ' });
  }

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: 'studentId không hợp lệ' });
  }

  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    const invalidClassStatuses = ['completed', 'cancelled', 'archived'];
    if (invalidClassStatuses.includes(classDoc.status)) {
      return res.status(409).json({
        success: false,
        message: `Không thể ghi danh vào lớp học ở trạng thái [${classDoc.status}]`
      });
    }

    const studentDoc = await Student.findById(studentId);
    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }

    // Check existing active enrollment for student in this class
    const existingActive = await Enrollment.findOne({
      student: studentId,
      class: classId,
      status: 'active'
    });
    if (existingActive) {
      return res.status(409).json({
        success: false,
        message: 'Học viên đã có lượt ghi danh đang hoạt động trong lớp này'
      });
    }

    // Check capacity
    const currentActiveCount = await Enrollment.countDocuments({
      class: classId,
      status: 'active'
    });
    if (currentActiveCount >= classDoc.maxCapacity) {
      return res.status(409).json({
        success: false,
        message: `Lớp học đã đạt sĩ số tối đa (${classDoc.maxCapacity}/${classDoc.maxCapacity})`
      });
    }

    // Check student schedule conflict with other active classes
    const scheduleConflict = await checkStudentScheduleConflictOnEnroll(studentId, classId);
    if (scheduleConflict) {
      return res.status(409).json({
        success: false,
        message: scheduleConflict.message,
        conflict: scheduleConflict.conflict
      });
    }

    // Create active enrollment + auto-create TuitionInvoice atomically (Phase 7)
    const result = await executeWithSafety(async (session, onRollback) => {
      const [newEnrollment] = await Enrollment.create(
        [{
          student: studentId,
          class: classId,
          enrolledAt: new Date(),
          status: 'active',
          note: note || '',
        }],
        { session: session || undefined }
      );

      if (onRollback) {
        onRollback(async () => {
          await Enrollment.findByIdAndDelete(newEnrollment._id);
        });
      }

      // Test hook for TC7.13: force invoice creation failure
      if (req.headers && req.headers['x-test-force-invoice-failure'] === 'true') {
        throw new Error('Simulated failure during invoice creation');
      }

      const invoiceCode = await generateInvoiceCode(session);
      const tuitionFee = typeof classDoc.tuitionFee === 'number' ? classDoc.tuitionFee : 0;

      const [invoiceDoc] = await TuitionInvoice.create(
        [{
          invoiceCode,
          student: studentId,
          enrollment: newEnrollment._id,
          class: classId,
          totalAmount: tuitionFee,
          paidAmount: 0,
          remainingAmount: tuitionFee,
          status: 'unpaid',
          dueDate: classDoc.startDate || null,
          createdBy: req.user._id,
          note: note ? `Học phí ghi danh lớp: ${note}` : 'Học phí ghi danh lớp',
        }],
        { session: session || undefined }
      );

      if (onRollback) {
        onRollback(async () => {
          await TuitionInvoice.findByIdAndDelete(invoiceDoc._id);
        });
      }

      return { newEnrollment, invoiceDoc };
    });

    const populated = await Enrollment.findById(result.newEnrollment._id)
      .populate('student', 'fullName studentCode phone email academicStatus')
      .populate('class', 'className classCode skill startDate endDate room tuitionFee');

    return res.status(201).json({
      success: true,
      message: 'Ghi danh học viên vào lớp thành công',
      data: populated,
      invoice: result.invoiceDoc,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Học viên đã có lượt ghi danh đang hoạt động trong lớp này'
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/classes/:classId/enrollments (Admin, Receptionist, Teacher)
const getClassEnrollments = async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ success: false, message: 'classId không hợp lệ' });
  }

  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    // Authorization for Teacher: must be assigned teacher
    if (req.user.role === 'Teacher') {
      const teacherProfile = await Teacher.findOne({ userId: req.user._id });
      if (!teacherProfile || !classDoc.teacher.equals(teacherProfile._id)) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem danh sách học viên của lớp học khác'
        });
      }
    }

    const query = { class: classId };
    if (req.query.status) {
      query.status = req.query.status;
    } else {
      query.status = 'active'; // Default to active enrollments
    }

    const enrollments = await Enrollment.find(query)
      .populate('student', 'fullName studentCode phone email academicStatus gender dateOfBirth')
      .populate('transferredFrom', 'className classCode')
      .sort('-enrolledAt');

    return res.json({
      success: true,
      data: enrollments,
      total: enrollments.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/students/:studentId/enrollments (Admin, Receptionist, Teacher, Student)
const getStudentEnrollments = async (req, res) => {
  const studentId = req.params.studentId || req.params.id;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: 'studentId không hợp lệ' });
  }

  try {
    const studentDoc = await Student.findById(studentId);
    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }

    // Scope check: Student can only view own enrollments
    if (req.user.role === 'Student') {
      const selfStudent = await Student.findOne({ userId: req.user._id });
      if (!selfStudent || !selfStudent._id.equals(studentDoc._id)) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem lịch sử học tập của học viên khác'
        });
      }
    }

    const enrollments = await Enrollment.find({ student: studentId })
      .populate({
        path: 'class',
        select: 'className classCode skill startDate endDate room status tuitionFee maxCapacity teacher',
        populate: {
          path: 'teacher',
          select: 'fullName teacherCode email phone specialization'
        }
      })
      .populate('transferredFrom', 'className classCode skill')
      .sort('-enrolledAt');

    return res.json({
      success: true,
      data: enrollments,
      total: enrollments.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/enrollments/:id/transfer (Admin, Receptionist)
const transferEnrollment = async (req, res) => {
  const { id } = req.params;
  const { newClassId, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Enrollment ID không hợp lệ' });
  }

  if (!newClassId || !mongoose.Types.ObjectId.isValid(newClassId)) {
    return res.status(400).json({ success: false, message: 'newClassId không hợp lệ' });
  }

  try {
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi ghi danh' });
    }

    if (enrollment.status !== 'active') {
      return res.status(409).json({
        success: false,
        message: 'Chỉ có thể điều chuyển lớp cho lượt ghi danh đang hoạt động (active)'
      });
    }

    if (enrollment.class.toString() === newClassId.toString()) {
      return res.status(409).json({
        success: false,
        message: 'Lớp chuyển đến trùng với lớp học hiện tại'
      });
    }

    const newClass = await Class.findById(newClassId);
    if (!newClass) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học chuyển đến' });
    }

    const invalidStatuses = ['completed', 'cancelled', 'archived'];
    if (invalidStatuses.includes(newClass.status)) {
      return res.status(409).json({
        success: false,
        message: `Lớp chuyển đến đang ở trạng thái [${newClass.status}], không thể nhận học viên`
      });
    }

    // Check capacity of new class
    const activeInNewClass = await Enrollment.countDocuments({
      class: newClassId,
      status: 'active'
    });
    if (activeInNewClass >= newClass.maxCapacity) {
      return res.status(409).json({
        success: false,
        message: `Lớp chuyển đến đã đầy sĩ số (${newClass.maxCapacity}/${newClass.maxCapacity})`
      });
    }

    // Check if student already has active enrollment in new class
    const alreadyActiveInNew = await Enrollment.findOne({
      student: enrollment.student,
      class: newClassId,
      status: 'active'
    });
    if (alreadyActiveInNew) {
      return res.status(409).json({
        success: false,
        message: 'Học viên đã có lượt ghi danh đang hoạt động trong lớp chuyển đến'
      });
    }

    // Check schedule conflict with other active classes (excluding current class being transferred from)
    const scheduleConflict = await checkStudentScheduleConflictOnEnroll(
      enrollment.student,
      newClassId,
      enrollment.class
    );
    if (scheduleConflict) {
      return res.status(409).json({
        success: false,
        message: scheduleConflict.message,
        conflict: scheduleConflict.conflict
      });
    }

    // Perform atomic transfer
    const result = await executeWithSafety(async (session, onRollback) => {
      const oldClassId = enrollment.class;
      const oldNote = enrollment.note;

      // 1. Mark old enrollment as transferred
      enrollment.status = 'transferred';
      enrollment.droppedAt = new Date();
      enrollment.note = reason ? `Chuyển lớp: ${reason}` : 'Chuyển lớp';

      const saveOpt = session ? { session } : {};
      await enrollment.save(saveOpt);

      onRollback(async () => {
        enrollment.status = 'active';
        enrollment.droppedAt = null;
        enrollment.note = oldNote;
        await enrollment.save();
      });

      // 2. Create new enrollment
      const createOpt = session ? { session } : {};
      const [newEnrollment] = await Enrollment.create(
        [
          {
            student: enrollment.student,
            class: newClassId,
            enrolledAt: new Date(),
            status: 'active',
            transferredFrom: oldClassId,
            note: reason || ''
          }
        ],
        createOpt
      );

      onRollback(async () => {
        await Enrollment.findByIdAndDelete(newEnrollment._id);
      });

      return { oldEnrollment: enrollment, newEnrollment };
    });

    const populatedNew = await Enrollment.findById(result.newEnrollment._id)
      .populate('student', 'fullName studentCode phone email')
      .populate('class', 'className classCode skill startDate endDate room')
      .populate('transferredFrom', 'className classCode skill');

    return res.json({
      success: true,
      message: 'Chuyển lớp học cho học viên thành công',
      data: {
        previous: result.oldEnrollment,
        current: populatedNew
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Học viên đã có lượt ghi danh đang hoạt động trong lớp chuyển đến'
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/enrollments/:id/drop (Admin, Receptionist)
const dropEnrollment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Enrollment ID không hợp lệ' });
  }

  try {
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi ghi danh' });
    }

    if (enrollment.status !== 'active') {
      return res.status(409).json({
        success: false,
        message: 'Chỉ có thể thôi học/bảo lưu cho lượt ghi danh đang hoạt động (active)'
      });
    }

    enrollment.status = 'dropped';
    enrollment.droppedAt = new Date();
    enrollment.note = reason ? `Thôi học: ${reason}` : 'Thôi học / Bảo lưu';
    await enrollment.save();

    return res.json({
      success: true,
      message: 'Đã cập nhật trạng thái thôi học / bảo lưu cho lượt ghi danh',
      data: enrollment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  enrollStudent,
  getClassEnrollments,
  getStudentEnrollments,
  transferEnrollment,
  dropEnrollment
};
