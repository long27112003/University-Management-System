const mongoose = require('mongoose');
const TuitionInvoice = require('../models/TuitionInvoice');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const {
  runInTransaction,
  generateInvoiceCode,
  generatePaymentCode,
  recalculateInvoiceFinancials,
  getEffectiveInvoiceStatus,
} = require('../services/tuitionService');

// GET /api/tuition/invoices (Admin, Receptionist)
const getInvoices = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.studentId && mongoose.Types.ObjectId.isValid(req.query.studentId)) {
      query.student = req.query.studentId;
    }

    if (req.query.classId && mongoose.Types.ObjectId.isValid(req.query.classId)) {
      query.class = req.query.classId;
    }

    if (req.query.status) {
      if (req.query.status === 'overdue') {
        query.status = { $ne: 'cancelled' };
        query.remainingAmount = { $gt: 0 };
        query.dueDate = { $lt: new Date() };
      } else {
        query.status = req.query.status;
      }
    }

    if (req.query.overdue === 'true') {
      query.status = { $ne: 'cancelled' };
      query.remainingAmount = { $gt: 0 };
      query.dueDate = { $lt: new Date() };
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [{ invoiceCode: searchRegex }, { note: searchRegex }];
    }

    const [invoices, total] = await Promise.all([
      TuitionInvoice.find(query)
        .populate('student', 'fullName studentCode phone email academicStatus')
        .populate('class', 'className classCode skill startDate endDate tuitionFee')
        .populate('createdBy', 'name email role')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      TuitionInvoice.countDocuments(query),
    ]);

    const formatted = invoices.map((inv) => {
      const doc = inv.toObject();
      doc.effectiveStatus = getEffectiveInvoiceStatus(inv);
      return doc;
    });

    return res.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tuition/invoices/:id (Admin, Receptionist)
const getInvoiceById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'ID hóa đơn không hợp lệ' });
  }

  try {
    const invoice = await TuitionInvoice.findById(id)
      .populate('student', 'fullName studentCode phone email address academicStatus')
      .populate('class', 'className classCode skill startDate endDate room tuitionFee')
      .populate('enrollment', 'status enrolledAt')
      .populate('createdBy', 'name email role');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn học phí' });
    }

    const payments = await Payment.find({ invoice: invoice._id })
      .populate('createdBy', 'name email role')
      .populate('voidedBy', 'name email role')
      .sort('-paymentDate -createdAt');

    const result = invoice.toObject();
    result.effectiveStatus = getEffectiveInvoiceStatus(invoice);
    result.payments = payments;

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tuition/invoices (Admin, Receptionist - Manual creation)
const createManualInvoice = async (req, res) => {
  const { student, enrollment, class: classId, totalAmount, dueDate, note } = req.body;

  if (!student || !mongoose.Types.ObjectId.isValid(student)) {
    return res.status(400).json({ success: false, message: 'student ID không hợp lệ' });
  }
  if (!enrollment || !mongoose.Types.ObjectId.isValid(enrollment)) {
    return res.status(400).json({ success: false, message: 'enrollment ID không hợp lệ' });
  }
  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ success: false, message: 'class ID không hợp lệ' });
  }
  if (typeof totalAmount !== 'number' || totalAmount < 0) {
    return res.status(422).json({ success: false, message: 'totalAmount phải là số không âm' });
  }

  try {
    const enrollDoc = await Enrollment.findById(enrollment);
    if (!enrollDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lượt ghi danh' });
    }

    if (enrollDoc.student.toString() !== student.toString()) {
      return res.status(422).json({
        success: false,
        message: 'Lượt ghi danh không khớp với học viên được chọn',
      });
    }

    if (enrollDoc.class.toString() !== classId.toString()) {
      return res.status(422).json({
        success: false,
        message: 'Lượt ghi danh không khớp với lớp học được chọn',
      });
    }

    const existingInvoice = await TuitionInvoice.findOne({ enrollment });
    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        message: 'Lượt ghi danh này đã có hóa đơn học phí tương ứng',
      });
    }

    const invoiceCode = await generateInvoiceCode();

    const invoice = await TuitionInvoice.create({
      invoiceCode,
      student,
      enrollment,
      class: classId,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      status: 'unpaid',
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: req.user._id,
      note: note || '',
    });

    const populated = await TuitionInvoice.findById(invoice._id)
      .populate('student', 'fullName studentCode phone email')
      .populate('class', 'className classCode skill')
      .populate('createdBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Tạo hóa đơn học phí thành công',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Trùng lặp mã hóa đơn hoặc lượt ghi danh đã có hóa đơn',
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tuition/invoices/:id (Admin, Receptionist)
const updateInvoice = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'ID hóa đơn không hợp lệ' });
  }

  // CRITICAL: Reject client attempts to directly manipulate derived financial balances
  if ('paidAmount' in req.body || 'remainingAmount' in req.body || 'totalAmount' in req.body) {
    return res.status(422).json({
      success: false,
      message: 'Không được phép cập nhật trực tiếp số tiền học phí hay công nợ. Vui lòng ghi nhận thanh toán.',
    });
  }

  try {
    const invoice = await TuitionInvoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn học phí' });
    }

    if (req.body.dueDate !== undefined) {
      invoice.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }

    if (req.body.note !== undefined) {
      invoice.note = req.body.note;
    }

    if (req.body.status && req.body.status === 'cancelled') {
      if (invoice.paidAmount > 0) {
        return res.status(409).json({
          success: false,
          message: 'Không thể hủy hóa đơn đã có phát sinh thanh toán',
        });
      }
      invoice.status = 'cancelled';
    }

    // Recalculate status if dueDate changed
    if (invoice.status !== 'cancelled') {
      if (invoice.remainingAmount === 0) {
        invoice.status = 'paid';
      } else if (invoice.paidAmount > 0) {
        if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
          invoice.status = 'overdue';
        } else {
          invoice.status = 'partial';
        }
      } else {
        if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
          invoice.status = 'overdue';
        } else {
          invoice.status = 'unpaid';
        }
      }
    }

    await invoice.save();

    const populated = await TuitionInvoice.findById(invoice._id)
      .populate('student', 'fullName studentCode phone email')
      .populate('class', 'className classCode skill')
      .populate('createdBy', 'name email role');

    return res.json({
      success: true,
      message: 'Cập nhật hóa đơn thành công',
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tuition/invoices/:invoiceId/payments (Admin, Receptionist)
const createPayment = async (req, res) => {
  const { invoiceId } = req.params;
  const { amount, paymentMethod, transactionCode, note } = req.body;

  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    return res.status(400).json({ success: false, message: 'ID hóa đơn không hợp lệ' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(422).json({
      success: false,
      message: 'Số tiền thanh toán phải là số lớn hơn 0',
    });
  }

  const validMethods = ['cash', 'bank_transfer', 'card'];
  if (paymentMethod && !validMethods.includes(paymentMethod)) {
    return res.status(422).json({
      success: false,
      message: 'Phương thức thanh toán phải là cash, bank_transfer hoặc card',
    });
  }

  try {
    const result = await runInTransaction(async (session) => {
      // 1. Load invoice inside session
      const invoice = await TuitionInvoice.findById(invoiceId).session(session);
      if (!invoice) {
        const err = new Error('Không tìm thấy hóa đơn học phí');
        err.statusCode = 404;
        throw err;
      }

      if (invoice.status === 'cancelled') {
        const err = new Error('Hóa đơn đã bị hủy, không thể thu tiền');
        err.statusCode = 409;
        throw err;
      }

      if (invoice.remainingAmount <= 0) {
        const err = new Error('Hóa đơn này đã hoàn tất thanh toán, không còn công nợ');
        err.statusCode = 409;
        throw err;
      }

      // 2. Prevent overpayment (TC7.3)
      if (amount > invoice.remainingAmount) {
        const err = new Error(
          `Số tiền thanh toán (${amount.toLocaleString('vi-VN')} đ) vượt quá số nợ còn lại (${invoice.remainingAmount.toLocaleString('vi-VN')} đ)`
        );
        err.statusCode = 409;
        throw err;
      }

      // 3. Generate payment code
      const paymentCode = await generatePaymentCode(session);

      // 4. Create Payment inside session
      const [newPayment] = await Payment.create(
        [
          {
            paymentCode,
            invoice: invoice._id,
            student: invoice.student,
            amount,
            paymentDate: new Date(),
            paymentMethod: paymentMethod || 'cash',
            transactionCode: transactionCode || '',
            status: 'completed',
            note: note || '',
            createdBy: req.user._id,
          },
        ],
        { session }
      );

      // Support simulated test failure hook for TC7.12
      if (req.headers['x-test-force-tx-failure'] === 'payment-step') {
        throw new Error('Simulated transaction failure after payment creation');
      }

      // 5. Authoritative recalculation of invoice within transaction
      const updatedInvoice = await recalculateInvoiceFinancials(invoice._id, session);

      return {
        payment: newPayment,
        invoice: updatedInvoice,
      };
    });

    const populatedPayment = await Payment.findById(result.payment._id)
      .populate('createdBy', 'name email role')
      .populate('student', 'fullName studentCode');

    return res.status(201).json({
      success: true,
      message: 'Ghi nhận thanh toán thành công',
      data: {
        payment: populatedPayment,
        invoice: {
          _id: result.invoice._id,
          invoiceCode: result.invoice.invoiceCode,
          totalAmount: result.invoice.totalAmount,
          paidAmount: result.invoice.paidAmount,
          remainingAmount: result.invoice.remainingAmount,
          status: result.invoice.status,
          effectiveStatus: getEffectiveInvoiceStatus(result.invoice),
        },
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tuition/invoices/:invoiceId/payments (Admin, Receptionist)
const getInvoicePayments = async (req, res) => {
  const { invoiceId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    return res.status(400).json({ success: false, message: 'ID hóa đơn không hợp lệ' });
  }

  try {
    const payments = await Payment.find({ invoice: invoiceId })
      .populate('createdBy', 'name email role')
      .populate('voidedBy', 'name email role')
      .populate('student', 'fullName studentCode')
      .sort('-paymentDate -createdAt');

    return res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/payments/:id (Admin, Receptionist)
const getPaymentById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'ID thanh toán không hợp lệ' });
  }

  try {
    const payment = await Payment.findById(id)
      .populate('invoice', 'invoiceCode totalAmount paidAmount remainingAmount status')
      .populate('student', 'fullName studentCode phone email')
      .populate('createdBy', 'name email role')
      .populate('voidedBy', 'name email role');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu thu' });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/payments/:id/void (Admin only)
const voidPayment = async (req, res) => {
  const { id } = req.params;
  const { voidReason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'ID thanh toán không hợp lệ' });
  }

  if (!voidReason || typeof voidReason !== 'string' || voidReason.trim().length < 10) {
    return res.status(422).json({
      success: false,
      message: 'Lý do hủy giao dịch là bắt buộc và phải có ít nhất 10 ký tự',
    });
  }

  try {
    const result = await runInTransaction(async (session) => {
      const payment = await Payment.findById(id).session(session);
      if (!payment) {
        const err = new Error('Không tìm thấy phiếu thu');
        err.statusCode = 404;
        throw err;
      }

      // Double-void protection (TC7.7)
      if (payment.status === 'voided') {
        const err = new Error('Giao dịch này đã bị hủy trước đó');
        err.statusCode = 409;
        throw err;
      }

      payment.status = 'voided';
      payment.voidReason = voidReason.trim();
      payment.voidedBy = req.user._id;
      payment.voidedAt = new Date();

      await payment.save({ session });

      // Recalculate invoice inside session
      const updatedInvoice = await recalculateInvoiceFinancials(payment.invoice, session);

      return {
        payment,
        invoice: updatedInvoice,
      };
    });

    const populatedPayment = await Payment.findById(result.payment._id)
      .populate('createdBy', 'name email role')
      .populate('voidedBy', 'name email role')
      .populate('student', 'fullName studentCode');

    return res.json({
      success: true,
      message: 'Hủy phiếu thu thành công. Công nợ học viên đã được tính toán lại.',
      data: {
        payment: populatedPayment,
        invoice: {
          _id: result.invoice._id,
          invoiceCode: result.invoice.invoiceCode,
          totalAmount: result.invoice.totalAmount,
          paidAmount: result.invoice.paidAmount,
          remainingAmount: result.invoice.remainingAmount,
          status: result.invoice.status,
          effectiveStatus: getEffectiveInvoiceStatus(result.invoice),
        },
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/student/me/invoices (Student only)
const getStudentSelfInvoices = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học viên' });
    }

    const invoices = await TuitionInvoice.find({ student: student._id })
      .populate('class', 'className classCode skill startDate endDate room')
      .sort('-createdAt');

    const formatted = invoices.map((inv) => {
      const doc = inv.toObject();
      doc.effectiveStatus = getEffectiveInvoiceStatus(inv);
      return doc;
    });

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/student/me/payments (Student only)
const getStudentSelfPayments = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học viên' });
    }

    const payments = await Payment.find({ student: student._id })
      .populate({
        path: 'invoice',
        select: 'invoiceCode class totalAmount status',
        populate: { path: 'class', select: 'className classCode' },
      })
      .sort('-paymentDate -createdAt');

    return res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/students/:id/invoices (Admin, Receptionist)
const getStudentInvoices = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'ID học viên không hợp lệ' });
  }

  try {
    const invoices = await TuitionInvoice.find({ student: id })
      .populate('class', 'className classCode skill startDate endDate room tuitionFee')
      .populate('createdBy', 'name email role')
      .sort('-createdAt');

    const formatted = invoices.map((inv) => {
      const doc = inv.toObject();
      doc.effectiveStatus = getEffectiveInvoiceStatus(inv);
      return doc;
    });

    const payments = await Payment.find({ student: id })
      .populate('invoice', 'invoiceCode totalAmount paidAmount remainingAmount status')
      .populate('createdBy', 'name email role')
      .populate('voidedBy', 'name email role')
      .sort('-paymentDate -createdAt');

    return res.json({
      success: true,
      data: {
        invoices: formatted,
        payments,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createManualInvoice,
  updateInvoice,
  createPayment,
  getInvoicePayments,
  getPaymentById,
  voidPayment,
  getStudentSelfInvoices,
  getStudentSelfPayments,
  getStudentInvoices,
};
