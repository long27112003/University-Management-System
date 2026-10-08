const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TuitionInvoice = require('../models/TuitionInvoice');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');

const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body
      ? typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('==================================================');
  console.log('RUNNING PHASE 7 AUTOMATED TEST SUITE: TUITION & PAYMENT');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  await TuitionInvoice.syncIndexes();
  await Payment.syncIndexes();
  console.log('✅ TuitionInvoice and Payment indexes synchronized.\n');

  const results = {};

  const login = async (email, password = 'password123') => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (!res.ok || !res.data?.token) {
      throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
    }
    return res.data.token;
  };

  const adminToken = await login('admin@university.com', 'admin123');
  const adminAuth = { Authorization: `Bearer ${adminToken}` };

  const recepToken = await login('receptionist@university.com', 'receptionist123');
  const recepAuth = { Authorization: `Bearer ${recepToken}` };

  const teacherToken = await login('professor@university.com', 'professor123');
  const teacherAuth = { Authorization: `Bearer ${teacherToken}` };

  const studentAToken = await login('student@university.com', 'student123');
  const studentAAuth = { Authorization: `Bearer ${studentAToken}` };

  const studentUserA = await User.findOne({ email: 'student@university.com' });
  const studentDocA = await Student.findOne({ userId: studentUserA._id });

  let studentDocB = await Student.findOne({ email: /studentB_/ });
  let studentUserB;
  if (!studentDocB) {
    const sBRes = await req('/students', {
      method: 'POST',
      headers: adminAuth,
      body: {
        fullName: 'Học viên B Test Phase 7',
        email: `studentB_${Date.now()}@vlearn.test`,
        phone: '0966666667',
        gender: 'female',
        dateOfBirth: '2002-05-10',
        academicStatus: 'active',
      },
    });
    studentDocB = await Student.findById(sBRes.data.data._id);
    studentUserB = await User.findById(studentDocB.userId);
  } else {
    studentUserB = await User.findById(studentDocB.userId);
  }
  const studentBToken = await login(studentUserB.email, 'student123');
  const studentBAuth = { Authorization: `Bearer ${studentBToken}` };

  const teacherDoc = await Teacher.findOne({});

  // Create a dedicated test class with tuitionFee = 4,500,000 VND
  const testClassCode = `VL-TUI-K${Date.now().toString().slice(-4)}`;
  const testClass = await Class.create({
    className: 'IELTS Tuition Test Class',
    classCode: testClassCode,
    skill: 'speaking',
    teacher: teacherDoc._id,
    courseLevel: 'intensive',
    maxCapacity: 15,
    currentEnrollment: 0,
    tuitionFee: 4500000,
    startDate: new Date('2026-11-01'),
    endDate: new Date('2027-01-31'),
    status: 'active',
    room: 'Room 205',
  });

  let createdInvoiceId = null;
  let firstPaymentId = null;
  let secondPaymentId = null;

  // ----------------------------------------------------
  // TC7.1: Enroll Student -> Auto-creates TuitionInvoice: total=4,500,000, paid=0, remaining=4,500,000, status=unpaid
  // ----------------------------------------------------
  try {
    const enrollRes = await req(`/classes/${testClass._id}/enrollments`, {
      method: 'POST',
      headers: recepAuth,
      body: { studentId: studentDocA._id.toString(), note: 'Đăng ký học khóa mới' },
    });

    const invoice = await TuitionInvoice.findOne({ enrollment: enrollRes.data?.data?._id });
    if (!invoice) throw new Error('Invoice was not auto-created on enrollment');

    if (
      invoice.totalAmount === 4500000 &&
      invoice.paidAmount === 0 &&
      invoice.remainingAmount === 4500000 &&
      invoice.status === 'unpaid' &&
      invoice.invoiceCode.startsWith('INV-')
    ) {
      createdInvoiceId = invoice._id;
      results['TC7.1'] = 'PASS';
      console.log('✅ TC7.1 PASS: Enrolled Student -> Auto-created Invoice with 4.5M, paid 0, remaining 4.5M, status unpaid.');
    } else {
      throw new Error(`Unexpected invoice values: ${JSON.stringify(invoice)}`);
    }
  } catch (err) {
    results['TC7.1'] = 'FAIL';
    console.error('❌ TC7.1 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.2: Receptionist pays 2,000,000 -> paid=2,000,000, remaining=2,500,000, status=partial
  // ----------------------------------------------------
  try {
    const payRes = await req(`/tuition/invoices/${createdInvoiceId}/payments`, {
      method: 'POST',
      headers: recepAuth,
      body: {
        amount: 2000000,
        paymentMethod: 'bank_transfer',
        transactionCode: 'FT2628091823',
        note: 'Nộp học phí đợt 1',
      },
    });

    const updatedInv = await TuitionInvoice.findById(createdInvoiceId);
    firstPaymentId = payRes.data?.data?.payment?._id;

    if (
      payRes.status === 201 &&
      updatedInv.paidAmount === 2000000 &&
      updatedInv.remainingAmount === 2500000 &&
      updatedInv.status === 'partial'
    ) {
      results['TC7.2'] = 'PASS';
      console.log('✅ TC7.2 PASS: Receptionist recorded partial payment (2M). paid=2M, remaining=2.5M, status=partial.');
    } else {
      throw new Error(`Unexpected invoice state: ${JSON.stringify(updatedInv)}`);
    }
  } catch (err) {
    results['TC7.2'] = 'FAIL';
    console.error('❌ TC7.2 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.3: Attempt pay 3,000,000 (Remaining is 2.5M) -> 409 Conflict, no payment created, invoice unchanged
  // ----------------------------------------------------
  try {
    const countBefore = await Payment.countDocuments({ invoice: createdInvoiceId });

    const payRes = await req(`/tuition/invoices/${createdInvoiceId}/payments`, {
      method: 'POST',
      headers: recepAuth,
      body: {
        amount: 3000000,
        paymentMethod: 'cash',
        note: 'Thử thu quá số nợ',
      },
    });

    const countAfter = await Payment.countDocuments({ invoice: createdInvoiceId });
    const invAfter = await TuitionInvoice.findById(createdInvoiceId);

    if (payRes.status === 409 && countBefore === countAfter && invAfter.paidAmount === 2000000) {
      results['TC7.3'] = 'PASS';
      console.log('✅ TC7.3 PASS: Overpayment (3M > 2.5M) rejected with 409 Conflict, invoice unchanged.');
    } else {
      throw new Error(`Overpayment was not properly prevented. status=${payRes.status}`);
    }
  } catch (err) {
    results['TC7.3'] = 'FAIL';
    console.error('❌ TC7.3 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.4: Pay 2,500,000 -> paid=4,500,000, remaining=0, status=paid
  // ----------------------------------------------------
  try {
    const payRes = await req(`/tuition/invoices/${createdInvoiceId}/payments`, {
      method: 'POST',
      headers: recepAuth,
      body: {
        amount: 2500000,
        paymentMethod: 'card',
        transactionCode: 'POS-99881',
        note: 'Nộp đủ phần còn lại',
      },
    });

    const updatedInv = await TuitionInvoice.findById(createdInvoiceId);
    secondPaymentId = payRes.data?.data?.payment?._id;

    if (
      payRes.status === 201 &&
      updatedInv.paidAmount === 4500000 &&
      updatedInv.remainingAmount === 0 &&
      updatedInv.status === 'paid'
    ) {
      results['TC7.4'] = 'PASS';
      console.log('✅ TC7.4 PASS: Paid remaining balance 2.5M. paid=4.5M, remaining=0, status=paid.');
    } else {
      throw new Error(`Unexpected invoice state: ${JSON.stringify(updatedInv)}`);
    }
  } catch (err) {
    results['TC7.4'] = 'FAIL';
    console.error('❌ TC7.4 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.5: Receptionist tries void second payment -> 403 Forbidden
  // ----------------------------------------------------
  try {
    const voidRes = await req(`/payments/${secondPaymentId}/void`, {
      method: 'POST',
      headers: recepAuth,
      body: { voidReason: 'Lễ tân thử hủy thanh toán' },
    });

    if (voidRes.status === 403) {
      results['TC7.5'] = 'PASS';
      console.log('✅ TC7.5 PASS: Receptionist blocked from voiding payment (403 Forbidden).');
    } else {
      throw new Error(`Receptionist was not blocked from voiding payment. status=${voidRes.status}`);
    }
  } catch (err) {
    results['TC7.5'] = 'FAIL';
    console.error('❌ TC7.5 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.6: Admin voids payment 2,500,000 -> payment.status=voided, invoice paid=2M, remaining=2.5M, status=partial
  // ----------------------------------------------------
  try {
    const voidRes = await req(`/payments/${secondPaymentId}/void`, {
      method: 'POST',
      headers: adminAuth,
      body: { voidReason: 'Nhập nhầm số tiền thanh toán của học viên khác' },
    });

    const paymentDoc = await Payment.findById(secondPaymentId);
    const invoiceDoc = await TuitionInvoice.findById(createdInvoiceId);

    if (
      voidRes.status === 200 &&
      paymentDoc.status === 'voided' &&
      paymentDoc.voidReason === 'Nhập nhầm số tiền thanh toán của học viên khác' &&
      invoiceDoc.paidAmount === 2000000 &&
      invoiceDoc.remainingAmount === 2500000 &&
      invoiceDoc.status === 'partial'
    ) {
      results['TC7.6'] = 'PASS';
      console.log('✅ TC7.6 PASS: Admin voided payment. Payment preserved as voided; invoice recalculated to 2M paid, 2.5M remaining, status partial.');
    } else {
      throw new Error(`Unexpected state after void: ${JSON.stringify(invoiceDoc)}`);
    }
  } catch (err) {
    results['TC7.6'] = 'FAIL';
    console.error('❌ TC7.6 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.7: Void same payment again -> 409 Conflict
  // ----------------------------------------------------
  try {
    const voidRes = await req(`/payments/${secondPaymentId}/void`, {
      method: 'POST',
      headers: adminAuth,
      body: { voidReason: 'Thử hủy lại lần hai' },
    });

    if (voidRes.status === 409) {
      results['TC7.7'] = 'PASS';
      console.log('✅ TC7.7 PASS: Double-void rejected with 409 Conflict.');
    } else {
      throw new Error(`Double-void was not rejected with 409 Conflict. status=${voidRes.status}`);
    }
  } catch (err) {
    results['TC7.7'] = 'FAIL';
    console.error('❌ TC7.7 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.8: Student self invoices -> only own data
  // ----------------------------------------------------
  try {
    const resA = await req('/student/me/invoices', { headers: studentAAuth });
    const resB = await req('/student/me/invoices', { headers: studentBAuth });

    const hasOnlyA = resA.data?.data?.every((inv) => inv.student.toString() === studentDocA._id.toString());
    const hasOnlyB = resB.data?.data?.every((inv) => inv.student.toString() === studentDocB._id.toString());

    if (hasOnlyA && hasOnlyB && resA.data?.data?.length > 0) {
      results['TC7.8'] = 'PASS';
      console.log(`✅ TC7.8 PASS: Student A retrieved ${resA.data.data.length} invoices, strictly scoped to own data.`);
    } else {
      throw new Error(`Data isolation failed: A count=${resA.data?.data?.length}, B count=${resB.data?.data?.length}`);
    }
  } catch (err) {
    results['TC7.8'] = 'FAIL';
    console.error('❌ TC7.8 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.9: Student self payments -> only own data
  // ----------------------------------------------------
  try {
    const resA = await req('/student/me/payments', { headers: studentAAuth });
    const resB = await req('/student/me/payments', { headers: studentBAuth });

    const allBelongA = resA.data?.data?.every((p) => p.student.toString() === studentDocA._id.toString());
    const anyBHasA = resB.data?.data?.some((p) => p.student.toString() === studentDocA._id.toString());

    if (allBelongA && !anyBHasA && resA.data?.data?.length > 0) {
      results['TC7.9'] = 'PASS';
      console.log(`✅ TC7.9 PASS: Student A retrieved ${resA.data.data.length} payments, Student B has 0 of A's payments.`);
    } else {
      throw new Error(`Payment isolation failed: A=${resA.data?.data?.length}, anyBHasA=${anyBHasA}`);
    }
  } catch (err) {
    results['TC7.9'] = 'FAIL';
    console.error('❌ TC7.9 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.10: Teacher requests GET /api/tuition/invoices -> 403 Forbidden
  // ----------------------------------------------------
  try {
    const res = await req('/tuition/invoices', { headers: teacherAuth });
    if (res.status === 403) {
      results['TC7.10'] = 'PASS';
      console.log('✅ TC7.10 PASS: Teacher access to tuition API strictly blocked with 403 Forbidden.');
    } else {
      throw new Error(`Teacher was not blocked from tuition API. status=${res.status}`);
    }
  } catch (err) {
    results['TC7.10'] = 'FAIL';
    console.error('❌ TC7.10 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.11: Client attempts to PUT paidAmount = 0 -> rejected with 422
  // ----------------------------------------------------
  try {
    const res = await req(`/tuition/invoices/${createdInvoiceId}`, {
      method: 'PUT',
      headers: recepAuth,
      body: { paidAmount: 0 },
    });

    if (res.status === 422) {
      results['TC7.11'] = 'PASS';
      console.log('✅ TC7.11 PASS: Client attempt to tamper with paidAmount directly rejected with 422 Unprocessable Entity.');
    } else {
      throw new Error(`Client attempt to edit paidAmount was not rejected with 422. status=${res.status}`);
    }
  } catch (err) {
    results['TC7.11'] = 'FAIL';
    console.error('❌ TC7.11 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.12: Force failure after Payment create inside transaction -> transaction rolls back, no payment remains
  // ----------------------------------------------------
  try {
    const paymentCountBefore = await Payment.countDocuments({ invoice: createdInvoiceId });

    const failRes = await req(`/tuition/invoices/${createdInvoiceId}/payments`, {
      method: 'POST',
      headers: {
        ...recepAuth,
        'x-test-force-tx-failure': 'payment-step',
      },
      body: { amount: 500000, paymentMethod: 'cash', note: 'Simulate crash' },
    });

    const paymentCountAfter = await Payment.countDocuments({ invoice: createdInvoiceId });
    if (!failRes.ok && paymentCountBefore === paymentCountAfter) {
      results['TC7.12'] = 'PASS';
      console.log('✅ TC7.12 PASS: Forced failure rolled back Payment creation inside transaction (count before == after).');
    } else {
      throw new Error(`Rollback failed! countBefore=${paymentCountBefore}, countAfter=${paymentCountAfter}`);
    }
  } catch (err) {
    results['TC7.12'] = 'FAIL';
    console.error('❌ TC7.12 FAIL:', err.message);
  }

  // ----------------------------------------------------
  // TC7.13: Force Enrollment invoice creation failure -> Enrollment rollback, no orphan enrollment
  // ----------------------------------------------------
  try {
    const enrollmentCountBefore = await Enrollment.countDocuments({ student: studentDocB._id, class: testClass._id });

    const failRes = await req(`/classes/${testClass._id}/enrollments`, {
      method: 'POST',
      headers: {
        ...recepAuth,
        'x-test-force-invoice-failure': 'true',
      },
      body: { studentId: studentDocB._id.toString(), note: 'Simulate invoice fail' },
    });

    const enrollmentCountAfter = await Enrollment.countDocuments({ student: studentDocB._id, class: testClass._id });
    if (!failRes.ok && enrollmentCountBefore === enrollmentCountAfter) {
      results['TC7.13'] = 'PASS';
      console.log('✅ TC7.13 PASS: Forced invoice creation failure rolled back Enrollment (no orphan enrollment created).');
    } else {
      throw new Error(`Enrollment rollback failed! before=${enrollmentCountBefore}, after=${enrollmentCountAfter}`);
    }
  } catch (err) {
    results['TC7.13'] = 'FAIL';
    console.error('❌ TC7.13 FAIL:', err.message);
  }

  // Cleanup test class and its records
  await Payment.deleteMany({ invoice: createdInvoiceId });
  await TuitionInvoice.deleteMany({ class: testClass._id });
  await Enrollment.deleteMany({ class: testClass._id });
  await Class.findByIdAndDelete(testClass._id);

  console.log('\n==================================================');
  console.log('SUMMARY OF PHASE 7 TEST RESULTS:');
  console.log('==================================================');
  console.table(results);

  await mongoose.disconnect();

  const allPass = Object.values(results).every((r) => r === 'PASS');
  process.exit(allPass ? 0 : 1);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
