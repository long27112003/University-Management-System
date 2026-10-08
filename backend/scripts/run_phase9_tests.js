const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';

// Models
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Notice = require('../models/Notice');
const StudyMaterial = require('../models/StudyMaterial');

let adminToken = '';
let receptionistToken = '';
let teacherToken = '';
let teacher2Token = '';
let studentToken = '';
let student2Token = '';

let teacher1Doc = null;
let teacher2Doc = null;
let teacher2User = null;
let student1Doc = null;
let student2Doc = null;
let student2User = null;

let class1 = null;
let class2 = null;

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = { ...(options.headers || {}) };

  // Set Content-Type only if not FormData
  if (!(options.body instanceof FormData) && typeof options.body === 'object') {
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
  if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  return res.data.token;
}

async function runTests() {
  console.log('==================================================');
  console.log('STARTING PHASE 9 TEST SUITE: UTILITY MODULE MIGRATION');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB.\n');

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

  const createdNoticeIds = [];
  const createdMaterialIds = [];

  try {
    // 0. Setup authentication tokens
    console.log('[Setup] Acquiring tokens for all roles...');
    adminToken = await login('admin@university.com', 'admin123');
    receptionistToken = await login('receptionist@university.com', 'receptionist123');
    teacherToken = await login('professor@university.com', 'professor123');
    studentToken = await login('student@university.com', 'student123');

    const teacher1User = await User.findOne({ email: 'professor@university.com' });
    teacher1Doc = await Teacher.findOne({ userId: teacher1User._id });

    const student1User = await User.findOne({ email: 'student@university.com' });
    student1Doc = await Student.findOne({ userId: student1User._id });

    // Find or create Teacher 2 (for isolation testing)
    teacher2Doc = await Teacher.findOne({ _id: { $ne: teacher1Doc._id }, status: 'active' });
    if (!teacher2Doc) {
      const bcrypt = require('bcrypt');
      const email2 = `t2_p9_${Date.now()}@vlearn.edu.vn`;
      teacher2User = await User.create({
        name: 'Teacher 2 P9',
        email: email2,
        password: await bcrypt.hash('password123', 10),
        role: 'Teacher',
        status: 'active',
      });
      teacher2Doc = await Teacher.create({
        userId: teacher2User._id,
        teacherCode: `GV9_${Date.now().toString().slice(-4)}`,
        fullName: 'Teacher 2 P9',
        email: email2,
        phone: '0901234999',
        specialization: ['ielts'],
        status: 'active',
      });
      teacher2Token = await login(email2, 'password123');
    } else {
      teacher2User = await User.findById(teacher2Doc.userId);
      // set password to known password if needed or use existing
      const bcrypt = require('bcrypt');
      teacher2User.password = await bcrypt.hash('password123', 10);
      await teacher2User.save();
      teacher2Token = await login(teacher2User.email, 'password123');
    }

    // Find or create Student 2 (not enrolled in Class 1)
    student2Doc = await Student.findOne({ _id: { $ne: student1Doc._id }, academicStatus: 'active' });
    if (!student2Doc) {
      const bcrypt = require('bcrypt');
      const semail2 = `s2_p9_${Date.now()}@vlearn.edu.vn`;
      student2User = await User.create({
        name: 'Student 2 P9',
        email: semail2,
        password: await bcrypt.hash('password123', 10),
        role: 'Student',
        status: 'active',
      });
      student2Doc = await Student.create({
        userId: student2User._id,
        studentCode: `HV9_${Date.now().toString().slice(-4)}`,
        fullName: 'Student 2 P9',
        email: semail2,
        phone: '0912345999',
        academicStatus: 'active',
      });
      student2Token = await login(semail2, 'password123');
    } else {
      student2User = await User.findById(student2Doc.userId);
      const bcrypt = require('bcrypt');
      student2User.password = await bcrypt.hash('password123', 10);
      await student2User.save();
      student2Token = await login(student2User.email, 'password123');
    }

    // Setup Class 1 (assigned to Teacher 1, Student 1 enrolled)
    class1 = await Class.findOne({ teacher: teacher1Doc._id, status: 'active' });
    if (!class1) {
      class1 = await Class.create({
        classCode: `CLS1_P9_${Date.now().toString().slice(-4)}`,
        className: 'Class 1 for Phase 9 Tests',
        skill: 'listening',
        level: '5.0-6.0',
        room: 'Room 201',
        teacher: teacher1Doc._id,
        maxCapacity: 20,
        tuitionFee: 3000000,
        totalSessions: 12,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-12-31'),
        status: 'active',
      });
    }

    // Ensure Student 1 is enrolled in Class 1
    let enroll1 = await Enrollment.findOne({ student: student1Doc._id, class: class1._id, status: 'active' });
    if (!enroll1) {
      enroll1 = await Enrollment.create({
        student: student1Doc._id,
        class: class1._id,
        status: 'active',
        enrolledAt: new Date(),
      });
    }

    // Setup Class 2 (assigned to Teacher 2, Student 2 enrolled, Student 1 NOT enrolled)
    class2 = await Class.findOne({ teacher: teacher2Doc._id, status: 'active' });
    if (!class2) {
      class2 = await Class.create({
        classCode: `CLS2_P9_${Date.now().toString().slice(-4)}`,
        className: 'Class 2 for Phase 9 Tests',
        skill: 'speaking',
        level: '5.0-6.0',
        room: 'Room 202',
        teacher: teacher2Doc._id,
        maxCapacity: 20,
        tuitionFee: 3000000,
        totalSessions: 12,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-12-31'),
        status: 'active',
      });
    }

    // Ensure Student 2 is enrolled in Class 2, but Student 1 is NOT enrolled in Class 2
    await Enrollment.deleteMany({ student: student1Doc._id, class: class2._id });
    let enroll2 = await Enrollment.findOne({ student: student2Doc._id, class: class2._id, status: 'active' });
    if (!enroll2) {
      enroll2 = await Enrollment.create({
        student: student2Doc._id,
        class: class2._id,
        status: 'active',
        enrolledAt: new Date(),
      });
    }

    console.log('✓ Test environment ready.\n');

    // ==================================================
    // TC9.1: Admin posts notice audience=student -> Student sees it
    // ==================================================
    console.log('[TC9.1] Admin posts notice audience=student -> Student sees it...');
    const noticeStudentRes = await request('/notices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'Lịch thi học kỳ dành cho Học Viên',
        content: 'Tất cả học viên chuẩn bị ôn thi tuần tới.',
        audience: 'student',
      },
    });
    assert(noticeStudentRes.status === 201, `Admin created student notice (201 Created)`);
    const studentNotice = noticeStudentRes.data;
    createdNoticeIds.push(studentNotice._id);

    const stuGetRes = await request('/notices', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(stuGetRes.status === 200, `Student fetched notices (200 OK)`);
    const stuSeesNotice = stuGetRes.data.some((n) => n._id.toString() === studentNotice._id.toString());
    assert(stuSeesNotice, `Student can see the student-only notice`);

    // ==================================================
    // TC9.2: Teacher logs in -> does NOT see student-only notice
    // ==================================================
    console.log('\n[TC9.2] Teacher logs in -> does NOT see student-only notice...');
    const teacherGetRes = await request('/notices', {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert(teacherGetRes.status === 200, `Teacher fetched notices (200 OK)`);
    const teacherSeesStudentNotice = teacherGetRes.data.some((n) => n._id.toString() === studentNotice._id.toString());
    assert(!teacherSeesStudentNotice, `Teacher cannot see student-only notice`);

    // ==================================================
    // TC9.3: Notice audience=all -> all 4 roles see it
    // ==================================================
    console.log('\n[TC9.3] Notice audience=all -> all 4 roles see it...');
    const noticeAllRes = await request('/notices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'Thông báo nghỉ lễ toàn trung tâm',
        content: 'Toàn thể giáo viên, nhân viên và học viên được nghỉ lễ.',
        audience: 'all',
      },
    });
    assert(noticeAllRes.status === 201, `Admin created all-audience notice`);
    const allNotice = noticeAllRes.data;
    createdNoticeIds.push(allNotice._id);

    const [adminNotices, recepNotices, tNotices, sNotices] = await Promise.all([
      request('/notices', { headers: { Authorization: `Bearer ${adminToken}` } }),
      request('/notices', { headers: { Authorization: `Bearer ${receptionistToken}` } }),
      request('/notices', { headers: { Authorization: `Bearer ${teacherToken}` } }),
      request('/notices', { headers: { Authorization: `Bearer ${studentToken}` } }),
    ]);

    assert(adminNotices.data.some((n) => n._id.toString() === allNotice._id.toString()), `Admin sees audience=all notice`);
    assert(recepNotices.data.some((n) => n._id.toString() === allNotice._id.toString()), `Receptionist sees audience=all notice`);
    assert(tNotices.data.some((n) => n._id.toString() === allNotice._id.toString()), `Teacher sees audience=all notice`);
    assert(sNotices.data.some((n) => n._id.toString() === allNotice._id.toString()), `Student sees audience=all notice`);

    // ==================================================
    // TC9.4: Receptionist creates notice -> success
    // ==================================================
    console.log('\n[TC9.4] Receptionist creates notice -> success...');
    const recepPostRes = await request('/notices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: {
        title: 'Nhắc nhở học viên đến đúng giờ',
        content: 'Học viên vui lòng có mặt trước 10 phút để điểm danh.',
        audience: 'student',
      },
    });
    assert(recepPostRes.status === 201, `Receptionist created notice (201 Created)`);
    if (recepPostRes.data) createdNoticeIds.push(recepPostRes.data._id);

    // ==================================================
    // TC9.5: Teacher attempts POST /api/notices -> 403
    // ==================================================
    console.log('\n[TC9.5] Teacher attempts POST /api/notices -> 403...');
    const teacherPostRes = await request('/notices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: {
        title: 'Thông báo trái phép từ giáo viên',
        content: 'Giáo viên không có quyền đăng bảng tin chung.',
        audience: 'all',
      },
    });
    assert(teacherPostRes.status === 403, `Teacher received 403 on POST /api/notices`);

    // ==================================================
    // TC9.6: Receptionist attempts DELETE notice -> 403
    // ==================================================
    console.log('\n[TC9.6] Receptionist attempts DELETE notice -> 403...');
    const recepDeleteRes = await request(`/notices/${allNotice._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${receptionistToken}` },
    });
    assert(recepDeleteRes.status === 403, `Receptionist received 403 on DELETE /api/notices/:id`);

    // ==================================================
    // TC9.7: Teacher uploads PDF to assigned class -> success
    // ==================================================
    console.log('\n[TC9.7] Teacher uploads PDF to assigned class -> success...');
    const samplePdfBuffer = Buffer.from('%PDF-1.4 Sample PDF content for testing');
    const pdfBlob = new Blob([samplePdfBuffer], { type: 'application/pdf' });
    const formDataPdf = new FormData();
    formDataPdf.append('title', 'Tài liệu ôn thi Listening K1');
    formDataPdf.append('description', 'Bài tập nghe tuần 1-4');
    formDataPdf.append('file', pdfBlob, 'listening_unit1.pdf');

    const teacherUploadRes = await request(`/classes/${class1._id}/materials`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: formDataPdf,
    });
    assert(teacherUploadRes.status === 201, `Teacher uploaded PDF (201 Created)`);
    const uploadedMaterial = teacherUploadRes.data;
    assert(uploadedMaterial && uploadedMaterial.fileUrl.endsWith('.pdf'), `Material fileUrl stored correctly: ${uploadedMaterial?.fileUrl}`);
    if (uploadedMaterial) createdMaterialIds.push(uploadedMaterial._id);

    // ==================================================
    // TC9.8: Teacher uploads to another Teacher's class -> 403
    // ==================================================
    console.log('\n[TC9.8] Teacher uploads to another Teacher\'s class -> 403...');
    const formDataT2 = new FormData();
    formDataT2.append('title', 'Trộm tải lên lớp khác');
    formDataT2.append('file', pdfBlob, 'hack.pdf');

    const teacherCrossUploadRes = await request(`/classes/${class2._id}/materials`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` }, // Teacher 1 attempting upload to Class 2
      body: formDataT2,
    });
    assert(teacherCrossUploadRes.status === 403, `Teacher received 403 uploading to other teacher's class`);

    // ==================================================
    // TC9.9: Student enrolled in class downloads material -> success
    // ==================================================
    console.log('\n[TC9.9] Student enrolled in class fetches material list -> success...');
    const studentMatRes = await request(`/classes/${class1._id}/materials`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentMatRes.status === 200, `Student fetched materials for Class 1 (200 OK)`);
    const studentHasMat = studentMatRes.data.some((m) => m._id.toString() === uploadedMaterial._id.toString());
    assert(studentHasMat, `Student enrolled sees the uploaded material`);

    // Verify file URL is accessible on static server
    const fileFetchRes = await fetch(`http://localhost:5000${uploadedMaterial.fileUrl}`);
    assert(fileFetchRes.status === 200, `Material file is downloadable via HTTP: ${uploadedMaterial.fileUrl}`);

    // ==================================================
    // TC9.10: Student tries material from unrelated class -> 403
    // ==================================================
    console.log('\n[TC9.10] Student tries material from unrelated class -> 403...');
    // Student 1 is NOT enrolled in Class 2
    const studentUnrelatedRes = await request(`/classes/${class2._id}/materials`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentUnrelatedRes.status === 403, `Student received 403 accessing materials from unenrolled class`);

    // ==================================================
    // TC9.11: Upload disallowed executable file (.exe) -> 422 rejected
    // ==================================================
    console.log('\n[TC9.11] Upload disallowed executable file (.exe) -> 422 rejected...');
    const exeBlob = new Blob([Buffer.from('MZ binary executable file')], { type: 'application/x-msdownload' });
    const formDataExe = new FormData();
    formDataExe.append('title', 'Tệp độc hại');
    formDataExe.append('file', exeBlob, 'virus.exe');

    const exeUploadRes = await request(`/classes/${class1._id}/materials`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formDataExe,
    });
    assert(exeUploadRes.status === 422, `Upload .exe rejected with 422 Unprocessable Entity (Got: ${exeUploadRes.status})`);

    // ==================================================
    // TC9.12: Upload oversized file (> 15MB) -> 422 rejected
    // ==================================================
    console.log('\n[TC9.12] Upload oversized file (> 15MB) -> 422 rejected...');
    // Create oversized buffer (16 MB)
    const largeBuffer = Buffer.alloc(16 * 1024 * 1024, 'a');
    const largeBlob = new Blob([largeBuffer], { type: 'application/pdf' });
    const formDataLarge = new FormData();
    formDataLarge.append('title', 'Tài liệu quá dung lượng');
    formDataLarge.append('file', largeBlob, 'huge_file.pdf');

    const largeUploadRes = await request(`/classes/${class1._id}/materials`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formDataLarge,
    });
    assert(largeUploadRes.status === 422, `Upload oversized file rejected with 422 (Got: ${largeUploadRes.status})`);

    // ==================================================
    // TC9.13: Admin deletes material -> record removed and physical file cleaned up
    // ==================================================
    console.log('\n[TC9.13] Admin deletes material -> record removed and physical file cleaned up...');
    const fullPhysicalPath = path.join(__dirname, '..', uploadedMaterial.fileUrl);
    const fileExistedBefore = fs.existsSync(fullPhysicalPath);

    const deleteMatRes = await request(`/materials/${uploadedMaterial._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteMatRes.status === 200, `Admin deleted material (200 OK)`);

    const dbCheckMat = await StudyMaterial.findById(uploadedMaterial._id);
    assert(!dbCheckMat, `StudyMaterial document removed from MongoDB`);

    const fileExistsAfter = fs.existsSync(fullPhysicalPath);
    assert(fileExistedBefore && !fileExistsAfter, `Physical file cleaned up from server filesystem`);

    // ==================================================
    // TC9.14: Student sees only materials from own classes
    // ==================================================
    console.log('\n[TC9.14] Student sees only materials from own classes...');
    // Create material for Class 2 (Teacher 2)
    const t2Material = await StudyMaterial.create({
      title: 'Class 2 Specific Notes',
      description: 'Chỉ dành cho Lớp 2',
      fileUrl: '/uploads/materials/test_class2.pdf',
      class: class2._id,
      uploadedBy: teacher2User._id,
    });
    createdMaterialIds.push(t2Material._id);

    // Student 1 accesses Class 1: OK
    const s1c1 = await request(`/classes/${class1._id}/materials`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(s1c1.status === 200, `Student 1 accesses Class 1 materials (200 OK)`);

    // Student 1 accesses Class 2: 403
    const s1c2 = await request(`/classes/${class2._id}/materials`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(s1c2.status === 403, `Student 1 denied access to Class 2 materials (403 Forbidden)`);

    // Student 2 accesses Class 2: OK
    const s2c2 = await request(`/classes/${class2._id}/materials`, {
      headers: { Authorization: `Bearer ${student2Token}` },
    });
    assert(s2c2.status === 200, `Student 2 accesses Class 2 materials (200 OK)`);
    assert(s2c2.data.some((m) => m._id.toString() === t2Material._id.toString()), `Student 2 sees Class 2 material`);

  } catch (error) {
    console.error('Unexpected test error:', error);
    failed++;
  } finally {
    // Cleanup notices
    if (createdNoticeIds.length > 0) {
      await Notice.deleteMany({ _id: { $in: createdNoticeIds } });
    }
    // Cleanup materials
    if (createdMaterialIds.length > 0) {
      await StudyMaterial.deleteMany({ _id: { $in: createdMaterialIds } });
    }
    // Cleanup test users
    if (teacher2User) {
      await Teacher.findByIdAndDelete(teacher2Doc?._id);
      await User.findByIdAndDelete(teacher2User._id);
    }
    if (student2User) {
      await Student.findByIdAndDelete(student2Doc?._id);
      await User.findByIdAndDelete(student2User._id);
    }
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
