const mongoose = require('mongoose');

const tuitionInvoiceSchema = new mongoose.Schema(
  {
    invoiceCode: {
      type: String,
      required: [true, 'Mã hóa đơn là bắt buộc'],
      unique: true,
      trim: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Học viên là bắt buộc'],
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Ghi danh là bắt buộc'],
      unique: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Tổng học phí là bắt buộc'],
      min: [0, 'Tổng học phí không được âm'],
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Số tiền đã thanh toán không được âm'],
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: [0, 'Số tiền còn lại không được âm'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['unpaid', 'partial', 'paid', 'overdue', 'cancelled'],
        message: 'Trạng thái hóa đơn không hợp lệ',
      },
      default: 'unpaid',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người tạo hóa đơn là bắt buộc'],
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Additional compound lookup indexes specified in 03-data-model-spec.md
tuitionInvoiceSchema.index({ student: 1, status: 1 });
tuitionInvoiceSchema.index({ class: 1, status: 1 });

const TuitionInvoice = mongoose.model('TuitionInvoice', tuitionInvoiceSchema);

module.exports = TuitionInvoice;
