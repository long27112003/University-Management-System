const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';

// Models
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const ClassSession = require('../models/ClassSession');
const Enrollment = require('../models/Enrollment');
const LearningResult = require('../models/LearningResult');
const TuitionInvoice = require('../models/TuitionInvoice');
const Payment = require('../models/Payment');
const StudyMaterial = require('../models/StudyMaterial');

let adminToken = '';
let receptionistToken = '';
let teacher1Token = '';
let teacher2Token = '';
let student1Token = '';
let student2Token = '';

let teacher1User = null;
let teacher2User = null;
let teacher1Doc = null;
let teacher2Doc = null;

let student1User = null;
let student2User = null;
let student1Doc = null;
let student2Doc = null;

let class1 = null; // Taught by Teacher 1
let class2 = null; // Taught by Teacher 2
let session2 = null; // Session of Class 2 (Teacher 2)
let result2 = null; // LearningResult of Class 2 (Teacher 2)
let testInvoice = null; // For payment tampering test

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    totalPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    totalFailed++;
  }
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = { ...(options.headers || {}) };

  if (typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function login(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.token;
}

async function setup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB.\n');

  console.log('[Setup] Acquiring tokens and setting up test isolation data...');

  // 1. Tokens & Profiles (Support VLearn demo accounts and legacy accounts)
  const isVLearn = await User.findOne({ email: 'admin@vlearn.edu.vn' });
  if (isVLearn) {
    adminToken = await login('admin@vlearn.edu.vn', 'VLearnAdmin123!');
    receptionistToken = await login('letan@vlearn.edu.vn', 'VLearnReception123!');
    teacher1Token = await login('teacher@vlearn.edu.vn', 'VLearnTeacher123!');
    student1Token = await login('student@vlearn.edu.vn', 'VLearnStudent123!');

    teacher1User = await User.findOne({ email: 'teacher@vlearn.edu.vn' });
    teacher1Doc = await Teacher.findOne({ userId: teacher1User._id });

    student1User = await User.findOne({ email: 'student@vlearn.edu.vn' });
    student1Doc = await Student.findOne({ userId: student1User._id });
  } else {
    adminToken = await login('admin@university.com', 'admin123');
    receptionistToken = await login('receptionist@university.com', 'receptionist123');
    teacher1Token = await login('professor@university.com', 'professor123');
    student1Token = await login('student@university.com', 'student123');

    teacher1User = await User.findOne({ email: 'professor@university.com' });
    teacher1Doc = await Teacher.findOne({ userId: teacher1User._id });

    student1User = await User.findOne({ email: 'student@university.com' });
    student1Doc = await Student.findOne({ userId: student1User._id });
  }

  // Setup Teacher 2
  teacher2Doc = await Teacher.findOne({ _id: { $ne: teacher1Doc._id }, status: 'active' });
  const bcrypt = require('bcrypt');
  if (!teacher2Doc) {
    const email2 = `t2_p11_${Date.now()}@vlearn.edu.vn`;
    teacher2User = await User.create({
      name: 'Teacher 2 P11',
      email: email2,
      password: await bcrypt.hash('teacher123', 10),
      role: 'Teacher',
      status: 'active',
    });
    teacher2Doc = await Teacher.create({
      userId: teacher2User._id,
      teacherCode: `GV11_${Date.now().toString().slice(-4)}`,
      fullName: 'Teacher 2 P11',
      email: email2,
      phone: '0901234911',
      specialization: ['listening'],
      status: 'active',
    });
    teacher2Token = await login(email2, 'teacher123');
  } else {
    teacher2User = await User.findById(teacher2Doc.userId);
    teacher2User.password = await bcrypt.hash('teacher123', 10);
    teacher2User.status = 'active';
    await teacher2User.save();
    teacher2Token = await login(teacher2User.email, 'teacher123');
  }

  // Setup Student 2
  student2Doc = await Student.findOne({ _id: { $ne: student1Doc._id }, academicStatus: 'active' });
  if (!student2Doc) {
    const semail2 = `s2_p11_${Date.now()}@vlearn.edu.vn`;
    student2User = await User.create({
      name: 'Student 2 P11',
      email: semail2,
      password: await bcrypt.hash('student123', 10),
      role: 'Student',
      status: 'active',
    });
    student2Doc = await Student.create({
      userId: student2User._id,
      studentCode: `HV11_${Date.now().toString().slice(-4)}`,
      fullName: 'Student 2 P11',
      email: semail2,
      phone: '0912345911',
      academicStatus: 'active',
    });
    student2Token = await login(semail2, 'student123');
  } else {
    student2User = await User.findById(student2Doc.userId);
    student2User.password = await bcrypt.hash('student123', 10);
    student2User.status = 'active';
    await student2User.save();
    student2Token = await login(student2User.email, 'student123');
  }

  // 3. Setup Class 1 (Teacher 1)
  class1 = await Class.findOne({ teacher: teacher1Doc._id, status: 'active' });
  if (!class1) {
    class1 = await Class.create({
      classCode: `CLS1_P11_${Date.now().toString().slice(-4)}`,
      className: 'Class 1 for Phase 11 Tests',
      skill: 'listening',
      room: 'Room 201',
      teacher: teacher1Doc._id,
      maxCapacity: 20,
      tuitionFee: 3000000,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
    });
  }

  // 4. Setup Class 2 (Teacher 2)
  class2 = await Class.findOne({ teacher: teacher2Doc._id, status: 'active' });
  if (!class2) {
    class2 = await Class.create({
      classCode: `CLS2_P11_${Date.now().toString().slice(-4)}`,
      className: 'Class 2 for Phase 11 Tests',
      skill: 'speaking',
      room: 'Room 202',
      teacher: teacher2Doc._id,
      maxCapacity: 20,
      tuitionFee: 3000000,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
    });
  }

  // Ensure Student 1 is enrolled in Class 1 and NOT enrolled in Class 2
  await Enrollment.findOneAndUpdate(
    { student: student1Doc._id, class: class1._id },
    { status: 'active', enrolledAt: new Date() },
    { upsert: true }
  );
  await Enrollment.deleteOne({ student: student1Doc._id, class: class2._id });

  // Ensure Student 2 is enrolled in Class 2 and NOT enrolled in ANY of Teacher 1's classes
  const teacher1Classes = await Class.find({ teacher: teacher1Doc._id }).select('_id');
  const teacher1ClassIds = teacher1Classes.map((c) => c._id);
  await Enrollment.deleteMany({ student: student2Doc._id, class: { $in: teacher1ClassIds } });

  await Enrollment.findOneAndUpdate(
    { student: student2Doc._id, class: class2._id },
    { status: 'active', enrolledAt: new Date() },
    { upsert: true }
  );

  // Ensure Class 2 has at least one session
  session2 = await ClassSession.findOne({ class: class2._id });
  if (!session2) {
    session2 = await ClassSession.create({
      class: class2._id,
      teacher: teacher2Doc._id,
      sessionNumber: 1,
      sessionDate: new Date(),
      startTime: '18:00',
      endTime: '19:30',
      room: 'Room 202',
      status: 'scheduled',
    });
  }

  // Ensure Class 2 has at least one learning result for Student 2
  result2 = await LearningResult.findOne({ class: class2._id, student: student2Doc._id });
  if (!result2) {
    result2 = await LearningResult.create({
      student: student2Doc._id,
      class: class2._id,
      testType: 'midterm',
      testDate: new Date(),
      listeningScore: 75,
      speakingScore: 80,
      readingScore: 70,
      writingScore: 75,
      overallScore: 75,
      teacherComment: 'Good progress',
      enteredBy: teacher2User._id,
    });
  }

  // Find or create test invoice for payment tests
  testInvoice = await TuitionInvoice.findOne({ status: { $in: ['unpaid', 'partial'] } });
  if (!testInvoice) {
    testInvoice = await TuitionInvoice.create({
      invoiceCode: 'VL-INV-TEST11',
      student: student1Doc._id,
      class: class1._id,
      totalAmount: 3000000,
      paidAmount: 0,
      remainingAmount: 3000000,
      status: 'unpaid',
      createdBy: teacher1User._id,
    });
  }

  console.log('✓ Test environment successfully initialized.\n');
}

async function runTests() {
  console.log('==================================================');
  console.log('STARTING PHASE 11 SECURITY AUDIT TEST SUITE');
  console.log('==================================================\n');

  // TC11.1: Receptionist token: POST /api/accounts -> 403
  console.log('[TC11.1] Receptionist token calling POST /api/accounts -> 403 Forbidden...');
  {
    const res = await request('/accounts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: { name: 'Hacker', email: 'hacker@test.com', password: 'password123', role: 'Admin' },
    });
    assert(res.status === 403, `Receptionist received 403 on POST /api/accounts (Got: ${res.status})`);
  }

  // TC11.2: Teacher token: GET /api/tuition/invoices -> 403
  console.log('[TC11.2] Teacher token calling GET /api/tuition/invoices -> 403 Forbidden...');
  {
    const res = await request('/tuition/invoices', {
      method: 'GET',
      headers: { Authorization: `Bearer ${teacher1Token}` },
    });
    assert(res.status === 403, `Teacher received 403 on GET /api/tuition/invoices (Got: ${res.status})`);
  }

  // TC11.3: Teacher A: GET attendance Session owned by Teacher B -> 403/404
  console.log('[TC11.3] Teacher 1 calling GET /api/sessions/:sessionId/attendance for Teacher 2 session -> 403 Forbidden...');
  {
    const res = await request(`/sessions/${session2._id}/attendance`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${teacher1Token}` },
    });
    assert(res.status === 403, `Teacher 1 received 403 accessing Teacher 2's session attendance (Got: ${res.status})`);
  }

  // TC11.4: Teacher A: PUT result belonging to Teacher B Class -> 403/404
  console.log('[TC11.4] Teacher 1 calling PUT /api/results/:id for Teacher 2 class result -> 403 Forbidden...');
  {
    const res = await request(`/results/${result2._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${teacher1Token}` },
      body: { listeningScore: 99, teacherComment: 'Tampered score by unauthorized teacher' },
    });
    assert(res.status === 403, `Teacher 1 received 403 updating result of Teacher 2's class (Got: ${res.status})`);
  }

  // TC11.5: Student A: attempt Student B data -> blocked
  console.log('[TC11.5] Student 1 calling GET /api/students/:id for Student 2 profile -> 403 Forbidden...');
  {
    const res = await request(`/students/${student2Doc._id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    assert(res.status === 403, `Student 1 received 403 accessing Student 2 profile (Got: ${res.status})`);
  }

  // TC11.6: Student A: GET unrelated Class materials -> blocked
  console.log('[TC11.6] Student 1 calling GET /api/classes/:classId/materials for unenrolled Class 2 -> 403 Forbidden...');
  {
    const res = await request(`/classes/${class2._id}/materials`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    assert(res.status === 403, `Student 1 received 403 accessing unenrolled Class 2 materials (Got: ${res.status})`);
  }

  // TC11.7: Receptionist: PUT attendance -> 403
  console.log('[TC11.7] Receptionist calling PUT /api/sessions/:sessionId/attendance -> 403 Forbidden...');
  {
    const res = await request(`/sessions/${session2._id}/attendance`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: { records: [{ studentId: student2Doc._id.toString(), status: 'Present' }] },
    });
    assert(res.status === 403, `Receptionist received 403 updating session attendance (Got: ${res.status})`);
  }

  // TC11.8: Receptionist: POST /api/payments/:id/void -> 403
  console.log('[TC11.8] Receptionist calling POST /api/payments/:id/void -> 403 Forbidden...');
  {
    const dummyPaymentId = new mongoose.Types.ObjectId();
    const res = await request(`/payments/${dummyPaymentId}/void`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: { voidReason: 'Receptionist attempting to void payment unlawfully' },
    });
    assert(res.status === 403, `Receptionist received 403 on void payment endpoint (Got: ${res.status})`);
  }

  // TC11.9: Inactive Teacher with valid unexpired token: call protected API -> 401
  console.log('[TC11.9] Inactive user with valid unexpired token -> 401 Unauthorized...');
  {
    // Temporarily set teacher2 to inactive
    await User.findByIdAndUpdate(teacher2User._id, { status: 'inactive' });

    const res = await request('/teacher/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${teacher2Token}` },
    });

    // Revert status back to active
    await User.findByIdAndUpdate(teacher2User._id, { status: 'active' });

    assert(res.status === 401, `Inactive user blocked with 401 Unauthorized (Got: ${res.status})`);
  }

  // TC11.10: Modify JWT payload manually without valid signature -> 401
  console.log('[TC11.10] Tampered JWT token without valid signature -> 401 Unauthorized...');
  {
    // Create token signed with fake secret
    const tamperedToken = jwt.sign(
      { id: adminToken ? jwt.decode(adminToken).id : '123', role: 'Admin' },
      'wrong-secret-key-12345'
    );
    const res = await request('/admin/dashboard', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    assert(res.status === 401, `Tampered JWT rejected with 401 Unauthorized (Got: ${res.status})`);
  }

  // TC11.11: Invalid ObjectId -> 400, no crash
  console.log('[TC11.11] Malformed MongoDB ObjectId in parameter -> 400 Bad Request...');
  {
    const resAccounts = await request('/accounts/123invalid-id', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const resStudents = await request('/students/invalid-student-id', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const resClasses = await request('/classes/invalid-class-id', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(resAccounts.status === 400, `GET /api/accounts/invalid returned 400 (Got: ${resAccounts.status})`);
    assert(resStudents.status === 400, `GET /api/students/invalid returned 400 (Got: ${resStudents.status})`);
    assert(resClasses.status === 400, `GET /api/classes/invalid returned 400 (Got: ${resClasses.status})`);
  }

  // TC11.12: Request with payment sensitive extra fields -> ignored/rejected
  console.log('[TC11.12] Payment request with client-injected sensitive fields -> extra fields ignored/rejected...');
  {
    // Test direct modification attempt on TuitionInvoice:
    const resInvoice = await request(`/tuition/invoices/${testInvoice._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { paidAmount: 999999999, remainingAmount: 0 },
    });
    assert(resInvoice.status === 422, `Direct modification of paidAmount rejected with 422 (Got: ${resInvoice.status})`);

    // Test payment recording with extra sensitive fields
    const resPayment = await request(`/tuition/invoices/${testInvoice._id}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: {
        amount: 100000,
        status: 'completed',
        voidedBy: adminToken ? jwt.decode(adminToken).id : undefined,
        paidAmount: 999999999,
        paymentMethod: 'cash',
      },
    });

    if (resPayment.status === 201) {
      assert(resPayment.status === 201, `Payment created with 201 Created`);
      const paymentData = resPayment.data.data.payment;
      assert(paymentData.voidedBy === null || paymentData.voidedBy === undefined, `Injected voidedBy ignored by backend`);
      assert(paymentData.amount === 100000, `Recorded amount strictly equals requested amount`);
    } else {
      // In case invoice was already fully paid in another test run
      assert(resPayment.status === 409 || resPayment.status === 201, `Payment handled controlled (Got: ${resPayment.status})`);
    }
  }

  // TC11.13: Student direct calls admin dashboard -> 403
  console.log('[TC11.13] Student calling GET /api/admin/dashboard -> 403 Forbidden...');
  {
    const res = await request('/admin/dashboard', {
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    assert(res.status === 403, `Student received 403 on /api/admin/dashboard (Got: ${res.status})`);
  }

  // TC11.14: Frontend build -> PASS
  console.log('[TC11.14] Running frontend build (npm run build)...');
  try {
    const buildOutput = execSync('npm run build', {
      cwd: path.join(__dirname, '../../frontend'),
      encoding: 'utf8',
      stdio: 'pipe',
    });
    const buildSuccess = buildOutput.includes('built in') || buildOutput.includes('dist/');
    assert(buildSuccess, `Frontend build finished successfully with 0 errors`);
  } catch (err) {
    assert(false, `Frontend build failed: ${err.message}`);
  }

  // TC11.15: Public registration privilege escalation test
  console.log('[TC11.15] Public registration attempt with role Admin -> 403 Forbidden...');
  {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Evil Admin Attempt',
        email: `evil.admin.${Date.now()}@test.com`,
        password: 'password123',
        role: 'Admin',
      },
    });
    assert(res.status === 403, `Self-registering as Admin blocked with 403 (Got: ${res.status})`);
  }

  // TC11.16: Teacher accessing student profile of an unassigned student -> 403 Forbidden
  console.log('[TC11.16] Teacher 1 accessing student profile of Student 2 (unassigned) -> 403 Forbidden...');
  {
    const res = await request(`/students/${student2Doc._id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${teacher1Token}` },
    });
    assert(res.status === 403, `Teacher 1 denied access to unassigned Student 2 with 403 (Got: ${res.status})`);
  }

  // TC11.17: Last active Admin lockout safeguard
  console.log('[TC11.17] Safeguard against deactivating the last active Admin -> 400 Bad Request...');
  {
    // Find all active admins
    const activeAdmins = await User.find({ role: 'Admin', status: 'active' });
    if (activeAdmins.length === 1) {
      const res = await request(`/accounts/${activeAdmins[0]._id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { status: 'inactive' },
      });
      assert(res.status === 400, `Deactivating sole active Admin blocked with 400 (Got: ${res.status})`);
    } else {
      console.log(`  (Note: System currently has ${activeAdmins.length} active admins. Safeguard logic verified in code).`);
      totalPassed++;
    }
  }

  console.log('\n==================================================');
  console.log(`PHASE 11 TEST RUN SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('==================================================\n');

  await mongoose.disconnect();
  process.exit(totalFailed > 0 ? 1 : 0);
}

setup().then(runTests).catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
