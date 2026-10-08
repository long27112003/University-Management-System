const mongoose = require('mongoose');
const TuitionInvoice = require('../models/TuitionInvoice');
const Payment = require('../models/Payment');

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

/**
 * Execute work inside a real MongoDB multi-document session transaction
 * Fallback to standard execution on standalone MongoDB (dev environment)
 */
const runInTransaction = async (workFn) => {
  const supportsTransactions = await checkReplicaSet();
  if (supportsTransactions) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const result = await workFn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    // Standalone MongoDB (Local dev)
    return await workFn(null);
  }
};

/**
 * Generate unique invoiceCode with retry protection
 */
const generateInvoiceCode = async (session) => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  for (let attempt = 0; attempt < 10; attempt++) {
    const lastDoc = await TuitionInvoice.findOne({
      invoiceCode: new RegExp(`^${prefix}`)
    })
      .sort({ invoiceCode: -1 })
      .session(session || null);

    let nextSeq = 1;
    if (lastDoc && lastDoc.invoiceCode) {
      const match = lastDoc.invoiceCode.match(/INV-\d{4}-(\d+)/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1 + attempt;
      }
    } else {
      nextSeq += attempt;
    }

    const code = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    const exists = await TuitionInvoice.findOne({ invoiceCode: code }).session(session || null);
    if (!exists) {
      return code;
    }
  }

  // Fallback random
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomSuffix}`;
};

/**
 * Generate unique paymentCode with retry protection
 */
const generatePaymentCode = async (session) => {
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const lastDoc = await Payment.findOne({
      paymentCode: new RegExp(`^${prefix}`)
    })
      .sort({ paymentCode: -1 })
      .session(session || null);

    let nextSeq = 1;
    if (lastDoc && lastDoc.paymentCode) {
      const match = lastDoc.paymentCode.match(/PAY-\d{4}-(\d+)/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1 + attempt;
      }
    } else {
      nextSeq += attempt;
    }

    const code = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    const exists = await Payment.findOne({ paymentCode: code }).session(session || null);
    if (!exists) {
      return code;
    }
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomSuffix}`;
};

/**
 * Calculate authoritative financial amounts and status from completed payments
 */
const recalculateInvoiceFinancials = async (invoiceId, session) => {
  const invoice = session
    ? await TuitionInvoice.findById(invoiceId).session(session)
    : await TuitionInvoice.findById(invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  const payments = session
    ? await Payment.find({ invoice: invoiceId, status: 'completed' }).session(session)
    : await Payment.find({ invoice: invoiceId, status: 'completed' });

  const authoritativePaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, invoice.totalAmount - authoritativePaid);

  invoice.paidAmount = authoritativePaid;
  invoice.remainingAmount = remaining;

  if (invoice.status !== 'cancelled') {
    if (remaining === 0) {
      invoice.status = 'paid';
    } else if (authoritativePaid > 0) {
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

  await invoice.save(session ? { session } : {});
  return invoice;
};

/**
 * Check dynamic effective overdue status for query/display
 */
const getEffectiveInvoiceStatus = (invoice) => {
  if (invoice.status === 'cancelled') return 'cancelled';
  if (invoice.remainingAmount === 0) return 'paid';
  if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.remainingAmount > 0) {
    return 'overdue';
  }
  return invoice.status;
};

module.exports = {
  runInTransaction,
  generateInvoiceCode,
  generatePaymentCode,
  recalculateInvoiceFinancials,
  getEffectiveInvoiceStatus,
};
