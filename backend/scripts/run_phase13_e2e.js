/**
 * PHASE 13 COMPLETE END-TO-END VERIFICATION SUITE
 * Tests all 8 primary role-based flows + Notice + Materials + Dashboards +
 * Authorization Regression + Validation Regression + Data Integrity + Build Verification
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
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: json, headers: res.headers });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function login(email, password) {
  const res = await request('POST', '/api/auth/login', { email, password });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return { token: res.data.token, user: res.data };
}

async function runE2E() {
  console.log('====================================================');
  console.log('       PHASE 13: END-TO-END INTEGRATION TEST SUITE       ');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  let passedCount = 0;
  let totalCount = 0;

  function assert(flowName, description, condition, details = '') {
    totalCount++;
    if (condition) {
      console.log(`✅ [${flowName}] PASS: ${description}`);
      passedCount++;
    } else {
      console.error(`❌ [${flowName}] FAIL: ${description} - ${details}`);
    }
  }

  // Baseline Demo Accounts Login
  const adminAuth = await login('admin@vlearn.edu.vn', 'VLearnAdmin123!');
  const recepAuth = await login('letan@vlearn.edu.vn', 'VLearnReception123!');
  const teachAuth = await login('teacher@vlearn.edu.vn', 'VLearnTeacher123!');
  const studAuth = await login('student@vlearn.edu.vn', 'VLearnStudent123!');

  console.log('✓ Successfully authenticated all 4 primary demo roles.\n');

  // =========================================================================
  // FLOW 1: ADMIN STAFF MANAGEMENT
  // =========================================================================
  console.log('--- FLOW 1: ADMIN STAFF MANAGEMENT ---');
  const uniqueTimestamp = Date.now();
  const newTeacherEmail = `teacher.e2e.${uniqueTimestamp}@vlearn.edu.vn`;
  const newRecepEmail = `recep.e2e.${uniqueTimestamp}@vlearn.edu.vn`;

  // Admin creates teacher
  const createTeacherRes = await request(
    'POST',
    '/api/teachers',
    {
      fullName: 'Võ Minh Trí',
      email: newTeacherEmail,
      phone: '0909888777',
      password: 'TeacherPassword123!',
      specialization: ['speaking', 'listening'],
      status: 'active',
    },
    adminAuth.token
  );

  const teacherCreated = createTeacherRes.ok && createTeacherRes.data?.data?.teacherCode;
  const teacherDocInDb = await Teacher.findOne({ email: newTeacherEmail });
  const teacherUserInDb = await User.findOne({ email: newTeacherEmail });

  assert(
    'FLOW 1.1',
    'Admin creates new Teacher profile + User account atomically',
    teacherCreated && !!teacherDocInDb && !!teacherUserInDb && teacherUserInDb.role === 'Teacher',
    `Status: ${createTeacherRes.status}, Error: ${createTeacherRes.data?.message}`
  );

  // Admin creates receptionist account
  const createRecepRes = await request(
    'POST',
    '/api/accounts',
    {
      name: 'Lê Thu Trang Lễ Tân',
      email: newRecepEmail,
      password: 'RecepPassword123!',
      role: 'Receptionist',
      status: 'active',
    },
    adminAuth.token
  );

  const recepUserInDb = await User.findOne({ email: newRecepEmail });
  assert(
    'FLOW 1.2',
    'Admin creates Receptionist account via Account Management',
    createRecepRes.ok && !!recepUserInDb && recepUserInDb.role === 'Receptionist',
    `Status: ${createRecepRes.status}, Error: ${createRecepRes.data?.message}`
  );

  // =========================================================================
  // FLOW 2: RECEPTIONIST STUDENT ONBOARDING
  // =========================================================================
  console.log('\n--- FLOW 2: RECEPTIONIST STUDENT ONBOARDING ---');
  const newStudentEmail = `student.e2e.${uniqueTimestamp}@vlearn.edu.vn`;
  const onboardStudentRes = await request(
    'POST',
    '/api/students',
    {
      fullName: 'Phạm Hải Đăng',
      email: newStudentEmail,
      phone: '0988776655',
      password: 'StudentPassword123!',
      gender: 'male',
      academicStatus: 'active',
      dateOfBirth: '2004-05-15',
      address: { city: 'Hà Nội' },
      emergencyContact: { name: 'Phụ huynh Hải Đăng', phone: '0911223344' },
    },
    recepAuth.token
  );

  const studentCreated = onboardStudentRes.ok && onboardStudentRes.data?.data?.studentCode;
  const createdStudentId = onboardStudentRes.data?.data?._id;
  const studentDocInDb = await Student.findOne({ email: newStudentEmail });
  const studentUserInDb = await User.findOne({ email: newStudentEmail });

  assert(
    'FLOW 2.1',
    'Receptionist onboards new Student with generated studentCode',
    studentCreated && !!studentDocInDb && !!studentUserInDb && studentDocInDb.studentCode.startsWith('VL-HV'),
    `Code: ${studentDocInDb?.studentCode}, Msg: ${onboardStudentRes.data?.message}`
  );

  // Verify Receptionist reads student detail
  const getStudentDetailRes = await request('GET', `/api/students/${createdStudentId}`, null, recepAuth.token);
  assert(
    'FLOW 2.2',
    'Receptionist views Student Detail successfully',
    getStudentDetailRes.ok && getStudentDetailRes.data?.data?.email === newStudentEmail,
    `Status: ${getStudentDetailRes.status}`
  );

  // Receptionist forbidden on account management
  const recepAccountsRes = await request('GET', '/api/accounts', null, recepAuth.token);
  assert(
    'FLOW 2.3',
    'Receptionist blocked from Account Management (403 Forbidden)',
    recepAccountsRes.status === 403,
    `Got status: ${recepAccountsRes.status}`
  );

  // =========================================================================
  // FLOW 3: CLASS CREATION & ENROLLMENT
  // =========================================================================
  console.log('\n--- FLOW 3: CLASS CREATION & ENROLLMENT ---');
  const classCode = `VL-SPK-E2E-${uniqueTimestamp.toString().slice(-4)}`;
  const createClassRes = await request(
    'POST',
    '/api/classes',
    {
      classCode,
      className: 'IELTS Speaking Masterclass E2E',
      skill: 'speaking',
      teacher: teacherDocInDb._id.toString(),
      room: 'Room 303',
      maxCapacity: 15,
      tuitionFee: 4500000,
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
    adminAuth.token
  );

  const classCreated = createClassRes.ok && createClassRes.data?.data?._id;
  const createdClassId = createClassRes.data?.data?._id;
  assert(
    'FLOW 3.1',
    'Admin creates new Class with Speaking skill & assigned Teacher',
    classCreated,
    `Status: ${createClassRes.status}, Message: ${createClassRes.data?.message}`
  );

  // Receptionist enrolls onboarded student into this class
  const enrollRes = await request(
    'POST',
    `/api/classes/${createdClassId}/enrollments`,
    {
      studentId: createdStudentId,
    },
    recepAuth.token
  );

  const enrollmentCreated = enrollRes.ok && enrollRes.data?.data?.status === 'active';
  const autoInvoice = await TuitionInvoice.findOne({
    student: createdStudentId,
    class: createdClassId,
  });

  assert(
    'FLOW 3.2',
    'Receptionist enrolls Student and TuitionInvoice auto-created matching tuition fee',
    enrollmentCreated && !!autoInvoice && autoInvoice.totalAmount === 4500000 && autoInvoice.status === 'unpaid',
    `Enroll Status: ${enrollRes.status}, Invoice Amount: ${autoInvoice?.totalAmount}, Invoice Status: ${autoInvoice?.status}`
  );

  // =========================================================================
  // FLOW 4: SCHEDULE & SESSION GENERATION
  // =========================================================================
  console.log('\n--- FLOW 4: SCHEDULE & SESSION GENERATION ---');
  // Create schedule on Friday (dayOfWeek 6) from 18:00 to 19:30 in Room 303
  const createScheduleRes = await request(
    'POST',
    `/api/classes/${createdClassId}/schedules`,
    {
      dayOfWeek: 6,
      startTime: '18:00',
      endTime: '19:30',
      room: 'Room 303',
    },
    adminAuth.token
  );

  assert(
    'FLOW 4.1',
    'Admin creates weekly Schedule for class without conflict',
    createScheduleRes.ok && createScheduleRes.data?.data?.dayOfWeek === 6,
    `Status: ${createScheduleRes.status}, Message: ${createScheduleRes.data?.message}`
  );

  // Generate class sessions
  const generateSessionsRes = await request(
    'POST',
    `/api/classes/${createdClassId}/sessions/generate`,
    {},
    adminAuth.token
  );

  const sessionsGenerated = generateSessionsRes.ok && generateSessionsRes.data?.data?.totalSessions > 0;
  const generatedSessionsList = await ClassSession.find({ class: createdClassId }).sort({ sessionNumber: 1 });

  assert(
    'FLOW 4.2',
    'Admin generates ClassSessions with ordered sessionNumber and assigned teacher/room',
    sessionsGenerated &&
      generatedSessionsList.length > 0 &&
      generatedSessionsList[0].sessionNumber === 1 &&
      generatedSessionsList[0].room === 'Room 303',
    `Generated count: ${generatedSessionsList.length}`
  );

  // =========================================================================
  // FLOW 5: TEACHER ATTENDANCE
  // =========================================================================
  console.log('\n--- FLOW 5: TEACHER ATTENDANCE ---');
  // Login as the newly created teacher
  const newTeacherAuth = await login(newTeacherEmail, 'TeacherPassword123!');
  const targetSession = generatedSessionsList[0];

  // Mark attendance: Present
  const markAttendanceRes1 = await request(
    'PUT',
    `/api/sessions/${targetSession._id}/attendance`,
    {
      records: [
        {
          studentId: createdStudentId,
          status: 'Present',
          note: 'Có mặt đúng giờ, tích cực phát biểu',
        },
      ],
    },
    newTeacherAuth.token
  );

  assert(
    'FLOW 5.1',
    'Assigned Teacher marks student attendance (Present)',
    markAttendanceRes1.ok,
    `Status: ${markAttendanceRes1.status}, Msg: ${markAttendanceRes1.data?.message}`
  );

  // Second save updates instead of duplicating
  const markAttendanceRes2 = await request(
    'PUT',
    `/api/sessions/${targetSession._id}/attendance`,
    {
      records: [
        {
          studentId: createdStudentId,
          status: 'Late',
          note: 'Đến muộn 10 phút',
        },
      ],
    },
    newTeacherAuth.token
  );

  const attendanceRecordsInDb = await Attendance.find({ session: targetSession._id, student: createdStudentId });
  assert(
    'FLOW 5.2',
    'Subsequent save updates attendance status idempotently without duplicate records',
    markAttendanceRes2.ok && attendanceRecordsInDb.length === 1 && attendanceRecordsInDb[0].status === 'Late',
    `Records in DB: ${attendanceRecordsInDb.length}, Status: ${attendanceRecordsInDb[0]?.status}`
  );

  // Teacher cannot mark another teacher's session
  const otherTeacherSession = await ClassSession.findOne({ teacher: { $ne: teacherDocInDb._id } });
  const unauthorizedAttRes = await request(
    'PUT',
    `/api/sessions/${otherTeacherSession._id}/attendance`,
    {
      records: [{ studentId: createdStudentId, status: 'Present' }],
    },
    newTeacherAuth.token
  );

  assert(
    'FLOW 5.3',
    'Teacher cannot mark attendance for another teacher’s session (403 Forbidden)',
    unauthorizedAttRes.status === 403,
    `Status: ${unauthorizedAttRes.status}`
  );

  // =========================================================================
  // FLOW 6: LEARNING RESULTS
  // =========================================================================
  console.log('\n--- FLOW 6: LEARNING RESULTS ---');
  const enterResultsRes = await request(
    'POST',
    `/api/classes/${createdClassId}/results`,
    {
      testType: 'midterm',
      testDate: new Date().toISOString(),
      records: [
        {
          studentId: createdStudentId,
          listeningScore: 85,
          speakingScore: 80,
          readingScore: 90,
          writingScore: 75,
          teacherComment: 'Tiến bộ vượt bậc về phản xạ phát âm',
        },
      ],
    },
    newTeacherAuth.token
  );

  const resultSaved = enterResultsRes.ok && enterResultsRes.data?.data?.length > 0;
  const resultDocInDb = await LearningResult.findOne({ class: createdClassId, student: createdStudentId });

  assert(
    'FLOW 6.1',
    'Teacher enters 4-skill midterm results with overall calculated (82.5)',
    resultSaved && !!resultDocInDb && resultDocInDb.overallScore === 82.5,
    `Status: ${enterResultsRes.status}, overallScore: ${resultDocInDb?.overallScore}`
  );

  // Receptionist reads class results (read-only allowed)
  const recepReadResultsRes = await request('GET', `/api/classes/${createdClassId}/results`, null, recepAuth.token);
  assert(
    'FLOW 6.2',
    'Receptionist can view class results (read-only)',
    recepReadResultsRes.ok && recepReadResultsRes.data?.data?.results?.length > 0,
    `Status: ${recepReadResultsRes.status}`
  );

  // Student reads own results
  const newStudentAuth = await login(newStudentEmail, 'StudentPassword123!');
  const studentReadResultsRes = await request('GET', '/api/student/results', null, newStudentAuth.token);
  const studentResultsArray = studentReadResultsRes.data?.data?.results || studentReadResultsRes.data?.data || [];
  assert(
    'FLOW 6.3',
    'Student can view their own learning results in student portal',
    studentReadResultsRes.ok && Array.isArray(studentResultsArray) && studentResultsArray.length > 0,
    `Status: ${studentReadResultsRes.status}, Count: ${studentResultsArray.length}`
  );

  // =========================================================================
  // FLOW 7: TUITION & PAYMENT
  // =========================================================================
  console.log('\n--- FLOW 7: TUITION & PAYMENT ---');
  // Receptionist records partial payment of 2,000,000 on the auto-created invoice (4,500,000)
  const partPaymentRes = await request(
    'POST',
    `/api/tuition/invoices/${autoInvoice._id}/payments`,
    {
      amount: 2000000,
      paymentMethod: 'bank_transfer',
      note: 'Thanh toán đợt 1',
    },
    recepAuth.token
  );

  const invAfterPart = await TuitionInvoice.findById(autoInvoice._id);
  assert(
    'FLOW 7.1',
    'Receptionist records partial payment (paid: 2,000,000, remaining: 2,500,000, status: partial)',
    partPaymentRes.ok && invAfterPart.paidAmount === 2000000 && invAfterPart.remainingAmount === 2500000 && invAfterPart.status === 'partial',
    `Paid: ${invAfterPart.paidAmount}, Rem: ${invAfterPart.remainingAmount}, Status: ${invAfterPart.status}`
  );

  // Receptionist records remaining payment of 2,500,000
  const fullPaymentRes = await request(
    'POST',
    `/api/tuition/invoices/${autoInvoice._id}/payments`,
    {
      amount: 2500000,
      paymentMethod: 'cash',
      note: 'Thanh toán đợt 2 đủ học phí',
    },
    recepAuth.token
  );

  const secondPaymentId = fullPaymentRes.data?.data?.payment?._id;
  const invAfterFull = await TuitionInvoice.findById(autoInvoice._id);
  assert(
    'FLOW 7.2',
    'Receptionist records remaining payment (paid: 4,500,000, remaining: 0, status: paid)',
    fullPaymentRes.ok && invAfterFull.paidAmount === 4500000 && invAfterFull.remainingAmount === 0 && invAfterFull.status === 'paid',
    `Paid: ${invAfterFull.paidAmount}, Rem: ${invAfterFull.remainingAmount}, Status: ${invAfterFull.status}`
  );

  // =========================================================================
  // FLOW 10: PAYMENT VOID TEST (Admin Only)
  // =========================================================================
  console.log('\n--- FLOW 10: PAYMENT VOID TEST ---');
  // Admin voids the second payment
  const voidPaymentRes = await request(
    'POST',
    `/api/payments/${secondPaymentId}/void`,
    {
      voidReason: 'Khách hàng chuyển thừa tiền, hoàn trả và cập nhật lại phiếu thu',
    },
    adminAuth.token
  );

  const invAfterVoid = await TuitionInvoice.findById(autoInvoice._id);
  const voidedPaymentDoc = await Payment.findById(secondPaymentId);

  assert(
    'FLOW 10.1',
    'Admin voids payment with audit reason; invoice recalculates to partial (paid: 2,000,000, remaining: 2,500,000)',
    voidPaymentRes.ok &&
      voidedPaymentDoc.status === 'voided' &&
      invAfterVoid.paidAmount === 2000000 &&
      invAfterVoid.remainingAmount === 2500000 &&
      invAfterVoid.status === 'partial',
    `Void Status: ${voidPaymentRes.status}, Paid: ${invAfterVoid.paidAmount}, Status: ${invAfterVoid.status}`
  );

  // Receptionist forbidden from voiding payments
  const recepVoidRes = await request(
    'POST',
    `/api/payments/${secondPaymentId}/void`,
    { voidReason: 'Thử nghiệm lễ tân hủy giao dịch' },
    recepAuth.token
  );
  assert(
    'FLOW 10.2',
    'Receptionist is forbidden from voiding payments (403 Forbidden)',
    recepVoidRes.status === 403,
    `Status: ${recepVoidRes.status}`
  );

  // =========================================================================
  // FLOW 8: STUDENT PORTAL ISOLATION
  // =========================================================================
  console.log('\n--- FLOW 8: STUDENT PORTAL ISOLATION ---');
  // Student sees their own active classes via /api/classes or /api/student/dashboard
  const studClassesRes = await request('GET', '/api/classes', null, newStudentAuth.token);
  // Student sees their own invoices
  const studInvoicesRes = await request('GET', '/api/student/invoices', null, newStudentAuth.token);
  // Student sees their own attendance
  const studAttRes = await request('GET', '/api/student/attendance', null, newStudentAuth.token);

  assert(
    'FLOW 8.1',
    'Student accesses personal classes, invoices, and attendance history',
    studClassesRes.ok && studInvoicesRes.ok && studAttRes.ok,
    `Classes: ${studClassesRes.status}, Invoices: ${studInvoicesRes.status}, Att: ${studAttRes.status}`
  );

  // Student forbidden from accessing staff resources
  const studAccessStudentsRes = await request('GET', '/api/students', null, newStudentAuth.token);
  const studAccessAccountsRes = await request('GET', '/api/accounts', null, newStudentAuth.token);
  const studAccessAdminDashRes = await request('GET', '/api/admin/dashboard', null, newStudentAuth.token);

  assert(
    'FLOW 8.2',
    'Student strictly blocked from staff endpoints (/api/students, /api/accounts, /api/admin/dashboard)',
    studAccessStudentsRes.status === 403 && studAccessAccountsRes.status === 403 && studAccessAdminDashRes.status === 403,
    `Students: ${studAccessStudentsRes.status}, Accounts: ${studAccessAccountsRes.status}, AdminDash: ${studAccessAdminDashRes.status}`
  );

  // =========================================================================
  // NOTICE FLOW (Audience Filtering)
  // =========================================================================
  console.log('\n--- NOTICE FLOW ---');
  // Admin creates student-only notice
  const createStudentNoticeRes = await request(
    'POST',
    '/api/notices',
    {
      title: 'Thông báo chuyên biệt học viên E2E',
      content: 'Lưu ý chuẩn bị thẻ học viên trước khi vào phòng lab.',
      audience: 'student',
    },
    adminAuth.token
  );

  // Admin creates all-audience notice
  const createAllNoticeRes = await request(
    'POST',
    '/api/notices',
    {
      title: 'Thông báo toàn trung tâm E2E',
      content: 'Lịch bảo trì hệ thống máy chủ cuối tuần.',
      audience: 'all',
    },
    adminAuth.token
  );

  assert('NOTICE 1', 'Admin creates targeted notices successfully', createStudentNoticeRes.ok && createAllNoticeRes.ok);

  const studentNotices = await request('GET', '/api/notices', null, newStudentAuth.token);
  const teacherNotices = await request('GET', '/api/notices', null, newTeacherAuth.token);

  const studentSeesStudentNotice = studentNotices.data.some((n) => n.title === 'Thông báo chuyên biệt học viên E2E');
  const teacherSeesStudentNotice = teacherNotices.data.some((n) => n.title === 'Thông báo chuyên biệt học viên E2E');
  const teacherSeesAllNotice = teacherNotices.data.some((n) => n.title === 'Thông báo toàn trung tâm E2E');

  assert(
    'NOTICE 2',
    'Audience filtering: Student sees student notice; Teacher does NOT see student notice; Teacher sees all notice',
    studentSeesStudentNotice && !teacherSeesStudentNotice && teacherSeesAllNotice,
    `StudentSees: ${studentSeesStudentNotice}, TeacherSeesStudent: ${teacherSeesStudentNotice}, TeacherSeesAll: ${teacherSeesAllNotice}`
  );

  // =========================================================================
  // STUDY MATERIAL FLOW
  // =========================================================================
  console.log('\n--- STUDY MATERIAL FLOW ---');
  const materialDoc = await StudyMaterial.create({
    title: 'Speaking Part 3 High-Scoring Samples E2E',
    description: 'Tài liệu hướng dẫn triển khai ý tưởng phức tạp',
    fileUrl: '/uploads/materials/ielts_speaking_part2_card.pdf',
    class: createdClassId,
    uploadedBy: teacherDocInDb.userId,
    fileSize: 1024,
    fileType: 'pdf',
  });

  // Enrolled student accesses class materials
  const enrolledMatRes = await request('GET', `/api/classes/${createdClassId}/materials`, null, newStudentAuth.token);
  assert(
    'MATERIAL 1',
    'Enrolled student accesses study materials of enrolled class',
    enrolledMatRes.ok && Array.isArray(enrolledMatRes.data) && enrolledMatRes.data.length > 0,
    `Status: ${enrolledMatRes.status}`
  );

  // Unenrolled student calling class materials -> 403 Forbidden
  const unenrolledStudent = await Student.findOne({ _id: { $ne: createdStudentId } });
  const unenrolledUser = await User.findById(unenrolledStudent.userId);
  const unenrolledToken = (await login(unenrolledUser.email, 'VLearnStudent123!')).token;

  const unenrolledMatRes = await request('GET', `/api/classes/${createdClassId}/materials`, null, unenrolledToken);
  assert(
    'MATERIAL 2',
    'Unenrolled student blocked from accessing class study materials (403 Forbidden)',
    unenrolledMatRes.status === 403,
    `Status: ${unenrolledMatRes.status}`
  );

  // =========================================================================
  // DASHBOARD REGRESSION TEST
  // =========================================================================
  console.log('\n--- DASHBOARDS REGRESSION TEST ---');
  const adminDash = (await request('GET', '/api/admin/dashboard', null, adminAuth.token)).data;
  const recepDash = (await request('GET', '/api/receptionist/dashboard', null, recepAuth.token)).data;
  const teachDash = (await request('GET', '/api/teacher/dashboard', null, newTeacherAuth.token)).data;
  const studDash = (await request('GET', '/api/student/dashboard', null, newStudentAuth.token)).data;

  assert(
    'DASHBOARD 1',
    'Admin dashboard reflects updated non-zero counts (students, classes, tuition)',
    adminDash.totalStudents > 0 && adminDash.activeClasses > 0 && adminDash.totalTuition > 0,
    `Students: ${adminDash.totalStudents}, Classes: ${adminDash.activeClasses}`
  );

  assert(
    'DASHBOARD 2',
    'Receptionist dashboard reflects student onboarding & tuition data',
    recepDash.recentStudents?.length > 0,
    `RecentStudents: ${recepDash.recentStudents?.length}`
  );

  assert(
    'DASHBOARD 3',
    'Teacher dashboard reflects newly assigned class and scheduled session',
    teachDash.assignedClasses?.length > 0,
    `Assigned: ${teachDash.assignedClasses?.length}`
  );

  assert(
    'DASHBOARD 4',
    'Student dashboard reflects enrolled class, attendance rate, and invoices',
    studDash.activeClasses?.length > 0 && studDash.tuitionSummary?.latestInvoices?.length > 0,
    `Active: ${studDash.activeClasses?.length}, Invoices: ${studDash.tuitionSummary?.latestInvoices?.length}`
  );

  // =========================================================================
  // AUTHORIZATION REGRESSION TEST
  // =========================================================================
  console.log('\n--- AUTHORIZATION REGRESSION TEST ---');
  const authChecks = [
    { role: 'Receptionist', endpoint: '/api/accounts', expected: 403, token: recepAuth.token },
    { role: 'Teacher', endpoint: '/api/tuition/invoices', expected: 403, token: teachAuth.token },
    { role: 'Student', endpoint: '/api/students', expected: 403, token: studAuth.token },
  ];

  for (const check of authChecks) {
    const res = await request('GET', check.endpoint, null, check.token);
    assert(
      'AUTH REGRESSION',
      `${check.role} accessing ${check.endpoint} receives ${check.expected}`,
      res.status === check.expected,
      `Got status: ${res.status}`
    );
  }

  // =========================================================================
  // FORM VALIDATION & API ERROR REGRESSION TEST
  // =========================================================================
  console.log('\n--- FORM VALIDATION & API ERROR REGRESSION TEST ---');
  // 1. Student missing required fields
  const valStudentRes = await request('POST', '/api/students', { phone: '123' }, recepAuth.token);
  assert(
    'VALIDATION 1',
    'Student creation without fullName/email rejected with 400',
    valStudentRes.status === 400,
    `Status: ${valStudentRes.status}`
  );

  // 2. Schedule endTime <= startTime
  const valScheduleRes = await request(
    'POST',
    `/api/classes/${createdClassId}/schedules`,
    { dayOfWeek: 3, startTime: '19:00', endTime: '18:00', room: 'Room 101' },
    adminAuth.token
  );
  assert(
    'VALIDATION 2',
    'Schedule with endTime <= startTime rejected with 422',
    valScheduleRes.status === 422,
    `Status: ${valScheduleRes.status}`
  );

  // 3. Result score > 100
  const valResultRes = await request(
    'POST',
    `/api/classes/${createdClassId}/results`,
    {
      testType: 'midterm',
      records: [{ studentId: createdStudentId, listeningScore: 105, speakingScore: 80, readingScore: 80, writingScore: 80 }],
    },
    newTeacherAuth.token
  );
  assert(
    'VALIDATION 3',
    'Result with score > 100 rejected with 422 or 400',
    valResultRes.status === 422 || valResultRes.status === 400,
    `Status: ${valResultRes.status}`
  );

  // 4. Payment amount <= 0
  const valPayRes = await request(
    'POST',
    `/api/tuition/invoices/${autoInvoice._id}/payments`,
    { amount: -50000 },
    recepAuth.token
  );
  assert(
    'VALIDATION 4',
    'Payment with non-positive amount rejected with 422',
    valPayRes.status === 422,
    `Status: ${valPayRes.status}`
  );

  // 5. Payment overpayment
  const valOverpayRes = await request(
    'POST',
    `/api/tuition/invoices/${autoInvoice._id}/payments`,
    { amount: 10000000 },
    recepAuth.token
  );
  assert(
    'VALIDATION 5',
    'Payment amount exceeding remaining balance rejected with 409 Conflict',
    valOverpayRes.status === 409,
    `Status: ${valOverpayRes.status}`
  );

  // 6. Notice with empty title
  const valNoticeRes = await request(
    'POST',
    '/api/notices',
    { title: '   ', content: 'Nội dung' },
    adminAuth.token
  );
  assert(
    'VALIDATION 6',
    'Notice with blank title rejected with 400',
    valNoticeRes.status === 400,
    `Status: ${valNoticeRes.status}`
  );

  // 7. Invalid ObjectId
  const invalidIdRes = await request('GET', '/api/students/not-an-objectid', null, recepAuth.token);
  assert(
    'API ERROR 1',
    'Invalid ObjectId parameter handled with 400 without crashing',
    invalidIdRes.status === 400,
    `Status: ${invalidIdRes.status}`
  );

  // 8. Missing resource -> 404
  const missingRes = await request('GET', `/api/students/${new mongoose.Types.ObjectId()}`, null, recepAuth.token);
  assert(
    'API ERROR 2',
    'Non-existent ObjectId handled with 404',
    missingRes.status === 404,
    `Status: ${missingRes.status}`
  );

  // 9. Unauthenticated request -> 401
  const unauthRes = await request('GET', '/api/admin/dashboard');
  assert(
    'API ERROR 3',
    'Unauthenticated request returns 401',
    unauthRes.status === 401,
    `Status: ${unauthRes.status}`
  );

  // =========================================================================
  // DATA INTEGRITY CHECK
  // =========================================================================
  console.log('\n--- DATA INTEGRITY CHECK ---');
  // Verify 1-to-1 User/Student and User/Teacher relationships
  const orphanStudents = await Student.countDocuments({ userId: { $exists: false } });
  const orphanTeachers = await Teacher.countDocuments({ userId: { $exists: false } });
  assert('DATA INTEGRITY 1', '0 orphan Student or Teacher profiles in database', orphanStudents === 0 && orphanTeachers === 0);

  // Verify financial totals across all invoices
  const allInvoices = await TuitionInvoice.find();
  const allPayments = await Payment.find();
  let allFinanceSound = true;
  for (const inv of allInvoices) {
    const compPayments = allPayments.filter((p) => p.invoice.toString() === inv._id.toString() && p.status === 'completed');
    const sumPaid = compPayments.reduce((s, p) => s + p.amount, 0);
    if (inv.paidAmount !== sumPaid || inv.remainingAmount !== inv.totalAmount - inv.paidAmount) {
      allFinanceSound = false;
      break;
    }
  }
  assert('DATA INTEGRITY 2', '100% of TuitionInvoices mathematically match completed Payment sums', allFinanceSound);

  // Verify unique attendance student+session
  const atts = await Attendance.find();
  const attSet = new Set();
  let duplicateAtt = false;
  for (const a of atts) {
    const k = `${a.student}_${a.session}`;
    if (attSet.has(k)) {
      duplicateAtt = true;
      break;
    }
    attSet.add(k);
  }
  assert('DATA INTEGRITY 3', '0 duplicate attendance records (unique student + session enforced)', !duplicateAtt);

  // =========================================================================
  // BUILD VERIFICATION
  // =========================================================================
  console.log('\n--- BUILD VERIFICATION ---');
  let buildOk = false;
  try {
    const feDir = path.join(__dirname, '../../frontend');
    execSync('npm run build', { cwd: feDir, stdio: 'pipe' });
    buildOk = true;
  } catch (e) {
    buildOk = false;
  }
  assert('BUILD VERIFICATION', 'Frontend build (npm run build) compiles with 0 errors', buildOk);

  console.log(`\n====================================================`);
  console.log(`KẾT QUẢ TỔNG THỂ E2E: ${passedCount} / ${totalCount} KIỂM THỬ THÀNH CÔNG.`);
  console.log(`====================================================\n`);

  await mongoose.disconnect();
  process.exit(passedCount === totalCount ? 0 : 1);
}

runE2E().catch((err) => {
  console.error('Fatal E2E test runner exception:', err);
  process.exit(1);
});
