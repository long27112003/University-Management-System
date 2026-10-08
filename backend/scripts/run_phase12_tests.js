/**
 * PHASE 12 AUTOMATED TEST SUITE
 * Tests TC12.1 through TC12.14
 */

const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
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
const Notice = require('../models/Notice');
const StudyMaterial = require('../models/StudyMaterial');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, data: json, headers: res.headers });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('   CHẠY KIỂM THỬ TỰ ĐỘNG PHASE 12 (TC12.1 - TC12.14)   ');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  let passedCount = 0;
  let totalCount = 0;

  function assert(testId, description, condition, details = '') {
    totalCount++;
    if (condition) {
      console.log(`✅ [${testId}] PASS: ${description}`);
      passedCount++;
    } else {
      console.error(`❌ [${testId}] FAIL: ${description} - ${details}`);
    }
  }

  // TC12.1 & TC12.2: Seed executions verified by checking collection counts
  const userCount = await User.countDocuments();
  const classCount = await Class.countDocuments();
  const invoiceCount = await TuitionInvoice.countDocuments();
  assert(
    'TC12.1',
    'Seed execution populated database successfully',
    userCount === 40 && classCount === 8 && invoiceCount === 60,
    `Users: ${userCount}, Classes: ${classCount}, Invoices: ${invoiceCount}`
  );

  assert(
    'TC12.2',
    'Idempotent repeat seed execution without duplicates',
    userCount === 40,
    `Expected exactly 40 users, got ${userCount}`
  );

  // TC12.3: Login Admin
  const adminRes = await request('POST', '/api/auth/login', {
    email: 'admin@vlearn.edu.vn',
    password: 'VLearnAdmin123!',
  });
  const adminToken = adminRes.data?.token;
  const adminRole = adminRes.data?.role;
  assert(
    'TC12.3',
    'Login Admin demo account (admin@vlearn.edu.vn)',
    adminRes.status === 200 && !!adminToken && adminRole === 'Admin',
    `Status: ${adminRes.status}, Role: ${adminRole}`
  );

  // TC12.4: Login Receptionist
  const recepRes = await request('POST', '/api/auth/login', {
    email: 'letan@vlearn.edu.vn',
    password: 'VLearnReception123!',
  });
  const recepToken = recepRes.data?.token;
  const recepRole = recepRes.data?.role;
  assert(
    'TC12.4',
    'Login Receptionist demo account (letan@vlearn.edu.vn)',
    recepRes.status === 200 && !!recepToken && recepRole === 'Receptionist',
    `Status: ${recepRes.status}, Role: ${recepRole}`
  );

  // TC12.5: Login Teacher
  const teachRes = await request('POST', '/api/auth/login', {
    email: 'teacher@vlearn.edu.vn',
    password: 'VLearnTeacher123!',
  });
  const teachToken = teachRes.data?.token;
  const teachRole = teachRes.data?.role;
  assert(
    'TC12.5',
    'Login Teacher demo account (teacher@vlearn.edu.vn)',
    teachRes.status === 200 && !!teachToken && teachRole === 'Teacher',
    `Status: ${teachRes.status}, Role: ${teachRole}`
  );

  // TC12.6: Login Student
  const studRes = await request('POST', '/api/auth/login', {
    email: 'student@vlearn.edu.vn',
    password: 'VLearnStudent123!',
  });
  const studToken = studRes.data?.token;
  const studRole = studRes.data?.role;
  assert(
    'TC12.6',
    'Login Student demo account (student@vlearn.edu.vn)',
    studRes.status === 200 && !!studToken && studRole === 'Student',
    `Status: ${studRes.status}, Role: ${studRole}`
  );

  // TC12.7: Admin dashboard metrics
  const adminDashRes = await request('GET', '/api/admin/dashboard', null, adminToken);
  const metrics = adminDashRes.data;
  const hasRealMetrics =
    adminDashRes.status === 200 &&
    metrics.totalStudents === 30 &&
    metrics.totalTeachers === 6 &&
    metrics.activeClasses === 6 &&
    metrics.totalTuition > 0;
  assert(
    'TC12.7',
    'Admin dashboard has real non-zero metrics',
    hasRealMetrics,
    `Status: ${adminDashRes.status}, Metrics: ${JSON.stringify({
      students: metrics?.totalStudents,
      teachers: metrics?.totalTeachers,
      classes: metrics?.activeClasses,
      tuition: metrics?.totalTuition,
    })}`
  );

  // TC12.8: Teacher dashboard assigned classes/schedule
  const teachDashRes = await request('GET', '/api/teacher/dashboard', null, teachToken);
  const teachDash = teachDashRes.data;
  const teacherDashOk =
    teachDashRes.status === 200 &&
    Array.isArray(teachDash.assignedClasses) &&
    teachDash.assignedClasses.length > 0 &&
    teachDash.attendanceSummary?.totalSessions > 0;

  assert(
    'TC12.8',
    'Teacher dashboard has assigned classes and schedule/session metrics',
    teacherDashOk,
    `Status: ${teachDashRes.status}, Classes: ${teachDash?.assignedClasses?.length}, Sessions: ${teachDash?.attendanceSummary?.totalSessions}`
  );

  // TC12.9: Student dashboard data (classes, schedule, attendance, results, tuition)
  const studDashRes = await request('GET', '/api/student/dashboard', null, studToken);
  const studDash = studDashRes.data;
  const studentDashboardComplete =
    studDashRes.status === 200 &&
    Array.isArray(studDash.activeClasses) &&
    studDash.activeClasses.length > 0 &&
    Array.isArray(studDash.weeklySchedule) &&
    studDash.weeklySchedule.length > 0 &&
    Array.isArray(studDash.latestResults) &&
    studDash.latestResults.length > 0 &&
    Array.isArray(studDash.tuitionSummary?.latestInvoices) &&
    studDash.tuitionSummary.latestInvoices.length > 0 &&
    studDash.attendanceSummary?.totalSessions > 0;

  assert(
    'TC12.9',
    'Student dashboard loads class, schedule, attendance, results, tuition',
    studentDashboardComplete,
    `Classes: ${studDash?.activeClasses?.length}, Schedules: ${studDash?.weeklySchedule?.length}, Results: ${studDash?.latestResults?.length}, Invoices: ${studDash?.tuitionSummary?.latestInvoices?.length}, AttSessions: ${studDash?.attendanceSummary?.totalSessions}`
  );

  // TC12.10: Financial Consistency across ALL Invoices
  const allInvoices = await TuitionInvoice.find();
  const allPayments = await Payment.find();
  let financeConsistent = true;
  let financeErrorMsg = '';

  for (const inv of allInvoices) {
    const compPayments = allPayments.filter(
      (p) => p.invoice.toString() === inv._id.toString() && p.status === 'completed'
    );
    const sumPaid = compPayments.reduce((sum, p) => sum + p.amount, 0);

    if (inv.paidAmount !== sumPaid) {
      financeConsistent = false;
      financeErrorMsg = `Invoice ${inv.invoiceCode}: paidAmount (${inv.paidAmount}) != sum completed (${sumPaid})`;
      break;
    }
    if (inv.remainingAmount !== inv.totalAmount - inv.paidAmount) {
      financeConsistent = false;
      financeErrorMsg = `Invoice ${inv.invoiceCode}: remainingAmount (${inv.remainingAmount}) != total - paid (${inv.totalAmount - inv.paidAmount})`;
      break;
    }
  }

  // Verify at least one voided payment exists for audit demo
  const voidedPayments = allPayments.filter((p) => p.status === 'voided');
  const hasVoided = voidedPayments.length >= 1;

  assert(
    'TC12.10',
    'Payment and invoice consistency check passes (100% matched + voided payment tested)',
    financeConsistent && hasVoided,
    financeErrorMsg || `Voided payments: ${voidedPayments.length}`
  );

  // TC12.11: Schedule conflict check across all active classes
  const allSchedules = await Schedule.find();
  let scheduleConflict = false;
  let conflictReason = '';

  for (let i = 0; i < allSchedules.length; i++) {
    for (let j = i + 1; j < allSchedules.length; j++) {
      const s1 = allSchedules[i];
      const s2 = allSchedules[j];
      if (s1.dayOfWeek === s2.dayOfWeek) {
        // check time overlap
        const s1Start = parseInt(s1.startTime.replace(':', ''), 10);
        const s1End = parseInt(s1.endTime.replace(':', ''), 10);
        const s2Start = parseInt(s2.startTime.replace(':', ''), 10);
        const s2End = parseInt(s2.endTime.replace(':', ''), 10);

        const overlap = Math.max(s1Start, s2Start) < Math.min(s1End, s2End);
        if (overlap) {
          // Check if same room or same teacher
          if (s1.room === s2.room) {
            scheduleConflict = true;
            conflictReason = `Room conflict: ${s1.room} on day ${s1.dayOfWeek} at ${s1.startTime}-${s1.endTime}`;
            break;
          }
          if (s1.teacher.toString() === s2.teacher.toString()) {
            scheduleConflict = true;
            conflictReason = `Teacher conflict: ${s1.teacher} on day ${s1.dayOfWeek} at ${s1.startTime}-${s1.endTime}`;
            break;
          }
        }
      }
    }
    if (scheduleConflict) break;
  }

  assert(
    'TC12.11',
    'No room or teacher schedule conflicts in seeded classes',
    !scheduleConflict,
    conflictReason
  );

  // TC12.12: No duplicate active Enrollments
  const activeEnrollments = await Enrollment.find({ status: 'active' });
  const enrollmentKeys = new Set();
  let duplicateActiveEnrollment = false;

  for (const enr of activeEnrollments) {
    const key = `${enr.student.toString()}_${enr.class.toString()}`;
    if (enrollmentKeys.has(key)) {
      duplicateActiveEnrollment = true;
      break;
    }
    enrollmentKeys.add(key);
  }

  assert(
    'TC12.12',
    'No duplicate active enrollments (student + class uniqueness)',
    !duplicateActiveEnrollment,
    `Total active enrollments: ${activeEnrollments.length}`
  );

  // TC12.13: No duplicate Attendance student+session
  const allAttendance = await Attendance.find();
  const attKeys = new Set();
  let duplicateAttendance = false;

  for (const att of allAttendance) {
    const key = `${att.student.toString()}_${att.session.toString()}`;
    if (attKeys.has(key)) {
      duplicateAttendance = true;
      break;
    }
    attKeys.add(key);
  }

  assert(
    'TC12.13',
    'No duplicate attendance records (unique student + session)',
    !duplicateAttendance,
    `Total attendance records: ${allAttendance.length}`
  );

  // TC12.14: Frontend build test
  let buildPassed = false;
  let buildError = '';
  try {
    const frontendDir = path.join(__dirname, '../../frontend');
    execSync('npm run build', { cwd: frontendDir, stdio: 'pipe' });
    buildPassed = true;
  } catch (err) {
    buildPassed = false;
    buildError = err.stderr ? err.stderr.toString() : err.message;
  }

  assert(
    'TC12.14',
    'Frontend build (npm run build) succeeds cleanly',
    buildPassed,
    buildError
  );

  console.log(`\n====================================================`);
  console.log(`KẾT QUẢ: ${passedCount} / ${totalCount} KIỂM THỬ THÀNH CÔNG.`);
  console.log(`====================================================\n`);

  await mongoose.disconnect();
  process.exit(passedCount === totalCount ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Error running tests:', err);
  process.exit(1);
});
