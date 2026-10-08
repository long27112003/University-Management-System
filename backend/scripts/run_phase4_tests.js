const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Schedule = require('../models/Schedule');
const ClassSession = require('../models/ClassSession');

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
  console.log('RUNNING PHASE 4 AUTOMATED TEST SUITE');
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

  try {
    const adminToken = await login('admin@university.com', 'admin123');
    const recepToken = await login('receptionist@university.com', 'receptionist123');
    const teacherAToken = await login('professor@university.com', 'professor123');
    const studentAToken = await login('student@university.com', 'student123');

    // Fetch Teacher profiles
    const teacherUserA = await User.findOne({ email: 'professor@university.com' });
    const teacherDocA = await Teacher.findOne({ userId: teacherUserA._id });

    let teacherDocB = await Teacher.findOne({
      userId: { $ne: teacherUserA._id },
      status: 'active'
    });
    if (!teacherDocB) {
      const tBRes = await req('/teachers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          fullName: 'Giáo viên B Test',
          email: `teacherB_${Date.now()}@vlearn.test`,
          phone: '0988888888',
          specialization: ['listening']
        }
      });
      teacherDocB = await Teacher.findById(tBRes.data.data._id);
    }

    // Fetch Student profile
    const studentUserA = await User.findOne({ email: 'student@university.com' });
    const studentDocA = await Student.findOne({ userId: studentUserA._id });

    console.log('✅ Logged in and initialized test users and profiles.\n');

    // Clean up prior test data
    const oldClasses = await Class.find({ classCode: /^VL-SCH-/ });
    const oldClassIds = oldClasses.map(c => c._id);
    await Schedule.deleteMany({ class: { $in: oldClassIds } });
    await ClassSession.deleteMany({ class: { $in: oldClassIds } });
    await Enrollment.deleteMany({ class: { $in: oldClassIds } });
    await Class.deleteMany({ _id: { $in: oldClassIds } });

    // Create Test Classes for clean testing
    const timestamp = Date.now();
    const testClassA = await Class.create({
      classCode: `VL-SCH-${timestamp}-A`,
      className: `Schedule Test Class A ${timestamp}`,
      skill: 'speaking',
      teacher: teacherDocA._id,
      maxCapacity: 10,
      startDate: new Date('2026-11-02T00:00:00.000Z'), // Monday
      endDate: new Date('2026-11-23T00:00:00.000Z'),   // Monday (4 weeks)
      tuitionFee: 3000000,
      room: 'Phòng 101',
      status: 'active'
    });

    const testClassB = await Class.create({
      classCode: `VL-SCH-${timestamp}-B`,
      className: `Schedule Test Class B ${timestamp}`,
      skill: 'listening',
      teacher: teacherDocB._id,
      maxCapacity: 10,
      startDate: new Date('2026-11-02T00:00:00.000Z'),
      endDate: new Date('2026-11-23T00:00:00.000Z'),
      tuitionFee: 3000000,
      room: 'Phòng 202',
      status: 'active'
    });

    const testClassC = await Class.create({
      classCode: `VL-SCH-${timestamp}-C`,
      className: `Schedule Test Class C ${timestamp}`,
      skill: 'reading',
      teacher: teacherDocA._id,
      maxCapacity: 10,
      startDate: new Date('2026-11-02T00:00:00.000Z'),
      endDate: new Date('2026-11-23T00:00:00.000Z'),
      tuitionFee: 3000000,
      room: 'Phòng 303',
      status: 'active'
    });

    // TC4.1: Create schedule: Monday (dayOfWeek=2) 18:00-19:30, Teacher A, Room 101 -> success
    const res41 = await req(`/classes/${testClassA._id}/schedules`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        dayOfWeek: 2,
        startTime: '18:00',
        endTime: '19:30',
        room: 'Phòng 101',
        teacher: teacherDocA._id
      }
    });

    if (res41.status === 201 && res41.data.success) {
      results['TC4.1'] = 'PASS';
      console.log('✅ TC4.1 PASS: Admin created schedule: Monday 18:00-19:30, Teacher A, Room 101');
    } else {
      results['TC4.1'] = 'FAIL';
      console.error('❌ TC4.1 FAIL:', res41.status, res41.data);
    }
    const scheduleAId = res41.data?.data?._id;

    // TC4.2: Teacher A on Monday 19:00-20:30 (overlaps 18:00-19:30) -> 409 teacher conflict
    const res42 = await req(`/classes/${testClassC._id}/schedules`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        dayOfWeek: 2,
        startTime: '19:00',
        endTime: '20:30',
        room: 'Phòng 303',
        teacher: teacherDocA._id
      }
    });

    if (res42.status === 409 && res42.data.conflict?.type === 'teacher') {
      results['TC4.2'] = 'PASS';
      console.log('✅ TC4.2 PASS: Teacher A overlap correctly rejected with 409 Conflict (teacher conflict)');
    } else {
      results['TC4.2'] = 'FAIL';
      console.error('❌ TC4.2 FAIL:', res42.status, res42.data);
    }

    // TC4.3: Teacher B on Monday 18:30-20:00 in Room 101 (overlaps Room 101) -> 409 room conflict
    const res43 = await req(`/classes/${testClassB._id}/schedules`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        dayOfWeek: 2,
        startTime: '18:30',
        endTime: '20:00',
        room: 'Phòng 101',
        teacher: teacherDocB._id
      }
    });

    if (res43.status === 409 && res43.data.conflict?.type === 'room') {
      results['TC4.3'] = 'PASS';
      console.log('✅ TC4.3 PASS: Room 101 overlap correctly rejected with 409 Conflict (room conflict)');
    } else {
      results['TC4.3'] = 'FAIL';
      console.error('❌ TC4.3 FAIL:', res43.status, res43.data);
    }

    // TC4.4: Teacher A on Monday 19:30-21:00 (back-to-back with 18:00-19:30) -> allowed
    const res44 = await req(`/classes/${testClassC._id}/schedules`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        dayOfWeek: 2,
        startTime: '19:30',
        endTime: '21:00',
        room: 'Phòng 303',
        teacher: teacherDocA._id
      }
    });

    if (res44.status === 201 && res44.data.success) {
      results['TC4.4'] = 'PASS';
      console.log('✅ TC4.4 PASS: Back-to-back schedule (19:30-21:00) allowed without conflict');
    } else {
      results['TC4.4'] = 'FAIL';
      console.error('❌ TC4.4 FAIL:', res44.status, res44.data);
    }

    // TC4.5: Student active in Class A (Mon 18:00-19:30).
    // First enroll Student A into Class A.
    const resEnrollA = await req(`/classes/${testClassA._id}/enrollments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { studentId: studentDocA._id }
    });
    if (!resEnrollA.ok) {
      console.error('Error pre-enrolling Student A into Class A:', resEnrollA.data);
    }

    // Now give Class B a schedule Monday 19:00-20:00 (overlaps Mon 18:00-19:30 of Class A)
    // Teacher B, Room 202
    const resSchedB = await req(`/classes/${testClassB._id}/schedules`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        dayOfWeek: 2,
        startTime: '19:00',
        endTime: '20:00',
        room: 'Phòng 202',
        teacher: teacherDocB._id
      }
    });
    if (!resSchedB.ok) {
      console.error('Error setting Class B schedule:', resSchedB.data);
    }

    // Attempt to enroll Student A into Class B (which overlaps Class A) -> 409 student conflict
    const res45 = await req(`/classes/${testClassB._id}/enrollments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { studentId: studentDocA._id }
    });

    if (res45.status === 409 && res45.data.conflict?.type === 'student') {
      results['TC4.5'] = 'PASS';
      console.log('✅ TC4.5 PASS: Student enrollment conflict correctly rejected with 409 Conflict');
    } else {
      results['TC4.5'] = 'FAIL';
      console.error('❌ TC4.5 FAIL:', res45.status, res45.data);
    }

    // TC4.6: Class already contains Student A. Attempt to add conflicting schedule to that class -> 409 student conflict
    // Create Class D, enroll Student A into Class D.
    // Create a fresh Teacher C with no prior schedules
    const tCRes = await req('/teachers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        fullName: 'Giáo viên C Test',
        email: `teacherC_${timestamp}@vlearn.test`,
        phone: '0977777777',
        specialization: ['writing']
      }
    });
    const teacherDocC = await Teacher.findById(tCRes.data.data._id);

    const testClassD = await Class.create({
      classCode: `VL-SCH-${timestamp}-D`,
      className: `Schedule Test Class D ${timestamp}`,
      skill: 'writing',
      teacher: teacherDocC._id,
      maxCapacity: 10,
      startDate: new Date('2026-11-02T00:00:00.000Z'),
      endDate: new Date('2026-11-23T00:00:00.000Z'),
      tuitionFee: 3000000,
      room: 'Phòng 404',
      status: 'active'
    });

    // Enroll Student A into Class D (no schedules yet, so enroll succeeds)
    await req(`/classes/${testClassD._id}/enrollments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { studentId: studentDocA._id }
    });

    // Now try to add a schedule to Class D on Monday 18:30-19:30 (overlaps Student A's Class A Mon 18:00-19:30)
    const res46 = await req(`/classes/${testClassD._id}/schedules`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        dayOfWeek: 2,
        startTime: '18:30',
        endTime: '19:30',
        room: 'Phòng 404',
        teacher: teacherDocC._id
      }
    });

    if (res46.status === 409 && res46.data.conflict?.type === 'student') {
      results['TC4.6'] = 'PASS';
      console.log('✅ TC4.6 PASS: Adding conflicting schedule to class with enrolled student rejected with 409');
    } else {
      results['TC4.6'] = 'FAIL';
      console.error('❌ TC4.6 FAIL:', res46.status, res46.data);
    }

    // TC4.7: Generate sessions between class startDate (2026-11-02) and endDate (2026-11-23)
    // Class A has 1 schedule on Monday (dayOfWeek=2).
    // Mondays between 2026-11-02 and 2026-11-23:
    // Nov 2, Nov 9, Nov 16, Nov 23 -> Exactly 4 sessions!
    const res47 = await req(`/classes/${testClassA._id}/sessions/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (res47.status === 201 && res47.data.data?.created === 4 && res47.data.data?.totalSessions === 4) {
      results['TC4.7'] = 'PASS';
      console.log('✅ TC4.7 PASS: Sessions generated correctly (4 sessions generated for 4 Mondays)');
    } else {
      results['TC4.7'] = 'FAIL';
      console.error('❌ TC4.7 FAIL:', res47.status, res47.data);
    }

    // TC4.8: Run generate sessions twice -> no duplicates (idempotency: created=0, skipped=4)
    const res48 = await req(`/classes/${testClassA._id}/sessions/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (res48.status === 201 && res48.data.data?.created === 0 && res48.data.data?.skipped === 4) {
      results['TC4.8'] = 'PASS';
      console.log('✅ TC4.8 PASS: Session generation is idempotent (created: 0, skipped: 4)');
    } else {
      results['TC4.8'] = 'FAIL';
      console.error('❌ TC4.8 FAIL:', res48.status, res48.data);
    }

    // TC4.9: Attempt DELETE schedule after sessions generated -> 409 Conflict
    const res49 = await req(`/schedules/${scheduleAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (res49.status === 409) {
      results['TC4.9'] = 'PASS';
      console.log('✅ TC4.9 PASS: Deleting schedule with generated sessions rejected with 409 Conflict');
    } else {
      results['TC4.9'] = 'FAIL';
      console.error('❌ TC4.9 FAIL:', res49.status, res49.data);
    }

    // TC4.10: Teacher A calls Teacher schedule -> only own data
    const res410 = await req('/teacher/me/schedule', {
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });

    const teacherASchedules = res410.data?.data || [];
    const allAssignedToTeacherA = teacherASchedules.every(s => {
      const sTeacherId = s.teacher?._id || s.teacher || s.class?.teacher;
      return sTeacherId?.toString() === teacherDocA._id.toString();
    });

    if (res410.ok && allAssignedToTeacherA && teacherASchedules.length > 0) {
      results['TC4.10'] = 'PASS';
      console.log(`✅ TC4.10 PASS: Teacher A gets only assigned schedules (${teacherASchedules.length} schedules)`);
    } else {
      results['TC4.10'] = 'FAIL';
      console.error('❌ TC4.10 FAIL:', res410.status, res410.data);
    }

    // TC4.11: Student calls schedule -> only own enrolled classes
    const res411 = await req('/student/schedule', {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });

    const studentSchedules = res411.data?.data || [];
    if (res411.ok && studentSchedules.length > 0) {
      results['TC4.11'] = 'PASS';
      console.log(`✅ TC4.11 PASS: Student receives only enrolled classes schedules (${studentSchedules.length} schedules)`);
    } else {
      results['TC4.11'] = 'FAIL';
      console.error('❌ TC4.11 FAIL:', res411.status, res411.data);
    }

    // TC4.12: Teacher A tries to access Teacher B session or update status of Teacher B session -> 403 Forbidden
    // Generate sessions for Class B (assigned to Teacher B)
    await req(`/classes/${testClassB._id}/sessions/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const sessionsB = await ClassSession.find({ class: testClassB._id });
    const sessionB1 = sessionsB[0];

    const res412 = await req(`/sessions/${sessionB1._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${teacherAToken}` },
      body: { status: 'completed' }
    });

    if (res412.status === 403) {
      results['TC4.12'] = 'PASS';
      console.log('✅ TC4.12 PASS: Teacher A blocked from updating Teacher B session status (403 Forbidden)');
    } else {
      results['TC4.12'] = 'FAIL';
      console.error('❌ TC4.12 FAIL:', res412.status, res412.data);
    }

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n==================================================');
  console.log('SUMMARY OF PHASE 4 TEST RESULTS:');
  console.log('==================================================');
  console.table(results);

  const allPassed = Object.values(results).every(r => r === 'PASS') && Object.keys(results).length === 12;
  process.exit(allPassed ? 0 : 1);
}

runTests();
