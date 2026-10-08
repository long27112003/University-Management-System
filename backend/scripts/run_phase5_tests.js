const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');

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
  console.log('RUNNING PHASE 5 AUTOMATED TEST SUITE');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGO_URI);

  // Sync Attendance indexes to ensure compound unique index { student: 1, session: 1 } exists
  await Attendance.syncIndexes();
  console.log('✅ Attendance model indexes synchronized.\n');

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
          fullName: 'Giáo viên B Test Phase 5',
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

    // Fetch or create Student B & Student C profiles
    let studentDocB = await Student.findOne({ studentCode: 'STU-TEST-B' });
    let studentUserB;
    if (!studentDocB) {
      const sBRes = await req('/students', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          fullName: 'Học viên B Test Phase 5',
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

    let studentDocC = await Student.findOne({ studentCode: 'STU-TEST-C' });
    if (!studentDocC) {
      const sCRes = await req('/students', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          fullName: 'Học viên C Test Phase 5',
          email: `studentC_${Date.now()}@vlearn.test`,
          phone: '0966666662',
          gender: 'male',
          dateOfBirth: '2001-11-20',
          academicStatus: 'active'
        }
      });
      studentDocC = await Student.findById(sCRes.data.data._id);
    }

    // Student outsider (not enrolled in class)
    let studentDocOutsider = await Student.findOne({ studentCode: 'STU-TEST-OUT' });
    if (!studentDocOutsider) {
      const sOutRes = await req('/students', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          fullName: 'Học viên Ngoài Lớp',
          email: `studentOut_${Date.now()}@vlearn.test`,
          phone: '0966666663',
          gender: 'female',
          dateOfBirth: '2003-01-15',
          academicStatus: 'active'
        }
      });
      studentDocOutsider = await Student.findById(sOutRes.data.data._id);
    }

    console.log('✅ Logged in and initialized test users and student profiles.\n');

    // Clean up previous test classes & sessions
    const oldClasses = await Class.find({ classCode: /^VL-ATT-/ });
    const oldClassIds = oldClasses.map(c => c._id);
    await Attendance.deleteMany({ class: { $in: oldClassIds } });
    await ClassSession.deleteMany({ class: { $in: oldClassIds } });
    await Enrollment.deleteMany({ class: { $in: oldClassIds } });
    await Class.deleteMany({ _id: { $in: oldClassIds } });

    const timestamp = Date.now();

    // 1. Create Class A (assigned to Teacher A)
    const testClassA = await Class.create({
      classCode: `VL-ATT-${timestamp}-A`,
      className: `Attendance Test Class A ${timestamp}`,
      skill: 'speaking',
      room: 'Phòng 201',
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
      classCode: `VL-ATT-${timestamp}-B`,
      className: `Attendance Test Class B ${timestamp}`,
      skill: 'listening',
      room: 'Phòng 202',
      maxCapacity: 20,
      tuitionFee: 3500000,
      totalSessions: 10,
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-12-15'),
      status: 'active',
      teacher: teacherDocB._id
    });

    // Enroll students in Class A: Student A, B, C
    await Enrollment.create([
      { student: studentDocA._id, class: testClassA._id, status: 'active', enrolledAt: new Date() },
      { student: studentDocB._id, class: testClassA._id, status: 'active', enrolledAt: new Date() },
      { student: studentDocC._id, class: testClassA._id, status: 'active', enrolledAt: new Date() }
    ]);

    // Enroll Student B in Class B
    await Enrollment.create([
      { student: studentDocB._id, class: testClassB._id, status: 'active', enrolledAt: new Date() }
    ]);

    // Create Session 1 for Class A (Scheduled, Teacher A)
    const sessionA1 = await ClassSession.create({
      class: testClassA._id,
      sessionNumber: 1,
      sessionDate: new Date('2026-11-02'),
      startTime: '18:00',
      endTime: '19:30',
      teacher: teacherDocA._id,
      room: 'Phòng 201',
      status: 'scheduled'
    });

    // Create Session 2 for Class A (Cancelled, Teacher A)
    const sessionA2_cancelled = await ClassSession.create({
      class: testClassA._id,
      sessionNumber: 2,
      sessionDate: new Date('2026-11-05'),
      startTime: '18:00',
      endTime: '19:30',
      teacher: teacherDocA._id,
      room: 'Phòng 201',
      status: 'cancelled'
    });

    // Create Session for Class B (Scheduled, Teacher B)
    const sessionB1 = await ClassSession.create({
      class: testClassB._id,
      sessionNumber: 1,
      sessionDate: new Date('2026-11-03'),
      startTime: '19:30',
      endTime: '21:00',
      teacher: teacherDocB._id,
      room: 'Phòng 202',
      status: 'scheduled'
    });

    // ----------------------------------------------------
    // TC5.1: Teacher opens assigned session. Roster contains all actively enrolled students.
    // ----------------------------------------------------
    const res5_1 = await req(`/sessions/${sessionA1._id}/attendance`, {
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    const rosterRecords = res5_1.data?.data?.records || [];
    const studentIdsInRoster = rosterRecords.map(r => r.studentId.toString());
    const hasAllThree = [studentDocA._id.toString(), studentDocB._id.toString(), studentDocC._id.toString()]
      .every(id => studentIdsInRoster.includes(id));

    if (res5_1.status === 200 && rosterRecords.length === 3 && hasAllThree) {
      console.log('✅ TC5.1 PASS: Teacher A opens assigned session. Roster contains all 3 actively enrolled students with null status.');
      results['TC5.1'] = 'PASS';
    } else {
      console.error('❌ TC5.1 FAIL:', res5_1.status, res5_1.data);
      results['TC5.1'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.2: Teacher marks Student A = Present, Student B = Late, Student C = Absent. Save -> success.
    // ----------------------------------------------------
    const res5_2 = await req(`/sessions/${sessionA1._id}/attendance`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        records: [
          { studentId: studentDocA._id, status: 'Present', note: 'Đúng giờ' },
          { studentId: studentDocB._id, status: 'Late', note: 'Đi muộn 10 phút' },
          { studentId: studentDocC._id, status: 'Absent', note: 'Nghỉ không phép' }
        ]
      }
    });

    if (res5_2.status === 200 && res5_2.data?.success === true) {
      console.log('✅ TC5.2 PASS: Teacher A marks A=Present, B=Late, C=Absent. Bulk upsert succeeded.');
      results['TC5.2'] = 'PASS';
    } else {
      console.error('❌ TC5.2 FAIL:', res5_2.status, res5_2.data);
      results['TC5.2'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.3: Save same session again -> records updated, no duplicates.
    // ----------------------------------------------------
    const res5_3 = await req(`/sessions/${sessionA1._id}/attendance`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        records: [
          { studentId: studentDocA._id, status: 'Present', note: 'Cập nhật ghi chú mới' },
          { studentId: studentDocB._id, status: 'Present', note: 'Sửa thành Có mặt' },
          { studentId: studentDocC._id, status: 'Excused', note: 'Có phép bổ sung' }
        ]
      }
    });

    const totalInDbAfterResave = await Attendance.countDocuments({ session: sessionA1._id });

    if (res5_3.status === 200 && totalInDbAfterResave === 3) {
      console.log('✅ TC5.3 PASS: Re-saving attendance on same session updated records without creating duplicates.');
      results['TC5.3'] = 'PASS';
    } else {
      console.error('❌ TC5.3 FAIL:', res5_3.status, totalInDbAfterResave, res5_3.data);
      results['TC5.3'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.4: Check MongoDB: only one Attendance record for each student + session (and compound unique index).
    // ----------------------------------------------------
    const recordsPerStudent = await Promise.all([
      Attendance.countDocuments({ student: studentDocA._id, session: sessionA1._id }),
      Attendance.countDocuments({ student: studentDocB._id, session: sessionA1._id }),
      Attendance.countDocuments({ student: studentDocC._id, session: sessionA1._id })
    ]);

    // Check duplicate key error on direct insert
    let duplicateRejected = false;
    try {
      await Attendance.create({
        student: studentDocA._id,
        class: testClassA._id,
        session: sessionA1._id,
        status: 'Absent',
        markedBy: teacherUserA._id
      });
    } catch (err) {
      if (err.code === 11000) {
        duplicateRejected = true;
      }
    }

    if (recordsPerStudent.every(c => c === 1) && duplicateRejected) {
      console.log('✅ TC5.4 PASS: Verified strictly 1 record per student+session. Database compound unique index rejected duplicate insert (E11000).');
      results['TC5.4'] = 'PASS';
    } else {
      console.error('❌ TC5.4 FAIL:', recordsPerStudent, duplicateRejected);
      results['TC5.4'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.5: Teacher A attempts to mark Teacher B session -> 403 Forbidden.
    // ----------------------------------------------------
    const res5_5 = await req(`/sessions/${sessionB1._id}/attendance`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        records: [
          { studentId: studentDocB._id, status: 'Present', note: '' }
        ]
      }
    });

    if (res5_5.status === 403) {
      console.log('✅ TC5.5 PASS: Teacher A cannot mark attendance for Teacher B session (403 Forbidden).');
      results['TC5.5'] = 'PASS';
    } else {
      console.error('❌ TC5.5 FAIL:', res5_5.status, res5_5.data);
      results['TC5.5'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.6: Receptionist GET attendance -> success.
    // ----------------------------------------------------
    const res5_6 = await req(`/sessions/${sessionA1._id}/attendance`, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });

    if (res5_6.status === 200 && res5_6.data?.data?.records?.length === 3) {
      console.log('✅ TC5.6 PASS: Receptionist successfully retrieved session attendance roster (read access).');
      results['TC5.6'] = 'PASS';
    } else {
      console.error('❌ TC5.6 FAIL:', res5_6.status, res5_6.data);
      results['TC5.6'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.7: Receptionist PUT attendance -> 403 Forbidden.
    // ----------------------------------------------------
    const res5_7 = await req(`/sessions/${sessionA1._id}/attendance`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${recepToken}` },
      body: {
        records: [
          { studentId: studentDocA._id, status: 'Present' }
        ]
      }
    });

    if (res5_7.status === 403) {
      console.log('✅ TC5.7 PASS: Receptionist write access to attendance correctly rejected with 403 Forbidden.');
      results['TC5.7'] = 'PASS';
    } else {
      console.error('❌ TC5.7 FAIL:', res5_7.status, res5_7.data);
      results['TC5.7'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.8: Student attempts attendance write API -> 403 Forbidden.
    // ----------------------------------------------------
    const res5_8 = await req(`/sessions/${sessionA1._id}/attendance`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentAToken}` },
      body: {
        records: [
          { studentId: studentDocA._id, status: 'Present' }
        ]
      }
    });

    if (res5_8.status === 403) {
      console.log('✅ TC5.8 PASS: Student write access to attendance correctly rejected with 403 Forbidden.');
      results['TC5.8'] = 'PASS';
    } else {
      console.error('❌ TC5.8 FAIL:', res5_8.status, res5_8.data);
      results['TC5.8'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.9: Submit student not actively enrolled in class -> rejected (422).
    // ----------------------------------------------------
    const res5_9 = await req(`/sessions/${sessionA1._id}/attendance`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        records: [
          { studentId: studentDocOutsider._id, status: 'Present', note: 'Not in class' }
        ]
      }
    });

    if (res5_9.status === 422 || res5_9.status === 400) {
      console.log('✅ TC5.9 PASS: Submitting attendance for student not enrolled in class rejected with', res5_9.status);
      results['TC5.9'] = 'PASS';
    } else {
      console.error('❌ TC5.9 FAIL:', res5_9.status, res5_9.data);
      results['TC5.9'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.10: Attempt attendance on cancelled session -> 409 Conflict.
    // ----------------------------------------------------
    const res5_10 = await req(`/sessions/${sessionA2_cancelled._id}/attendance`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: {
        records: [
          { studentId: studentDocA._id, status: 'Present' }
        ]
      }
    });

    if (res5_10.status === 409) {
      console.log('✅ TC5.10 PASS: Attempting to mark attendance on cancelled session rejected with 409 Conflict.');
      results['TC5.10'] = 'PASS';
    } else {
      console.error('❌ TC5.10 FAIL:', res5_10.status, res5_10.data);
      results['TC5.10'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.11: Student A GET /api/student/me/attendance -> sees only Student A history.
    // ----------------------------------------------------
    const res5_11 = await req('/student/me/attendance', {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });

    const stuARecords = res5_11.data?.data?.records || [];
    const stuASummary = res5_11.data?.data?.summary;
    const allBelongToA = stuARecords.length > 0 && stuARecords.every(r => r.classCode === testClassA.classCode);

    if (res5_11.status === 200 && allBelongToA && stuASummary && stuASummary.attendanceRate === 100) {
      console.log(`✅ TC5.11 PASS: Student A retrieved self attendance history: ${stuARecords.length} records, rate ${stuASummary.attendanceRate}%.`);
      results['TC5.11'] = 'PASS';
    } else {
      console.error('❌ TC5.11 FAIL:', res5_11.status, res5_11.data);
      results['TC5.11'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.12: Student B cannot access Student A attendance.
    // ----------------------------------------------------
    const res5_12 = await req('/student/me/attendance', {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });

    const stuBRecords = res5_12.data?.data?.records || [];
    const stuBSummary = res5_12.data?.data?.summary;
    // In TC5.3, Student B status was saved as 'Present', so Student B summary has Student B's own records
    const isStudentBOwnData = res5_12.status === 200 && res5_12.data?.data?.student?._id === studentDocB._id.toString();

    // Also verify Student B cannot access /api/students/:studentAId/attendance (should return 403 since not staff)
    const res5_12_direct = await req(`/students/${studentDocA._id}/attendance`, {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });

    if (isStudentBOwnData && res5_12_direct.status === 403) {
      console.log('✅ TC5.12 PASS: Student B only receives own history; direct request to other student attendance returns 403 Forbidden.');
      results['TC5.12'] = 'PASS';
    } else {
      console.error('❌ TC5.12 FAIL:', res5_12.status, res5_12_direct.status, res5_12.data);
      results['TC5.12'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.13: Existing attendance loads correctly into API roster.
    // ----------------------------------------------------
    const res5_13 = await req(`/sessions/${sessionA1._id}/attendance`, {
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });

    const roster5_13 = res5_13.data?.data?.records || [];
    const studentCInRoster = roster5_13.find(r => r.studentId === studentDocC._id.toString());
    const studentBInRoster = roster5_13.find(r => r.studentId === studentDocB._id.toString());

    if (studentCInRoster?.status === 'Excused' && studentBInRoster?.status === 'Present') {
      console.log('✅ TC5.13 PASS: Existing attendance records loaded accurately without resetting to null or Present.');
      results['TC5.13'] = 'PASS';
    } else {
      console.error('❌ TC5.13 FAIL:', roster5_13);
      results['TC5.13'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.14: Admin can also view and edit attendance
    // ----------------------------------------------------
    const res5_14 = await req(`/sessions/${sessionA1._id}/attendance`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        records: [
          { studentId: studentDocA._id, status: 'Present', note: 'Admin verified' },
          { studentId: studentDocB._id, status: 'Late', note: 'Admin updated' },
          { studentId: studentDocC._id, status: 'Absent', note: 'Admin marked absent' }
        ]
      }
    });

    if (res5_14.status === 200 && res5_14.data?.success === true) {
      console.log('✅ TC5.14 PASS: Admin successfully executed bulk attendance update.');
      results['TC5.14'] = 'PASS';
    } else {
      console.error('❌ TC5.14 FAIL:', res5_14.status, res5_14.data);
      results['TC5.14'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TC5.15: Student Detail Attendance Tab Endpoint /api/students/:id/attendance
    // ----------------------------------------------------
    const res5_15 = await req(`/students/${studentDocA._id}/attendance`, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });

    if (res5_15.status === 200 && res5_15.data?.data?.summary) {
      console.log('✅ TC5.15 PASS: GET /api/students/:id/attendance returns valid summary and history for staff.');
      results['TC5.15'] = 'PASS';
    } else {
      console.error('❌ TC5.15 FAIL:', res5_15.status, res5_15.data);
      results['TC5.15'] = 'FAIL';
    }

    console.log('\n==================================================');
    console.log('SUMMARY OF PHASE 5 TEST RESULTS:');
    console.log('==================================================');
    console.table(results);

  } catch (error) {
    console.error('Exception during test run:', error);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
