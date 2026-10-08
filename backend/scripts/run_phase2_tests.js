const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

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
  console.log('RUNNING PHASE 2 AUTOMATED TEST SUITE');
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

  let adminToken, receptionistToken, teacherToken, studentToken;
  try {
    adminToken = await login('admin@university.com', 'admin123');
    receptionistToken = await login('receptionist@university.com', 'receptionist123');
    teacherToken = await login('professor@university.com', 'professor123');
    studentToken = await login('student@university.com', 'student123');
    console.log('✅ Logged in all 4 roles successfully.\n');
  } catch (err) {
    console.error('❌ Failed initial login setup:', err.message);
    process.exit(1);
  }

  // TC2.1: Create Student → User + Student both created
  try {
    const timestamp = Date.now();
    const studentEmail = `test.student.${timestamp}@vlearn.test`;
    const res = await req('/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        fullName: 'Nguyễn Văn Test',
        email: studentEmail,
        phone: '0901234567',
        academicStatus: 'active'
      }
    });

    const userDoc = await User.findOne({ email: studentEmail });
    const studentDoc = await Student.findOne({ email: studentEmail });

    if (res.status === 201 && userDoc && studentDoc && studentDoc.userId.equals(userDoc._id) && studentDoc.studentCode.startsWith('VL-HV')) {
      results['TC2.1'] = 'PASS';
      console.log('✅ TC2.1 PASS: Create Student creates both User and Student profile with code:', studentDoc.studentCode);
    } else {
      results['TC2.1'] = `FAIL: User=${Boolean(userDoc)}, Student=${Boolean(studentDoc)}`;
      console.error('❌ TC2.1 FAIL');
    }
  } catch (err) {
    results['TC2.1'] = `FAIL: ${err.message}`;
    console.error('❌ TC2.1 FAIL:', err.message);
  }

  // TC2.2: Force Student profile creation failure → User must rollback
  try {
    const timestamp = Date.now();
    const failEmail = `test.fail.${timestamp}@vlearn.test`;
    const res = await req('/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        fullName: 'Rollback Student Test',
        email: failEmail,
        phone: '0909999999',
        _simulateFailure: true
      }
    });

    const orphanedUser = await User.findOne({ email: failEmail });
    if (!res.ok && !orphanedUser) {
      results['TC2.2'] = 'PASS';
      console.log('✅ TC2.2 PASS: Forced failure successfully rolled back User account (no orphan).');
    } else {
      results['TC2.2'] = `FAIL: Orphaned User found: ${Boolean(orphanedUser)}`;
      console.error('❌ TC2.2 FAIL');
    }
  } catch (err) {
    results['TC2.2'] = `FAIL: ${err.message}`;
    console.error('❌ TC2.2 FAIL:', err.message);
  }

  // TC2.3: Create Teacher → User + Teacher both created
  try {
    const timestamp = Date.now();
    const teacherEmail = `test.teacher.${timestamp}@vlearn.test`;
    const res = await req('/teachers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        fullName: 'Trần Thị Teacher',
        email: teacherEmail,
        phone: '0987654321',
        specialization: ['ielts', 'writing']
      }
    });

    const userDoc = await User.findOne({ email: teacherEmail });
    const teacherDoc = await Teacher.findOne({ email: teacherEmail });

    if (res.status === 201 && userDoc && teacherDoc && teacherDoc.userId.equals(userDoc._id) && teacherDoc.teacherCode.startsWith('VL-GV')) {
      results['TC2.3'] = 'PASS';
      console.log('✅ TC2.3 PASS: Create Teacher creates both User and Teacher profile with code:', teacherDoc.teacherCode);
    } else {
      results['TC2.3'] = 'FAIL: User or Teacher doc missing';
      console.error('❌ TC2.3 FAIL');
    }
  } catch (err) {
    results['TC2.3'] = `FAIL: ${err.message}`;
    console.error('❌ TC2.3 FAIL:', err.message);
  }

  // TC2.4: Duplicate email → rejected (409)
  try {
    const res = await req('/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        fullName: 'Duplicate Email Test',
        email: 'admin@university.com',
        phone: '0912345678'
      }
    });

    if (res.status === 409) {
      results['TC2.4'] = 'PASS';
      console.log('✅ TC2.4 PASS: Duplicate email properly rejected with 409 Conflict.');
    } else {
      results['TC2.4'] = `FAIL: Status was ${res.status}`;
      console.error('❌ TC2.4 FAIL');
    }
  } catch (err) {
    results['TC2.4'] = `FAIL: ${err.message}`;
    console.error('❌ TC2.4 FAIL:', err.message);
  }

  // TC2.5: Update Student email → User + derived Student email stay synchronized
  try {
    const timestamp = Date.now();
    const initialEmail = `sync.init.${timestamp}@vlearn.test`;
    const updatedEmail = `sync.updated.${timestamp}@vlearn.test`;

    const createRes = await req('/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        fullName: 'Sync Email Student',
        email: initialEmail,
        phone: '0933333333'
      }
    });

    const studentId = createRes.data.data._id;

    // Update email
    await req(`/students/${studentId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        email: updatedEmail,
        fullName: 'Sync Email Student Updated'
      }
    });

    const studentDoc = await Student.findById(studentId);
    const userDoc = await User.findById(studentDoc.userId);

    if (studentDoc.email === updatedEmail && userDoc.email === updatedEmail) {
      results['TC2.5'] = 'PASS';
      console.log('✅ TC2.5 PASS: Email update synchronized across User and Student models.');
    } else {
      results['TC2.5'] = `FAIL: Mismatch student.email=${studentDoc?.email}, user.email=${userDoc?.email}`;
      console.error('❌ TC2.5 FAIL');
    }
  } catch (err) {
    results['TC2.5'] = `FAIL: ${err.message}`;
    console.error('❌ TC2.5 FAIL:', err.message);
  }

  // TC2.6: Receptionist creates Student → success
  try {
    const timestamp = Date.now();
    const recStudentEmail = `rec.student.${timestamp}@vlearn.test`;
    const res = await req('/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: {
        fullName: 'Receptionist Created Student',
        email: recStudentEmail,
        phone: '0944444444'
      }
    });

    if (res.status === 201 && res.data.success) {
      results['TC2.6'] = 'PASS';
      console.log('✅ TC2.6 PASS: Receptionist successfully created a Student.');
    } else {
      results['TC2.6'] = `FAIL: status=${res.status}`;
      console.error('❌ TC2.6 FAIL');
    }
  } catch (err) {
    results['TC2.6'] = `FAIL: ${err.message}`;
    console.error('❌ TC2.6 FAIL:', err.message);
  }

  // TC2.7: Receptionist tries to create Teacher → forbidden (403)
  try {
    const res = await req('/teachers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: {
        fullName: 'Receptionist Fake Teacher',
        email: 'rec.fake.teacher@vlearn.test',
        phone: '0955555555'
      }
    });

    if (res.status === 403) {
      results['TC2.7'] = 'PASS';
      console.log('✅ TC2.7 PASS: Receptionist blocked from creating Teacher (403 Forbidden).');
    } else {
      results['TC2.7'] = `FAIL: status=${res.status}`;
      console.error('❌ TC2.7 FAIL');
    }
  } catch (err) {
    results['TC2.7'] = `FAIL: ${err.message}`;
    console.error('❌ TC2.7 FAIL:', err.message);
  }

  // TC2.8: Receptionist accesses /api/accounts → 403
  try {
    const res = await req('/accounts', {
      method: 'GET',
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });

    if (res.status === 403) {
      results['TC2.8'] = 'PASS';
      console.log('✅ TC2.8 PASS: Receptionist blocked from /api/accounts (403 Forbidden).');
    } else {
      results['TC2.8'] = `FAIL: status=${res.status}`;
      console.error('❌ TC2.8 FAIL');
    }
  } catch (err) {
    results['TC2.8'] = `FAIL: ${err.message}`;
    console.error('❌ TC2.8 FAIL:', err.message);
  }

  // TC2.9: Student calls GET /api/students → 403
  try {
    const res = await req('/students', {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    if (res.status === 403) {
      results['TC2.9'] = 'PASS';
      console.log('✅ TC2.9 PASS: Student blocked from GET /api/students (403 Forbidden).');
    } else {
      results['TC2.9'] = `FAIL: status=${res.status}`;
      console.error('❌ TC2.9 FAIL');
    }
  } catch (err) {
    results['TC2.9'] = `FAIL: ${err.message}`;
    console.error('❌ TC2.9 FAIL:', err.message);
  }

  // TC2.10: Inactive User attempts login → 401
  try {
    const timestamp = Date.now();
    const inactiveEmail = `inactive.${timestamp}@vlearn.test`;
    // Create student
    const createRes = await req('/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        fullName: 'Inactive Student',
        email: inactiveEmail,
        phone: '0966666666'
      }
    });
    const userId = createRes.data.data.account._id;

    // Deactivate user via account API
    await req(`/accounts/${userId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'inactive' }
    });

    const loginRes = await req('/auth/login', {
      method: 'POST',
      body: {
        email: inactiveEmail,
        password: 'student123'
      }
    });

    if (loginRes.status === 401) {
      results['TC2.10'] = 'PASS';
      console.log('✅ TC2.10 PASS: Inactive user login rejected with 401 Unauthorized.');
    } else {
      results['TC2.10'] = `FAIL: status=${loginRes.status}`;
      console.error('❌ TC2.10 FAIL');
    }
  } catch (err) {
    results['TC2.10'] = `FAIL: ${err.message}`;
    console.error('❌ TC2.10 FAIL:', err.message);
  }

  console.log('\n==================================================');
  console.log('SUMMARY OF TEST RESULTS:');
  console.log('==================================================');
  console.table(results);

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
