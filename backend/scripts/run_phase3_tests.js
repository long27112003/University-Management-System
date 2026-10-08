const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');

const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING PHASE 3 AUTOMATED TEST SUITE');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGO_URI);

  const results = {};

  const login = async (email, password) => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (!res.ok) {
      throw new Error(`Login failed for ${email}: ${res.data?.message || res.status}`);
    }
    return res.data.token;
  };

  let adminToken, receptionistToken, teacherAToken, teacherBToken, studentAToken;
  let teacherADoc, teacherBDoc, studentADoc, studentBDoc;

  try {
    adminToken = await login('admin@university.com', 'admin123');
    receptionistToken = await login('receptionist@university.com', 'receptionist123');
    teacherAToken = await login('professor@university.com', 'professor123');
    studentAToken = await login('student@university.com', 'student123');

    // Get Teacher A doc
    const profUser = await User.findOne({ email: 'professor@university.com' });
    teacherADoc = await Teacher.findOne({ userId: profUser._id });

    // Ensure or find a Teacher B
    teacherBDoc = await Teacher.findOne({ _id: { $ne: teacherADoc._id } });
    if (!teacherBDoc) {
      // create Teacher B
      const tBRes = await req('/teachers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          fullName: 'Giáo viên B Test',
          email: `teacherB_${Date.now()}@vlearn.test`,
          phone: '0988888888',
          specialization: ['speaking']
        }
      });
      teacherBDoc = await Teacher.findById(tBRes.data.data._id);
    }
    // Teacher B user for login
    const teacherBUser = await User.findById(teacherBDoc.userId);
    // update password to testpass
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    teacherBUser.password = await bcrypt.hash('teacherB123', salt);
    await teacherBUser.save();
    teacherBToken = await login(teacherBUser.email, 'teacherB123');

    // Get Student A doc
    const studentUser = await User.findOne({ email: 'student@university.com' });
    studentADoc = await Student.findOne({ userId: studentUser._id });

    // Get another student or create Student B
    studentBDoc = await Student.findOne({ _id: { $ne: studentADoc._id } });

    console.log('✅ Logged in and initialized test users.\n');
  } catch (err) {
    console.error('❌ Failed test setup:', err.message);
    process.exit(1);
  }

  let classListeningId = null;
  let classSpeakingId = null;
  let classSmallId = null;

  // TC3.1: Admin creates Listening class → success
  try {
    const res = await req('/classes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        className: 'IELTS Listening Foundation K01',
        skill: 'listening',
        teacher: teacherADoc._id.toString(),
        maxCapacity: 15,
        startDate: '2026-11-01',
        endDate: '2027-01-15',
        tuitionFee: 3500000,
        room: 'Lab 01'
      }
    });

    if (res.status === 201 && res.data.success && res.data.data.classCode.startsWith('VL-LIS-K')) {
      classListeningId = res.data.data._id;
      results['TC3.1'] = 'PASS';
      console.log('✅ TC3.1 PASS: Admin created Listening class with code:', res.data.data.classCode);
    } else {
      results['TC3.1'] = `FAIL: status=${res.status}, msg=${res.data?.message}`;
      console.error('❌ TC3.1 FAIL:', res.data);
    }
  } catch (err) {
    results['TC3.1'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.1 FAIL:', err.message);
  }

  // Create classSpeaking for Teacher B
  try {
    const res = await req('/classes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        className: 'IELTS Speaking Master K02',
        skill: 'speaking',
        teacher: teacherBDoc._id.toString(),
        maxCapacity: 15,
        startDate: '2026-11-05',
        endDate: '2027-01-20',
        tuitionFee: 4200000,
        room: 'Room 202'
      }
    });
    classSpeakingId = res.data.data._id;
  } catch (e) {}

  // TC3.2: Receptionist tries to create Class → forbidden (403)
  try {
    const res = await req('/classes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: {
        className: 'Receptionist Fake Class',
        skill: 'reading',
        teacher: teacherADoc._id.toString(),
        startDate: '2026-11-01',
        endDate: '2027-01-15',
        room: 'Room 101'
      }
    });

    if (res.status === 403) {
      results['TC3.2'] = 'PASS';
      console.log('✅ TC3.2 PASS: Receptionist blocked from creating Class (403 Forbidden).');
    } else {
      results['TC3.2'] = `FAIL: status=${res.status}`;
      console.error('❌ TC3.2 FAIL');
    }
  } catch (err) {
    results['TC3.2'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.2 FAIL:', err.message);
  }

  let enrollmentAId = null;

  // TC3.3: Admin/Receptionist enroll Student A → success
  try {
    const res = await req(`/classes/${classListeningId}/enrollments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: {
        studentId: studentADoc._id.toString(),
        note: 'Ghi danh đợt 1'
      }
    });

    if (res.status === 201 && res.data.success && res.data.data.status === 'active') {
      enrollmentAId = res.data.data._id;
      results['TC3.3'] = 'PASS';
      console.log('✅ TC3.3 PASS: Receptionist successfully enrolled Student A.');
    } else {
      results['TC3.3'] = `FAIL: status=${res.status}, msg=${res.data?.message}`;
      console.error('❌ TC3.3 FAIL:', res.data);
    }
  } catch (err) {
    results['TC3.3'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.3 FAIL:', err.message);
  }

  // TC3.4: Enroll Student A again into same class while active → 409 Conflict
  try {
    const res = await req(`/classes/${classListeningId}/enrollments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        studentId: studentADoc._id.toString()
      }
    });

    if (res.status === 409) {
      results['TC3.4'] = 'PASS';
      console.log('✅ TC3.4 PASS: Duplicate active enrollment properly rejected with 409 Conflict.');
    } else {
      results['TC3.4'] = `FAIL: status=${res.status}`;
      console.error('❌ TC3.4 FAIL');
    }
  } catch (err) {
    results['TC3.4'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.4 FAIL:', err.message);
  }

  // TC3.5: Fill class to maxCapacity then enroll another Student → 409 Conflict
  try {
    // Create small capacity class: maxCapacity = 1
    const smallRes = await req('/classes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        className: 'IELTS Writing Small VIP',
        skill: 'writing',
        teacher: teacherADoc._id.toString(),
        maxCapacity: 1,
        startDate: '2026-11-01',
        endDate: '2027-01-15',
        tuitionFee: 6000000,
        room: 'VIP 01'
      }
    });
    classSmallId = smallRes.data.data._id;

    // Enroll Student B (slot 1/1)
    await req(`/classes/${classSmallId}/enrollments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { studentId: studentBDoc._id.toString() }
    });

    // Try to enroll Student A into filled class (slot 2/1)
    const overfillRes = await req(`/classes/${classSmallId}/enrollments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { studentId: studentADoc._id.toString() }
    });

    if (overfillRes.status === 409) {
      results['TC3.5'] = 'PASS';
      console.log('✅ TC3.5 PASS: Enrolling into full class rejected with 409 Conflict.');
    } else {
      results['TC3.5'] = `FAIL: status=${overfillRes.status}`;
      console.error('❌ TC3.5 FAIL');
    }
  } catch (err) {
    results['TC3.5'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.5 FAIL:', err.message);
  }

  // TC3.6: Student A enrolls into multiple different classes → allowed
  try {
    const res = await req(`/classes/${classSpeakingId}/enrollments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        studentId: studentADoc._id.toString(),
        note: 'Đăng ký thêm lớp Speaking'
      }
    });

    if (res.status === 201 && res.data.success) {
      results['TC3.6'] = 'PASS';
      console.log('✅ TC3.6 PASS: Student A successfully enrolled in multiple different classes.');
    } else {
      results['TC3.6'] = `FAIL: status=${res.status}`;
      console.error('❌ TC3.6 FAIL');
    }
  } catch (err) {
    results['TC3.6'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.6 FAIL:', err.message);
  }

  // TC3.7: Drop Student A enrollment → status dropped, record remains
  try {
    const res = await req(`/enrollments/${enrollmentAId}/drop`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: { reason: 'Bận công việc cá nhân' }
    });

    const doc = await Enrollment.findById(enrollmentAId);

    if (res.status === 200 && doc && doc.status === 'dropped' && doc.droppedAt) {
      results['TC3.7'] = 'PASS';
      console.log('✅ TC3.7 PASS: Dropped enrollment, status=dropped, record retained.');
    } else {
      results['TC3.7'] = `FAIL: status=${res.status}, docStatus=${doc?.status}`;
      console.error('❌ TC3.7 FAIL');
    }
  } catch (err) {
    results['TC3.7'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.7 FAIL:', err.message);
  }

  // TC3.8: Re-enroll Student A into same class after dropped → allowed, new active enrollment
  try {
    const res = await req(`/classes/${classListeningId}/enrollments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { studentId: studentADoc._id.toString(), note: 'Học lại sau khi bảo lưu' }
    });

    const activeCount = await Enrollment.countDocuments({
      student: studentADoc._id,
      class: classListeningId,
      status: 'active'
    });
    const droppedCount = await Enrollment.countDocuments({
      student: studentADoc._id,
      class: classListeningId,
      status: 'dropped'
    });

    if (res.status === 201 && activeCount === 1 && droppedCount === 1) {
      enrollmentAId = res.data.data._id; // update to new active enrollment ID
      results['TC3.8'] = 'PASS';
      console.log('✅ TC3.8 PASS: Re-enrolled after dropped (1 active, 1 dropped history preserved).');
    } else {
      results['TC3.8'] = `FAIL: status=${res.status}, active=${activeCount}, dropped=${droppedCount}`;
      console.error('❌ TC3.8 FAIL');
    }
  } catch (err) {
    results['TC3.8'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.8 FAIL:', err.message);
  }

  // TC3.9: Transfer Student to another class → old = transferred, new = active
  try {
    // Create new target class for transfer
    const targetClassRes = await req('/classes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        className: 'IELTS Reading Target Class K05',
        skill: 'reading',
        teacher: teacherADoc._id.toString(),
        maxCapacity: 20,
        startDate: '2026-11-10',
        endDate: '2027-01-25',
        tuitionFee: 3800000,
        room: 'Room 303'
      }
    });
    const targetClassId = targetClassRes.data.data._id;

    const transferRes = await req(`/enrollments/${enrollmentAId}/transfer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: {
        newClassId: targetClassId,
        reason: 'Đổi sang lớp đọc chuyên sâu'
      }
    });

    const oldDoc = await Enrollment.findById(enrollmentAId);
    const newDoc = await Enrollment.findOne({
      student: studentADoc._id,
      class: targetClassId,
      status: 'active'
    });

    if (transferRes.status === 200 && oldDoc.status === 'transferred' && newDoc && newDoc.transferredFrom.equals(classListeningId)) {
      results['TC3.9'] = 'PASS';
      console.log('✅ TC3.9 PASS: Transfer succeeded: old=transferred, new=active linked with transferredFrom.');
    } else {
      results['TC3.9'] = `FAIL: status=${transferRes.status}`;
      console.error('❌ TC3.9 FAIL:', transferRes.data);
    }
  } catch (err) {
    results['TC3.9'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.9 FAIL:', err.message);
  }

  // TC3.10: Teacher A gets My Classes → only assigned classes
  try {
    const res = await req('/teacher/me/classes', {
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });

    const teacherAClasses = res.data.data;
    const allBelongToA = teacherAClasses.every(
      (c) => c.teacher && (c.teacher._id === teacherADoc._id.toString() || c.teacher.teacherCode === teacherADoc.teacherCode)
    );

    if (res.status === 200 && teacherAClasses.length > 0 && allBelongToA) {
      results['TC3.10'] = 'PASS';
      console.log(`✅ TC3.10 PASS: Teacher A gets only assigned classes (${teacherAClasses.length} classes).`);
    } else {
      results['TC3.10'] = `FAIL: length=${teacherAClasses?.length}, allBelong=${allBelongToA}`;
      console.error('❌ TC3.10 FAIL');
    }
  } catch (err) {
    results['TC3.10'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.10 FAIL:', err.message);
  }

  // TC3.11: Teacher A tries to read class enrollment list of Teacher B → 403 Forbidden
  try {
    const res = await req(`/classes/${classSpeakingId}/enrollments`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });

    if (res.status === 403) {
      results['TC3.11'] = 'PASS';
      console.log('✅ TC3.11 PASS: Teacher A blocked from viewing enrollment list of Teacher B class (403 Forbidden).');
    } else {
      results['TC3.11'] = `FAIL: status=${res.status}`;
      console.error('❌ TC3.11 FAIL');
    }
  } catch (err) {
    results['TC3.11'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.11 FAIL:', err.message);
  }

  // TC3.12: Student sees only classes linked through own active enrollment
  try {
    const res = await req('/classes?limit=100', {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });

    const studentClasses = res.data.data;
    // Check in DB: active enrollments of student A
    const activeStudentEnrollments = await Enrollment.find({
      student: studentADoc._id,
      status: 'active'
    });
    const expectedClassIds = activeStudentEnrollments.map((e) => e.class.toString());
    const returnedClassIds = studentClasses.map((c) => c._id.toString());

    const isMatch =
      expectedClassIds.length === returnedClassIds.length &&
      expectedClassIds.every((id) => returnedClassIds.includes(id));

    if (res.status === 200 && isMatch) {
      results['TC3.12'] = 'PASS';
      console.log(`✅ TC3.12 PASS: Student sees only own enrolled classes (${studentClasses.length} classes).`);
    } else {
      results['TC3.12'] = `FAIL: expected=${expectedClassIds.length}, returned=${returnedClassIds.length}`;
      console.error('❌ TC3.12 FAIL');
    }
  } catch (err) {
    results['TC3.12'] = `FAIL: ${err.message}`;
    console.error('❌ TC3.12 FAIL:', err.message);
  }

  console.log('\n==================================================');
  console.log('SUMMARY OF PHASE 3 TEST RESULTS:');
  console.log('==================================================');
  console.table(results);

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
