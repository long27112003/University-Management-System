const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentCode: {
      type: String,
      required: [true, 'Mã phiếu thu là bắt buộc'],
      unique: true,
      trim: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TuitionInvoice',
      required: [true, 'Hóa đơn học phí là bắt buộc'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Học viên là bắt buộc'],
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền thanh toán là bắt buộc'],
      validate: {
        validator: function (v) {
          return typeof v === 'number' && v > 0;
        },
        message: 'Số tiền thanh toán phải lớn hơn 0',
      },
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: {
        values: ['cash', 'bank_transfer', 'card'],
        message: 'Phương thức thanh toán phải là cash, bank_transfer hoặc card',
      },
      default: 'cash',
    },
    transactionCode: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['completed', 'voided'],
        message: 'Trạng thái thanh toán phải là completed hoặc voided',
      },
      default: 'completed',
    },
    voidReason: {
      type: String,
      default: '',
      trim: true,
    },
    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    voidedAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người thu tiền là bắt buộc'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Additional compound lookup indexes specified in 03-data-model-spec.md
paymentSchema.index({ invoice: 1, status: 1 });
paymentSchema.index({ student: 1, status: 1 });
paymentSchema.index({ paymentDate: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
