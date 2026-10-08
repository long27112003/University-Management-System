const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const LearningResult = require('../models/LearningResult');

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
  console.log('RUNNING PHASE 6 AUTOMATED TEST SUITE');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGO_URI);

  // Sync LearningResult indexes
  await LearningResult.syncIndexes();
  console.log('✅ LearningResult model indexes synchronized.\n');

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

  try {
    const adminToken = await login('admin@university.com', 'admin123');
    const recepToken = await login('receptionist@university.com', 'receptionist123');
    const teacherAToken = await login('professor@university.com', 'professor123');
    const studentAToken = await login('student@university.com', 'student123');

    // Fetch Teacher profiles
    const teacherUserA = await User.findOne({ email: 'professor@university.com' });
    const teacherDocA = await Teacher.findOne({ userId: teacherUserA._id });

    let teacherUserB = await User.findOne({ email: 'teacherB_test@vlearn.test' });
    let teacherDocB;
    if (!teacherUserB) {
      const tBRes = await req('/teachers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          fullName: 'Giáo viên B Test Phase 6',
          email: `teacherB_${Date.now()}@vlearn.test`,
          phone: '0977777777',
          specialization: ['listening']
        }
      });
      teacherDocB = await Teacher.findById(tBRes.data.data._id);
      teacherUserB = await User.findById(teacherDocB.userId);
    } else {
      teacherDocB = await Teacher.findOne({ userId: teacherUserB._id });
    }
    const teacherBToken = await login(teacherUserB.email, 'teacher123');

    // Fetch Student A profile
    const studentUserA = await User.findOne({ email: 'student@university.com' });
    const studentDocA = await Student.findOne({ userId: studentUserA._id });

    // Fetch or create Student B profile
    let studentDocB = await Student.findOne({ email: /studentB_/ });
    let studentUserB;
    if (!studentDocB) {
      const sBRes = await req('/students', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          fullName: 'Học viên B Test Phase 6',
          email: `studentB_${Date.now()}@vlearn.test`,
          phone: '0966666661',
          gender: 'female',
          dateOfBirth: '2002-05-10',
          academicStatus: 'active'
        }
      });
      studentDocB = await Student.findById(sBRes.data.data._id);
      studentUserB = await User.findById(studentDocB.userId);
    } else {
      studentUserB = await User.findById(studentDocB.userId);
    }
    const studentBToken = await login(studentUserB.email, 'student123');

    // Clean up previous test classes & results
    const oldClasses = await Class.find({ classCode: /^VL-RES-/ });
    const oldClassIds = oldClasses.map(c => c._id);
    await LearningResult.deleteMany({ class: { $in: oldClassIds } });
    await Enrollment.deleteMany({ class: { $in: oldClassIds } });
    await Class.deleteMany({ _id: { $in: oldClassIds } });

    const timestamp = Date.now();

    // 1. Create Class A (assigned to Teacher A)
    const testClassA = await Class.create({
      classCode: `VL-RES-${timestamp}-A`,
      className: `Result Test Class A ${timestamp}`,
      skill: 'speaking',
      room: 'Phòng 301',
      maxCapacity: 20,
      tuitionFee: 3500000,
      totalSessions: 10,
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-12-15'),
      status: 'active',
      teacher: teacherDocA._id
    });

    // 2. Create Class B (assigned to Teacher B)
    const testClassB = await Class.create({
      classCode: `VL-RES-${timestamp}-B`,
      className: `Result Test Class B ${timestamp}`,
      skill: 'listening',
      room: 'Phòng 302',
      maxCapacity: 20,
      tuitionFee: 3500000,
      totalSessions: 10,
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-12-15'),
      status: 'active',
      teacher: teacherDocB._id
    });

    // Enroll students: Student A in Class A, Student B in Class B
    await Enrollment.create([
      { student: studentDocA._id, class: testClassA._id, status: 'active', enrolledAt: new Date() },
      { student: studentDocB._id, class: testClassB._id, status: 'active', enrolledAt: new Date() }
    ]);

    // ----------------------------------------------------
    // TC6.1: Teacher opens own class -> enrolled students load.
    // ----------------------------------------------------
    const res6_1 = await req(`/classes/${testClassA._id}/enrollments`, {
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    if (res6_1.status === 200 && res6_1.data?.data?.length === 1) {
      console.log('✅ TC6.1 PASS: Teacher A opens own class, loaded active enrollments.');
      results['TC6.1'] = 'PASS';
    } else {
      console.error('❌ TC6.1 FAIL:', res6_1.status, res6_1.data);
      results['TC6.1'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.2: Enter L=80, S=85, R=75, W=90 -> overall calculated correctly (82.5).
    // ----------------------------------------------------
    const res6_2 = await req(`/classes/${testClassA._id}/results`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        testType: 'midterm',
        testDate: '2026-11-10',
        records: [
          {
            studentId: studentDocA._id,
            listeningScore: 80,
            speakingScore: 85,
            readingScore: 75,
            writingScore: 90,
            teacherComment: 'Làm bài rất tốt'
          }
        ]
      }
    });

    const createdRecord = res6_2.data?.data?.[0];
    if (res6_2.status === 201 && createdRecord && createdRecord.overallScore === 82.5) {
      console.log(`✅ TC6.2 PASS: Server-side overallScore calculation verified: 82.5 (from 80, 85, 75, 90).`);
      results['TC6.2'] = 'PASS';
    } else {
      console.error('❌ TC6.2 FAIL:', res6_2.status, res6_2.data);
      results['TC6.2'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.3: Submit score 105 -> 422 Unprocessable Entity.
    // ----------------------------------------------------
    const res6_3 = await req(`/classes/${testClassA._id}/results`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        testType: 'final',
        testDate: '2026-11-12',
        records: [
          {
            studentId: studentDocA._id,
            listeningScore: 105,
            speakingScore: 80
          }
        ]
      }
    });

    if (res6_3.status === 422) {
      console.log('✅ TC6.3 PASS: Score > 100 (105) rejected with 422 Unprocessable Entity.');
      results['TC6.3'] = 'PASS';
    } else {
      console.error('❌ TC6.3 FAIL:', res6_3.status, res6_3.data);
      results['TC6.3'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.4: Submit score -5 -> 422 Unprocessable Entity.
    // ----------------------------------------------------
    const res6_4 = await req(`/classes/${testClassA._id}/results`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        testType: 'final',
        testDate: '2026-11-12',
        records: [
          {
            studentId: studentDocA._id,
            listeningScore: -5,
            speakingScore: 80
          }
        ]
      }
    });

    if (res6_4.status === 422) {
      console.log('✅ TC6.4 PASS: Negative score (-5) rejected with 422 Unprocessable Entity.');
      results['TC6.4'] = 'PASS';
    } else {
      console.error('❌ TC6.4 FAIL:', res6_4.status, res6_4.data);
      results['TC6.4'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.5: Teacher A creates result for own class -> success.
    // ----------------------------------------------------
    const res6_5 = await req(`/classes/${testClassA._id}/results`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        testType: 'mock',
        testDate: '2026-11-14',
        records: [
          {
            studentId: studentDocA._id,
            listeningScore: 70,
            speakingScore: 75,
            teacherComment: 'Thi thử lần 1'
          }
        ]
      }
    });

    if (res6_5.status === 201 && res6_5.data?.data?.[0]?.overallScore === 72.5) {
      console.log('✅ TC6.5 PASS: Teacher A created mock test result successfully.');
      results['TC6.5'] = 'PASS';
    } else {
      console.error('❌ TC6.5 FAIL:', res6_5.status, res6_5.data);
      results['TC6.5'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.6: Teacher A attempts create/update result for Teacher B class -> 403 Forbidden.
    // ----------------------------------------------------
    const res6_6 = await req(`/classes/${testClassB._id}/results`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        testType: 'midterm',
        testDate: '2026-11-15',
        records: [
          {
            studentId: studentDocB._id,
            listeningScore: 80
          }
        ]
      }
    });

    if (res6_6.status === 403) {
      console.log('✅ TC6.6 PASS: Teacher A blocked from creating results for Teacher B class (403 Forbidden).');
      results['TC6.6'] = 'PASS';
    } else {
      console.error('❌ TC6.6 FAIL:', res6_6.status, res6_6.data);
      results['TC6.6'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.7: Receptionist views class results -> success.
    // ----------------------------------------------------
    const res6_7 = await req(`/classes/${testClassA._id}/results`, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });

    if (res6_7.status === 200 && res6_7.data?.data?.results?.length === 2) {
      console.log('✅ TC6.7 PASS: Receptionist successfully retrieved class learning results (read-only).');
      results['TC6.7'] = 'PASS';
    } else {
      console.error('❌ TC6.7 FAIL:', res6_7.status, res6_7.data);
      results['TC6.7'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.8: Receptionist attempts POST results -> 403 Forbidden.
    // ----------------------------------------------------
    const res6_8 = await req(`/classes/${testClassA._id}/results`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${recepToken}` },
      body: {
        testType: 'final',
        testDate: '2026-11-20',
        records: [
          { studentId: studentDocA._id, listeningScore: 80 }
        ]
      }
    });

    if (res6_8.status === 403) {
      console.log('✅ TC6.8 PASS: Receptionist write access to results blocked with 403 Forbidden.');
      results['TC6.8'] = 'PASS';
    } else {
      console.error('❌ TC6.8 FAIL:', res6_8.status, res6_8.data);
      results['TC6.8'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.9: Student GET /api/student/me/results -> sees only own records.
    // ----------------------------------------------------
    const res6_9 = await req('/student/me/results', {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });

    const stuAResults = res6_9.data?.data?.results || [];
    const allBelongToA = stuAResults.length === 2 && stuAResults.every(r => r.class?.classCode === testClassA.classCode);

    if (res6_9.status === 200 && allBelongToA) {
      console.log('✅ TC6.9 PASS: Student A retrieved self results (2 records) scoped to own identity.');
      results['TC6.9'] = 'PASS';
    } else {
      console.error('❌ TC6.9 FAIL:', res6_9.status, res6_9.data);
      results['TC6.9'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.10: Student cannot query another student's results.
    // ----------------------------------------------------
    const res6_10 = await req(`/students/${studentDocA._id}/results`, {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });

    if (res6_10.status === 403) {
      console.log('✅ TC6.10 PASS: Student B blocked from accessing Student A results directly (403 Forbidden).');
      results['TC6.10'] = 'PASS';
    } else {
      console.error('❌ TC6.10 FAIL:', res6_10.status, res6_10.data);
      results['TC6.10'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.11: Duplicate same logical test result -> 409 Conflict.
    // ----------------------------------------------------
    const res6_11 = await req(`/classes/${testClassA._id}/results`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        testType: 'midterm',
        testDate: '2026-11-10', // Same testType and testDate as TC6.2
        records: [
          {
            studentId: studentDocA._id,
            listeningScore: 85
          }
        ]
      }
    });

    if (res6_11.status === 409) {
      console.log('✅ TC6.11 PASS: Duplicate logical test result rejected with 409 Conflict.');
      results['TC6.11'] = 'PASS';
    } else {
      console.error('❌ TC6.11 FAIL:', res6_11.status, res6_11.data);
      results['TC6.11'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.12: Edit score (PUT /api/results/:id) -> overallScore recalculates correctly.
    // ----------------------------------------------------
    const resultToEditId = createdRecord._id;
    const res6_12 = await req(`/results/${resultToEditId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        readingScore: 95, // Was 75. New scores: L=80, S=85, R=95, W=90. Sum = 350. Avg = 87.5
        teacherComment: 'Đã phúc khảo điểm Đọc'
      }
    });

    if (res6_12.status === 200 && res6_12.data?.data?.overallScore === 87.5) {
      console.log('✅ TC6.12 PASS: Score updated via PUT /api/results/:id and overallScore recalculated to 87.5.');
      results['TC6.12'] = 'PASS';
    } else {
      console.error('❌ TC6.12 FAIL:', res6_12.status, res6_12.data);
      results['TC6.12'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC6.13: Existing result loads into class results view correctly.
    // ----------------------------------------------------
    const res6_13 = await req(`/classes/${testClassA._id}/results`, {
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });

    const updatedMidterm = res6_13.data?.data?.results?.find(r => r._id === resultToEditId);
    if (res6_13.status === 200 && updatedMidterm && updatedMidterm.readingScore === 95 && updatedMidterm.overallScore === 87.5) {
      console.log('✅ TC6.13 PASS: Updated scores loaded accurately in class results view.');
      results['TC6.13'] = 'PASS';
    } else {
      console.error('❌ TC6.13 FAIL:', res6_13.status, updatedMidterm);
      results['TC6.13'] = 'FAIL';
    }

    console.log('\n==================================================');
    console.log('SUMMARY OF PHASE 6 TEST RESULTS:');
    console.log('==================================================');
    console.table(results);

  } catch (error) {
    console.error('Exception during test run:', error);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
