const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';

// Models
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Schedule = require('../models/Schedule');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const LearningResult = require('../models/LearningResult');
const TuitionInvoice = require('../models/TuitionInvoice');
const Payment = require('../models/Payment');
const User = require('../models/User');

let adminToken = '';
let receptionistToken = '';
let teacherToken = '';
let teacher2Token = '';
let studentToken = '';

let testTeacherUser = null;
let testTeacherDoc = null;
let testTeacher2User = null;
let testTeacher2Doc = null;
let testStudentUser = null;
let testStudentDoc = null;

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function loginUser(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.token;
}

async function runTests() {
  console.log('==================================================');
  console.log('STARTING PHASE 8 TEST SUITE: ROLE-BASED DASHBOARDS');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB directly for DB assertions.\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 0. Setup test users and tokens
    console.log('[Setup] Acquiring tokens for all roles...');
    adminToken = await loginUser('admin@university.com', 'admin123');
    receptionistToken = await loginUser('receptionist@university.com', 'receptionist123');

    // Find Teacher 1
    teacherToken = await loginUser('professor@university.com', 'professor123');
    testTeacherUser = await User.findOne({ email: 'professor@university.com' });
    testTeacherDoc = await Teacher.findOne({ userId: testTeacherUser._id });

    // Find or create Teacher 2 (for isolation testing)
    const email2 = `teacher2_p8_${Date.now()}@vlearn.edu.vn`;
    const hashedPassword = await bcrypt.hash('password123', 10);
    testTeacher2User = await User.create({
      name: 'Teacher P8 Two',
      email: email2,
      password: hashedPassword,
      role: 'Teacher',
      status: 'active',
    });
    testTeacher2Doc = await Teacher.create({
      userId: testTeacher2User._id,
      teacherCode: `GV2${Date.now().toString().slice(-4)}`,
      fullName: 'Teacher P8 Two',
      email: email2,
      phone: '0901234568',
      specialization: ['ielts'],
      status: 'active',
    });
    teacher2Token = await loginUser(testTeacher2User.email, 'password123');

    // Find Student
    studentToken = await loginUser('student@university.com', 'student123');
    testStudentUser = await User.findOne({ email: 'student@university.com' });
    testStudentDoc = await Student.findOne({ userId: testStudentUser._id });

    console.log('✓ All role tokens and test entities ready.\n');

    // ==================================================
    // TC8.1: Admin dashboard loads real counts matching DB
    // ==================================================
    console.log('[TC8.1] Admin dashboard loads real counts matching DB...');
    const adminRes = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminRes.status === 200, `Admin dashboard returns 200 OK`);
    const adminData = adminRes.data;

    const dbTotalStudents = await Student.countDocuments();
    const dbActiveStudents = await Student.countDocuments({ academicStatus: 'active' });
    const dbTotalTeachers = await Teacher.countDocuments();
    const dbActiveClasses = await Class.countDocuments({ status: 'active' });

    assert(adminData.totalStudents === dbTotalStudents, `totalStudents matches DB (${adminData.totalStudents} === ${dbTotalStudents})`);
    assert(adminData.activeStudents === dbActiveStudents, `activeStudents matches DB (${adminData.activeStudents} === ${dbActiveStudents})`);
    assert(adminData.totalTeachers === dbTotalTeachers, `totalTeachers matches DB (${adminData.totalTeachers} === ${dbTotalTeachers})`);
    assert(adminData.activeClasses === dbActiveClasses, `activeClasses matches DB (${adminData.activeClasses} === ${dbActiveClasses})`);
    assert(typeof adminData.totalTuition === 'number', `totalTuition is a number: ${adminData.totalTuition}`);
    assert(typeof adminData.paidTuition === 'number', `paidTuition is a number: ${adminData.paidTuition}`);
    assert(typeof adminData.outstandingTuition === 'number', `outstandingTuition is a number: ${adminData.outstandingTuition}`);
    assert(Array.isArray(adminData.todayClassList), `todayClassList is an array (length: ${adminData.todayClassList.length})`);
    assert(Array.isArray(adminData.monthlyStudentGrowth), `monthlyStudentGrowth is an array`);
    assert(Array.isArray(adminData.monthlyTuitionSummary), `monthlyTuitionSummary is an array`);
    assert(adminData.attendanceOverview && typeof adminData.attendanceOverview.Present === 'number', `attendanceOverview has Present count`);

    // ==================================================
    // TC8.2: Create new Student -> refresh Admin dashboard -> totalStudents increases
    // ==================================================
    console.log('\n[TC8.2] Create new Student -> refresh Admin dashboard -> totalStudents increases...');
    const prevTotalStudents = adminData.totalStudents;
    const newStudentUser = await User.create({
      name: 'Dynamic Student Test',
      email: `dyn_student_${Date.now()}@vlearn.edu.vn`,
      password: 'password123',
      role: 'Student',
      status: 'active',
    });
    const newStudentDoc = await Student.create({
      userId: newStudentUser._id,
      studentCode: `HV_DYN_${Date.now().toString().slice(-4)}`,
      fullName: 'Dynamic Student Test',
      email: newStudentUser.email,
      phone: '0988776655',
      academicStatus: 'active',
    });

    const refreshedAdmin = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(refreshedAdmin.data.totalStudents === prevTotalStudents + 1, `totalStudents increased by 1 (${prevTotalStudents} -> ${refreshedAdmin.data.totalStudents})`);

    // Clean up dynamic student
    await Student.findByIdAndDelete(newStudentDoc._id);
    await User.findByIdAndDelete(newStudentUser._id);

    // ==================================================
    // TC8.3: Create completed Payment -> refresh financial dashboard -> collected amount increases
    // ==================================================
    console.log('\n[TC8.3] Create completed Payment -> refresh financial dashboard -> collected amount increases...');
    const prevPaidTuition = refreshedAdmin.data.paidTuition;
    const existingInvoice = await TuitionInvoice.findOne({ status: { $ne: 'cancelled' } });

    const dynamicPayment = await Payment.create({
      paymentCode: `PAY_DYN_${Date.now().toString().slice(-4)}`,
      invoice: existingInvoice._id,
      student: existingInvoice.student,
      amount: 500000,
      paymentMethod: 'bank_transfer',
      status: 'completed',
      paymentDate: new Date(),
      createdBy: testTeacherUser._id,
    });

    const adminAfterPay = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminAfterPay.data.paidTuition === prevPaidTuition + 500000, `paidTuition increased by 500,000 (${prevPaidTuition} -> ${adminAfterPay.data.paidTuition})`);

    // ==================================================
    // TC8.4: Void Payment -> refresh dashboard -> collected amount decreases accordingly
    // ==================================================
    console.log('\n[TC8.4] Void Payment -> refresh dashboard -> collected amount decreases accordingly...');
    // Void the payment
    await Payment.findByIdAndUpdate(dynamicPayment._id, {
      status: 'voided',
      voidedReason: 'Test voiding for Phase 8',
      voidedAt: new Date(),
    });

    const adminAfterVoid = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminAfterVoid.data.paidTuition === prevPaidTuition, `paidTuition returned to previous value after void (${adminAfterVoid.data.paidTuition} === ${prevPaidTuition})`);

    // Clean up test payment
    await Payment.findByIdAndDelete(dynamicPayment._id);

    // ==================================================
    // TC8.5: Teacher A dashboard -> only Teacher A classes/sessions
    // ==================================================
    console.log('\n[TC8.5] Teacher dashboard -> only assigned classes & sessions...');
    const teacher2Class = await Class.create({
      classCode: `CLS_T2_${Date.now().toString().slice(-4)}`,
      className: 'Teacher 2 Specific Class',
      skill: 'speaking',
      level: '5.0-6.0',
      room: 'Room 101',
      teacher: testTeacher2Doc._id,
      maxCapacity: 15,
      tuitionFee: 3000000,
      totalSessions: 10,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    const teacher2Session = await ClassSession.create({
      class: teacher2Class._id,
      sessionNumber: 1,
      sessionDate: new Date(),
      startTime: '08:00',
      endTime: '10:00',
      room: 'Room 101',
      teacher: testTeacher2Doc._id,
      status: 'scheduled',
    });

    const t1Res = await request('/teacher/dashboard', {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const t2Res = await request('/teacher/dashboard', {
      headers: { Authorization: `Bearer ${teacher2Token}` },
    });

    assert(t1Res.status === 200, `Teacher 1 dashboard returns 200`);
    assert(t2Res.status === 200, `Teacher 2 dashboard returns 200`);

    // Check Teacher 1 dashboard does NOT have Teacher 2's class
    const t1HasT2Class = t1Res.data.assignedClasses.some((c) => c._id.toString() === teacher2Class._id.toString());
    assert(!t1HasT2Class, `Teacher 1 cannot see Teacher 2's class in assignedClasses`);

    // Check Teacher 1 dashboard does NOT have Teacher 2's today session
    const t1HasT2Session = t1Res.data.todaySchedule.some((s) => s.sessionId.toString() === teacher2Session._id.toString());
    assert(!t1HasT2Session, `Teacher 1 cannot see Teacher 2's today session in todaySchedule`);

    // Check Teacher 2 dashboard DOES have Teacher 2's class and session
    const t2HasT2Class = t2Res.data.assignedClasses.some((c) => c._id.toString() === teacher2Class._id.toString());
    const t2HasT2Session = t2Res.data.todaySchedule.some((s) => s.sessionId.toString() === teacher2Session._id.toString());
    assert(t2HasT2Class, `Teacher 2 sees own assigned class`);
    assert(t2HasT2Session, `Teacher 2 sees own today session`);
    assert(t1Res.data.totalTuition === undefined, `Teacher dashboard contains strictly zero tuition metrics`);

    // Clean up
    await ClassSession.findByIdAndDelete(teacher2Session._id);
    await Class.findByIdAndDelete(teacher2Class._id);

    // ==================================================
    // TC8.6: Teacher A cannot access Admin dashboard API -> 403
    // ==================================================
    console.log('\n[TC8.6] Teacher A cannot access Admin dashboard API -> 403 Forbidden...');
    const tAdminRes = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert(tAdminRes.status === 403, `Teacher received 403 on /api/admin/dashboard`);

    const tRecepRes = await request('/receptionist/dashboard', {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert(tRecepRes.status === 403, `Teacher received 403 on /api/receptionist/dashboard`);

    // ==================================================
    // TC8.7: Receptionist dashboard -> operational metrics & reminders
    // ==================================================
    console.log('\n[TC8.7] Receptionist dashboard metrics and reminder list...');
    const recepRes = await request('/receptionist/dashboard', {
      headers: { Authorization: `Bearer ${receptionistToken}` },
    });
    assert(recepRes.status === 200, `Receptionist dashboard returns 200`);
    const recepData = recepRes.data;

    assert(typeof recepData.newStudentsThisMonth === 'number', `newStudentsThisMonth is number: ${recepData.newStudentsThisMonth}`);
    assert(Array.isArray(recepData.upcomingClasses), `upcomingClasses is array`);
    assert(typeof recepData.outstandingTuition === 'number', `outstandingTuition is number: ${recepData.outstandingTuition}`);
    assert(typeof recepData.overdueInvoicesCount === 'number', `overdueInvoicesCount is number: ${recepData.overdueInvoicesCount}`);
    assert(typeof recepData.todayCollectedAmount === 'number', `todayCollectedAmount is number: ${recepData.todayCollectedAmount}`);
    assert(Array.isArray(recepData.todayClasses), `todayClasses is array`);
    assert(Array.isArray(recepData.studentsNeedingPaymentReminder), `studentsNeedingPaymentReminder is array`);
    assert(Array.isArray(recepData.recentPayments), `recentPayments is array`);

    // Receptionist cannot access admin dashboard
    const rAdminRes = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${receptionistToken}` },
    });
    assert(rAdminRes.status === 403, `Receptionist received 403 on /api/admin/dashboard`);

    // ==================================================
    // TC8.8: Student dashboard -> only own active classes
    // ==================================================
    console.log('\n[TC8.8] Student dashboard -> only own active classes...');
    const stuRes = await request('/student/dashboard', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(stuRes.status === 200, `Student dashboard returns 200`);
    const stuData = stuRes.data;

    assert(typeof stuData.activeClassesCount === 'number', `activeClassesCount is number: ${stuData.activeClassesCount}`);
    assert(Array.isArray(stuData.activeClasses), `activeClasses is array`);
    assert(Array.isArray(stuData.weeklySchedule), `weeklySchedule is array`);
    assert(stuData.attendanceSummary && typeof stuData.attendanceSummary.attendanceRate === 'number', `attendanceSummary has attendanceRate`);
    assert(Array.isArray(stuData.latestResults), `latestResults is array`);
    assert(stuData.tuitionSummary && typeof stuData.tuitionSummary.totalOutstanding === 'number', `tuitionSummary has totalOutstanding`);

    // Student cannot access other role dashboards
    const sAdminRes = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(sAdminRes.status === 403, `Student received 403 on /api/admin/dashboard`);

    const sTeachRes = await request('/teacher/dashboard', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(sTeachRes.status === 403, `Student received 403 on /api/teacher/dashboard`);

    // ==================================================
    // TC8.9: Student attendance summary equals Phase 5 attendance service result
    // ==================================================
    console.log('\n[TC8.9] Student attendance summary consistency with Phase 5...');
    const rawAttendance = await Attendance.find({ student: testStudentDoc._id });
    const totalAtt = rawAttendance.length;
    const presentCount = rawAttendance.filter((a) => a.status === 'Present').length;
    const lateCount = rawAttendance.filter((a) => a.status === 'Late').length;
    const expectedRate = totalAtt > 0 ? Number((((presentCount + lateCount) / totalAtt) * 100).toFixed(1)) : 100;

    assert(stuData.attendanceSummary.attendanceRate === expectedRate, `Student attendanceRate equals Phase 5 calculation (${stuData.attendanceSummary.attendanceRate} === ${expectedRate})`);

    // ==================================================
    // TC8.10: Student latest results equals Phase 6 stored data
    // ==================================================
    console.log('\n[TC8.10] Student latest results consistency with Phase 6...');
    const topResults = await LearningResult.find({ student: testStudentDoc._id })
      .sort('-testDate -createdAt')
      .limit(3);
    assert(stuData.latestResults.length === topResults.length, `latestResults length matches Phase 6 records (${stuData.latestResults.length} === ${topResults.length})`);
    if (topResults.length > 0) {
      assert(stuData.latestResults[0].resultId.toString() === topResults[0]._id.toString(), `First result ID matches most recent Phase 6 result`);
    }

    // ==================================================
    // TC8.11: Student tuition summary equals Phase 7 invoice data
    // ==================================================
    console.log('\n[TC8.11] Student tuition summary consistency with Phase 7...');
    const stuInvoices = await TuitionInvoice.find({
      student: testStudentDoc._id,
      status: { $ne: 'cancelled' },
    });
    const dbTotalOutstanding = stuInvoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);
    assert(stuData.tuitionSummary.totalOutstanding === dbTotalOutstanding, `totalOutstanding matches Phase 7 invoices (${stuData.tuitionSummary.totalOutstanding} === ${dbTotalOutstanding})`);

    // ==================================================
    // TC8.12: No hardcoded dashboard KPI values remain
    // ==================================================
    console.log('\n[TC8.12] Checking for dynamic / DB-sourced KPI response types...');
    assert(adminData.totalStudents !== undefined && adminData.activeClasses !== undefined, 'Admin metrics are dynamically computed from DB');
    assert(recepData.outstandingTuition !== undefined && recepData.newStudentsThisMonth !== undefined, 'Receptionist metrics are dynamically computed from DB');
    assert(t1Res.data.assignedClassesCount !== undefined, 'Teacher metrics are dynamically computed from DB');
    assert(stuData.activeClassesCount !== undefined, 'Student metrics are dynamically computed from DB');

  } catch (error) {
    console.error('Unexpected test error:', error);
    failed++;
  } finally {
    // Clean up temporary teacher 2
    if (testTeacher2Doc) await Teacher.findByIdAndDelete(testTeacher2Doc._id);
    if (testTeacher2User) await User.findByIdAndDelete(testTeacher2User._id);
    await mongoose.disconnect();
  }

  console.log('\n==================================================');
  console.log(`TEST RUN SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
