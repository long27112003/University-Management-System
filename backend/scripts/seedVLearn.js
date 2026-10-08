/**
 * VLEARN DEMO SEED SCRIPT
 *
 * ⚠️ CẢNH BÁO: Dữ liệu mẫu (Demo seed) chỉ dành cho môi trường Local / Demo / Trình diễn,
 * tuyệt đối không dùng làm tài khoản sản xuất (Demo seed credentials are for local/demo
 * environments only and must never be used as production credentials).
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Models
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

// Production Safety Guard
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  console.error('❌ Refusing to run demo seed in production without ALLOW_DEMO_SEED=true.');
  process.exit(1);
}

// Helpers
const hashPassword = async (pwd) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pwd, salt);
};

const getRelativeDate = (daysOffset, hour = 9, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

async function seed() {
  console.log('==================================================');
  console.log('KHỞI CHẠY TẠO DỮ LIỆU MẪU VLEARN (SEED VLEARN)');
  console.log('==================================================');
  console.log('⚠️  CẢNH BÁO: Dữ liệu mẫu chỉ dành cho môi trường phát triển và trình diễn.\n');

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI không được tìm thấy trong biến môi trường (.env)');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Kết nối cơ sở dữ liệu MongoDB thành công.');

  // 1. CLEAR VLEARN DEMO COLLECTIONS
  console.log('\n[1/12] Xóa sạch các bộ sưu tập dữ liệu VLearn...');
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Teacher.deleteMany({}),
    Class.deleteMany({}),
    Enrollment.deleteMany({}),
    Schedule.deleteMany({}),
    ClassSession.deleteMany({}),
    Attendance.deleteMany({}),
    LearningResult.deleteMany({}),
    TuitionInvoice.deleteMany({}),
    Payment.deleteMany({}),
    Notice.deleteMany({}),
    StudyMaterial.deleteMany({}),
  ]);
  console.log('✓ Đã làm sạch các bảng dữ liệu VLearn an toàn.');

  // 2. CREATE DEMO USERS (2 Admins, 2 Receptionists, 6 Teachers, 30 Students)
  console.log('\n[2/12] Khởi tạo tài khoản người dùng (Users)...');
  const adminPwd = await hashPassword('VLearnAdmin123!');
  const recepPwd = await hashPassword('VLearnReception123!');
  const teachPwd = await hashPassword('VLearnTeacher123!');
  const studPwd  = await hashPassword('VLearnStudent123!');

  // 2 Admins
  const adminUsers = await User.create([
    {
      name: 'Nguyễn Quản Trị',
      email: 'admin@vlearn.edu.vn',
      password: adminPwd,
      role: 'Admin',
      status: 'active',
      createdAt: getRelativeDate(-90),
    },
    {
      name: 'Lê Văn Giám Đốc',
      email: 'admin2@vlearn.edu.vn',
      password: adminPwd,
      role: 'Admin',
      status: 'active',
      createdAt: getRelativeDate(-80),
    },
  ]);

  // 2 Receptionists
  const receptionistUsers = await User.create([
    {
      name: 'Trần Thị Lễ Tân',
      email: 'letan@vlearn.edu.vn',
      password: recepPwd,
      role: 'Receptionist',
      status: 'active',
      createdAt: getRelativeDate(-75),
    },
    {
      name: 'Phạm Thu Hằng',
      email: 'letan2@vlearn.edu.vn',
      password: recepPwd,
      role: 'Receptionist',
      status: 'active',
      createdAt: getRelativeDate(-60),
    },
  ]);

  // 6 Teachers
  const teacherConfigs = [
    { name: 'Nguyễn Hoàng Anh', email: 'teacher@vlearn.edu.vn', gender: 'male', spec: ['listening', 'speaking'], avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80' },
    { name: 'Trần Thu Hà', email: 'teacher.ha@vlearn.edu.vn', gender: 'female', spec: ['reading', 'writing'], avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80' },
    { name: 'David Miller', email: 'teacher.david@vlearn.edu.vn', gender: 'male', spec: ['speaking', 'listening'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80' },
    { name: 'Lê Thị Mai', email: 'teacher.mai@vlearn.edu.vn', gender: 'female', spec: ['writing', 'reading'], avatar: 'https://images.unsplash.com/photo-1580894732488-825528d9ffb6?auto=format&fit=crop&w=256&h=256&q=80' },
    { name: 'Phạm Minh Đức', email: 'teacher.duc@vlearn.edu.vn', gender: 'male', spec: ['listening', 'reading'], avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80' },
    { name: 'Sarah Jenkins', email: 'teacher.sarah@vlearn.edu.vn', gender: 'female', spec: ['speaking', 'writing'], avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80' },
  ];

  const teacherUsers = [];
  for (let i = 0; i < teacherConfigs.length; i++) {
    const cfg = teacherConfigs[i];
    const u = await User.create({
      name: cfg.name,
      email: cfg.email,
      password: teachPwd,
      role: 'Teacher',
      status: 'active',
      avatar: cfg.avatar,
      createdAt: getRelativeDate(-70 + i * 5),
    });
    teacherUsers.push(u);
  }

  // 30 Students
  const studentNames = [
    'Trần Quang Minh', 'Nguyễn Thu Phương', 'Lê Hoàng Nam', 'Phạm Quỳnh Chi', 'Vũ Đức Duy',
    'Hoàng Yến Nhi', 'Bùi Gia Huy', 'Đặng Thảo Vy', 'Đỗ Minh Tuấn', 'Ngô Bảo Châu',
    'Dương Tuấn Kiệt', 'Lý Hải Đăng', 'Đinh Ngọc Diệp', 'Đoàn Bảo Ngọc', 'Lâm Thanh Phong',
    'Trịnh Mai Linh', 'Phan Quốc Bảo', 'Võ Hoàng Yến', 'Hồ Quang Hiếu', 'Mai Thùy Trang',
    'Nguyễn Đức Phúc', 'Trần Bảo Anh', 'Lê Minh Hằng', 'Phạm Tuấn Anh', 'Vũ Thùy Chi',
    'Hoàng Bách', 'Bùi Lan Hương', 'Đặng Nhật Minh', 'Đỗ Thùy Dung', 'Ngô Kiến Huy',
  ];

  const maleAvatars = [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&h=256&q=80',
  ];
  const femaleAvatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&w=256&h=256&q=80',
  ];

  const studentUsers = [];
  for (let i = 0; i < studentNames.length; i++) {
    const isPrimaryDemo = i === 0;
    const isInactiveDemo = i === 29; // Student 30 is inactive for testing
    const email = isPrimaryDemo
      ? 'student@vlearn.edu.vn'
      : isInactiveDemo
      ? 'inactive.student@vlearn.edu.vn'
      : `student${i + 1}@vlearn.edu.vn`;

    const isMale = i % 2 === 0;
    const avatar = isMale
      ? maleAvatars[Math.floor(i / 2) % maleAvatars.length]
      : femaleAvatars[Math.floor(i / 2) % femaleAvatars.length];

    const u = await User.create({
      name: studentNames[i],
      email,
      password: studPwd,
      role: 'Student',
      status: isInactiveDemo ? 'inactive' : 'active',
      avatar,
      createdAt: getRelativeDate(-60 + Math.floor(i * 1.5)),
    });
    studentUsers.push(u);
  }

  console.log(`✓ Đã tạo ${adminUsers.length} Admin, ${receptionistUsers.length} Receptionist, ${teacherUsers.length} Teacher, ${studentUsers.length} Student.`);

  // 3. CREATE TEACHER PROFILES
  console.log('\n[3/12] Khởi tạo hồ sơ giáo viên (Teacher Profiles)...');
  const teacherDocs = [];
  for (let i = 0; i < teacherConfigs.length; i++) {
    const cfg = teacherConfigs[i];
    const code = `VL-GV${String(i + 1).padStart(3, '0')}`;
    const t = await Teacher.create({
      userId: teacherUsers[i]._id,
      teacherCode: code,
      fullName: cfg.name,
      email: cfg.email,
      phone: `090123400${i + 1}`,
      gender: cfg.gender,
      specialization: cfg.spec,
      status: 'active',
      avatar: cfg.avatar,
      createdAt: teacherUsers[i].createdAt,
    });
    teacherDocs.push(t);
  }
  console.log(`✓ Đã tạo ${teacherDocs.length} hồ sơ giáo viên chi tiết.`);

  // 4. CREATE STUDENT PROFILES
  console.log('\n[4/12] Khởi tạo hồ sơ học viên (Student Profiles)...');
  const studentDocs = [];
  const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

  for (let i = 0; i < studentNames.length; i++) {
    const code = `VL-HV2026${String(i + 1).padStart(3, '0')}`;
    let academicStatus = 'active';
    if (i === 27) academicStatus = 'waiting';
    else if (i === 28) academicStatus = 'paused';
    else if (i === 29) academicStatus = 'inactive';

    const s = await Student.create({
      userId: studentUsers[i]._id,
      studentCode: code,
      fullName: studentNames[i],
      email: studentUsers[i].email,
      phone: `09123450${String(i + 1).padStart(2, '0')}`,
      dateOfBirth: new Date(2003, (i % 12), (i % 28) + 1),
      gender: i % 2 === 0 ? 'male' : 'female',
      address: {
        city: cities[i % cities.length],
        state: 'Việt Nam',
        pincode: '100000',
      },
      emergencyContact: {
        name: `Phụ huynh ${studentNames[i]}`,
        relationship: i % 2 === 0 ? 'Bố' : 'Mẹ',
        phone: `09876540${String(i + 1).padStart(2, '0')}`,
      },
      academicStatus,
      avatar: studentUsers[i].avatar,
      createdAt: studentUsers[i].createdAt,
    });
    studentDocs.push(s);
  }
  console.log(`✓ Đã tạo ${studentDocs.length} hồ sơ học viên chi tiết.`);

  // 5. CREATE CLASSES (8 classes: 2 Listening, 2 Speaking, 2 Reading, 2 Writing)
  console.log('\n[5/12] Khởi tạo lớp học (Classes)...');
  const classDefs = [
    {
      classCode: 'VL-LIS-K01',
      className: 'Listening Foundation A01',
      skill: 'listening',
      teacher: teacherDocs[0]._id, // Teacher 1
      room: 'Room 101',
      maxCapacity: 20,
      tuitionFee: 3000000,
      startDate: getRelativeDate(-35),
      endDate: getRelativeDate(55),
      status: 'active',
    },
    {
      classCode: 'VL-LIS-K02',
      className: 'Listening Intermediate B02',
      skill: 'listening',
      teacher: teacherDocs[4]._id, // Teacher 5
      room: 'Room 102',
      maxCapacity: 20,
      tuitionFee: 3500000,
      startDate: getRelativeDate(-30),
      endDate: getRelativeDate(60),
      status: 'active',
    },
    {
      classCode: 'VL-SPK-K01',
      className: 'Speaking Communication A01',
      skill: 'speaking',
      teacher: teacherDocs[2]._id, // Teacher 3
      room: 'Room 201',
      maxCapacity: 20,
      tuitionFee: 3200000,
      startDate: getRelativeDate(-35),
      endDate: getRelativeDate(55),
      status: 'active',
    },
    {
      classCode: 'VL-SPK-K02',
      className: 'IELTS Speaking Intensive B01',
      skill: 'speaking',
      teacher: teacherDocs[0]._id, // Teacher 1
      room: 'Room 202',
      maxCapacity: 20,
      tuitionFee: 4500000,
      startDate: getRelativeDate(-28),
      endDate: getRelativeDate(62),
      status: 'active',
    },
    {
      classCode: 'VL-REA-K01',
      className: 'Reading Foundation A02',
      skill: 'reading',
      teacher: teacherDocs[1]._id, // Teacher 2
      room: 'Room 101',
      maxCapacity: 20,
      tuitionFee: 3000000,
      startDate: getRelativeDate(7),
      endDate: getRelativeDate(97),
      status: 'upcoming',
    },
    {
      classCode: 'VL-REA-K02',
      className: 'Academic Reading B01',
      skill: 'reading',
      teacher: teacherDocs[4]._id, // Teacher 5
      room: 'Room 201',
      maxCapacity: 20,
      tuitionFee: 3800000,
      startDate: getRelativeDate(-35),
      endDate: getRelativeDate(55),
      status: 'active',
    },
    {
      classCode: 'VL-WRI-K01',
      className: 'Writing Foundation A01',
      skill: 'writing',
      teacher: teacherDocs[3]._id, // Teacher 4
      room: 'Room 102',
      maxCapacity: 20,
      tuitionFee: 3200000,
      startDate: getRelativeDate(-35),
      endDate: getRelativeDate(55),
      status: 'active',
    },
    {
      classCode: 'VL-WRI-K02',
      className: 'Academic Writing B02',
      skill: 'writing',
      teacher: teacherDocs[5]._id, // Teacher 6
      room: 'Room 202',
      maxCapacity: 20,
      tuitionFee: 4200000,
      startDate: getRelativeDate(-90),
      endDate: getRelativeDate(-10),
      status: 'completed',
    },
  ];

  const classDocs = await Class.create(classDefs);
  console.log(`✓ Đã tạo ${classDocs.length} lớp học chuẩn kỹ năng (6 active, 1 upcoming, 1 completed).`);

  // 6. CREATE SCHEDULES (Valid non-overlapping schedules)
  console.log('\n[6/12] Khởi tạo thời khóa biểu (Schedules)...');
  const scheduleDefs = [
    // Class 0 (VL-LIS-K01): Mon/Wed 18:00 - 19:30, Room 101, Teacher 1
    { class: classDocs[0]._id, dayOfWeek: 2, startTime: '18:00', endTime: '19:30', room: 'Room 101', teacher: teacherDocs[0]._id },
    { class: classDocs[0]._id, dayOfWeek: 4, startTime: '18:00', endTime: '19:30', room: 'Room 101', teacher: teacherDocs[0]._id },

    // Class 1 (VL-LIS-K02): Tue/Thu 18:00 - 19:30, Room 102, Teacher 5
    { class: classDocs[1]._id, dayOfWeek: 3, startTime: '18:00', endTime: '19:30', room: 'Room 102', teacher: teacherDocs[4]._id },
    { class: classDocs[1]._id, dayOfWeek: 5, startTime: '18:00', endTime: '19:30', room: 'Room 102', teacher: teacherDocs[4]._id },

    // Class 2 (VL-SPK-K01): Mon/Wed 19:30 - 21:00, Room 201, Teacher 3
    { class: classDocs[2]._id, dayOfWeek: 2, startTime: '19:30', endTime: '21:00', room: 'Room 201', teacher: teacherDocs[2]._id },
    { class: classDocs[2]._id, dayOfWeek: 4, startTime: '19:30', endTime: '21:00', room: 'Room 201', teacher: teacherDocs[2]._id },

    // Class 3 (VL-SPK-K02): Tue/Thu 19:30 - 21:00, Room 202, Teacher 1
    { class: classDocs[3]._id, dayOfWeek: 3, startTime: '19:30', endTime: '21:00', room: 'Room 202', teacher: teacherDocs[0]._id },
    { class: classDocs[3]._id, dayOfWeek: 5, startTime: '19:30', endTime: '21:00', room: 'Room 202', teacher: teacherDocs[0]._id },

    // Class 4 (VL-REA-K01): Tue/Thu 18:00 - 19:30, Room 101, Teacher 2 (Upcoming)
    { class: classDocs[4]._id, dayOfWeek: 3, startTime: '18:00', endTime: '19:30', room: 'Room 101', teacher: teacherDocs[1]._id },
    { class: classDocs[4]._id, dayOfWeek: 5, startTime: '18:00', endTime: '19:30', room: 'Room 101', teacher: teacherDocs[1]._id },

    // Class 5 (VL-REA-K02): Mon/Wed 18:00 - 19:30, Room 201, Teacher 5
    { class: classDocs[5]._id, dayOfWeek: 2, startTime: '18:00', endTime: '19:30', room: 'Room 201', teacher: teacherDocs[4]._id },
    { class: classDocs[5]._id, dayOfWeek: 4, startTime: '18:00', endTime: '19:30', room: 'Room 201', teacher: teacherDocs[4]._id },

    // Class 6 (VL-WRI-K01): Mon/Wed 19:30 - 21:00, Room 102, Teacher 4
    { class: classDocs[6]._id, dayOfWeek: 2, startTime: '19:30', endTime: '21:00', room: 'Room 102', teacher: teacherDocs[3]._id },
    { class: classDocs[6]._id, dayOfWeek: 4, startTime: '19:30', endTime: '21:00', room: 'Room 102', teacher: teacherDocs[3]._id },

    // Class 7 (VL-WRI-K02): Sat/Sun 08:30 - 10:00, Room 202, Teacher 6 (Completed)
    { class: classDocs[7]._id, dayOfWeek: 7, startTime: '08:30', endTime: '10:00', room: 'Room 202', teacher: teacherDocs[5]._id },
    { class: classDocs[7]._id, dayOfWeek: 8, startTime: '08:30', endTime: '10:00', room: 'Room 202', teacher: teacherDocs[5]._id },
  ];

  const scheduleDocs = await Schedule.create(scheduleDefs);
  console.log(`✓ Đã tạo ${scheduleDocs.length} khung thời khóa biểu không trùng lịch.`);

  // 7. CREATE ENROLLMENTS (Realistic many-to-many distribution)
  console.log('\n[7/12] Khởi tạo ghi danh học viên (Enrollments)...');
  const enrollmentDocs = [];

  // Student 0 (student@vlearn.edu.vn) enrolled in Class 0, Class 3, Class 7 (historical completed)
  const primaryEnrollments = [
    { student: studentDocs[0]._id, class: classDocs[0]._id, status: 'active', enrolledAt: getRelativeDate(-35) },
    { student: studentDocs[0]._id, class: classDocs[3]._id, status: 'active', enrolledAt: getRelativeDate(-28) },
    { student: studentDocs[0]._id, class: classDocs[7]._id, status: 'completed', enrolledAt: getRelativeDate(-90), droppedAt: getRelativeDate(-10) },
  ];

  // Group A (Students 1 to 9): Class 0 (Mon/Wed 18:00) + Class 3 (Tue/Thu 19:30)
  const groupA = [];
  for (let i = 1; i <= 9; i++) {
    groupA.push(
      { student: studentDocs[i]._id, class: classDocs[0]._id, status: 'active', enrolledAt: getRelativeDate(-35) },
      { student: studentDocs[i]._id, class: classDocs[3]._id, status: 'active', enrolledAt: getRelativeDate(-28) }
    );
  }

  // Group B (Students 10 to 17): Class 1 (Tue/Thu 18:00) + Class 6 (Mon/Wed 19:30)
  const groupB = [];
  for (let i = 10; i <= 17; i++) {
    groupB.push(
      { student: studentDocs[i]._id, class: classDocs[1]._id, status: 'active', enrolledAt: getRelativeDate(-30) },
      { student: studentDocs[i]._id, class: classDocs[6]._id, status: 'active', enrolledAt: getRelativeDate(-35) }
    );
  }

  // Group C (Students 18 to 24): Class 2 (Mon/Wed 19:30) + Class 5 (Mon/Wed 18:00)
  const groupC = [];
  for (let i = 18; i <= 24; i++) {
    groupC.push(
      { student: studentDocs[i]._id, class: classDocs[2]._id, status: 'active', enrolledAt: getRelativeDate(-35) },
      { student: studentDocs[i]._id, class: classDocs[5]._id, status: 'active', enrolledAt: getRelativeDate(-35) }
    );
  }

  // Group Upcoming (Students 5 to 12 in upcoming Class 4)
  const groupUpcoming = [];
  for (let i = 5; i <= 12; i++) {
    groupUpcoming.push({
      student: studentDocs[i]._id,
      class: classDocs[4]._id,
      status: 'active',
      enrolledAt: getRelativeDate(-5),
    });
  }

  // Historical: Student 25 (dropped), Student 26 (transferred)
  const historical = [
    {
      student: studentDocs[25]._id,
      class: classDocs[0]._id,
      status: 'dropped',
      enrolledAt: getRelativeDate(-35),
      droppedAt: getRelativeDate(-15),
      note: 'Thôi học do bận lịch công tác cá nhân',
    },
    {
      student: studentDocs[26]._id,
      class: classDocs[0]._id,
      status: 'transferred',
      enrolledAt: getRelativeDate(-35),
      droppedAt: getRelativeDate(-20),
      note: 'Chuyển sang lớp phù hợp thời gian',
    },
    {
      student: studentDocs[26]._id,
      class: classDocs[1]._id,
      status: 'active',
      enrolledAt: getRelativeDate(-20),
      transferredFrom: classDocs[0]._id,
      note: 'Nhận chuyển lớp từ VL-LIS-K01',
    },
  ];

  const allEnrollmentDefs = [
    ...primaryEnrollments,
    ...groupA,
    ...groupB,
    ...groupC,
    ...groupUpcoming,
    ...historical,
  ];

  for (const ed of allEnrollmentDefs) {
    const doc = await Enrollment.create(ed);
    enrollmentDocs.push(doc);
  }
  console.log(`✓ Đã tạo ${enrollmentDocs.length} bản ghi ghi danh (Bao gồm active, completed, dropped, transferred).`);

  // 8. CREATE CLASS SESSIONS (Past completed, today/current, future scheduled)
  console.log('\n[8/12] Khởi tạo các buổi học (Class Sessions)...');
  const sessionDocs = [];

  // Helper to generate sessions for a class based on its schedules
  for (let cIdx = 0; cIdx < classDocs.length; cIdx++) {
    const c = classDocs[cIdx];
    const cSchedules = scheduleDocs.filter(s => s.class.toString() === c._id.toString());
    const totalSessions = 10;

    // Generate sessions every 3-4 days starting from startDate
    let curDate = new Date(c.startDate);
    for (let sNum = 1; sNum <= totalSessions; sNum++) {
      const sch = cSchedules[(sNum - 1) % cSchedules.length];
      const sessionDate = new Date(curDate);
      const isPast = sessionDate < new Date();
      let status = 'scheduled';
      if (c.status === 'completed' || (c.status === 'active' && isPast)) {
        status = 'completed';
      }

      const sess = await ClassSession.create({
        class: c._id,
        schedule: sch._id,
        teacher: sch.teacher,
        sessionNumber: sNum,
        sessionDate,
        startTime: sch.startTime,
        endTime: sch.endTime,
        room: sch.room,
        status,
        note: `Buổi học số ${sNum}: Nội dung chuyên đề ${c.skill.toUpperCase()}`,
      });
      sessionDocs.push(sess);

      // Advance curDate by 3-4 days
      curDate.setDate(curDate.getDate() + (sNum % 2 === 1 ? 2 : 5));
    }
  }
  console.log(`✓ Đã tạo ${sessionDocs.length} buổi học phân bổ theo đúng thời khóa biểu.`);

  // 9. CREATE ATTENDANCE (Realistic distribution on completed sessions)
  console.log('\n[9/12] Khởi tạo dữ liệu điểm danh (Attendance)...');
  const attendanceDocs = [];
  const completedSessions = sessionDocs.filter(s => s.status === 'completed');

  for (const sess of completedSessions) {
    // Get active students enrolled in this class at that time
    const classEnrolls = enrollmentDocs.filter(
      e => e.class.toString() === sess.class.toString() &&
      (e.status === 'active' || e.status === 'completed' || e.status === 'dropped')
    );

    for (let idx = 0; idx < classEnrolls.length; idx++) {
      const enr = classEnrolls[idx];
      // Deterministic realistic ratio: ~78% Present, 8% Late, 6% Excused, 8% Absent
      const randVal = ((idx * 17) + (sess.sessionNumber * 13)) % 100;
      let status = 'Present';
      let note = '';
      if (randVal >= 78 && randVal < 86) {
        status = 'Late';
        note = 'Đến muộn 15 phút do tắc đường';
      } else if (randVal >= 86 && randVal < 92) {
        status = 'Excused';
        note = 'Có đơn xin phép bận việc đột xuất';
      } else if (randVal >= 92) {
        status = 'Absent';
        note = 'Nghỉ không phép';
      }

      const att = await Attendance.create({
        student: enr.student,
        session: sess._id,
        class: sess.class,
        status,
        note,
        markedBy: sess.teacher,
        markedAt: sess.sessionDate,
      });
      attendanceDocs.push(att);
    }
  }
  console.log(`✓ Đã tạo ${attendanceDocs.length} bản ghi điểm danh thực tế.`);

  // 10. CREATE LEARNING RESULTS (Midterm & final exam scores)
  console.log('\n[10/12] Khởi tạo kết quả học tập (Learning Results)...');
  const resultDocs = [];
  const activeAndCompletedClasses = classDocs.filter(c => c.status === 'active' || c.status === 'completed');

  for (const c of activeAndCompletedClasses) {
    const classEnrolls = enrollmentDocs.filter(
      e => e.class.toString() === c._id.toString() &&
      (e.status === 'active' || e.status === 'completed')
    );

    for (let idx = 0; idx < classEnrolls.length; idx++) {
      const enr = classEnrolls[idx];
      // Generate scores between 65 and 95
      const baseScore = 65 + ((idx * 7) % 25);
      const listeningScore = Math.min(100, Math.max(50, baseScore + ((idx % 3) * 3)));
      const speakingScore  = Math.min(100, Math.max(50, baseScore - ((idx % 2) * 4)));
      const readingScore   = Math.min(100, Math.max(50, baseScore + ((idx % 4) * 2)));
      const writingScore   = Math.min(100, Math.max(50, baseScore - ((idx % 3) * 2)));

      const overallScore = Number(
        ((listeningScore + speakingScore + readingScore + writingScore) / 4).toFixed(1)
      );

      const lr = await LearningResult.create({
        student: enr.student,
        class: c._id,
        testType: 'midterm',
        testDate: getRelativeDate(-12),
        listeningScore,
        speakingScore,
        readingScore,
        writingScore,
        overallScore,
        teacherComment: overallScore >= 80
          ? 'Nắm rất vững kiến thức trọng tâm, phản xạ tự nhiên và mạch lạc'
          : 'Có nhiều tiến bộ, cần tăng cường làm bài tập kỹ năng Viết và Nghe',
        enteredBy: c.teacher,
        createdAt: getRelativeDate(-10),
      });
      resultDocs.push(lr);
    }
  }
  console.log(`✓ Đã tạo ${resultDocs.length} bảng điểm kiểm tra giữa kỳ chi tiết.`);

  // 11. CREATE TUITION INVOICES & PAYMENTS (Strict financial consistency)
  console.log('\n[11/12] Khởi tạo hóa đơn học phí và phiếu thu (Tuition & Payments)...');
  const invoiceDocs = [];
  const paymentDocs = [];

  const invoiceEnrollments = enrollmentDocs.filter(e => e.status === 'active' || e.status === 'completed');

  let invoiceCounter = 1;
  let paymentCounter = 1;

  for (let idx = 0; idx < invoiceEnrollments.length; idx++) {
    const enr = invoiceEnrollments[idx];
    const targetClass = classDocs.find(c => c._id.toString() === enr.class.toString());
    const tuitionFee = targetClass.tuitionFee;

    const invoiceCode = `VL-INV2026${String(invoiceCounter++).padStart(4, '0')}`;
    const paymentPattern = idx % 10; // Mix of states

    let paidAmount = 0;
    let remainingAmount = tuitionFee;
    let status = 'unpaid';
    let dueDate = getRelativeDate(15);
    const invoicePayments = [];

    if (paymentPattern < 4) {
      // 40% FULLY PAID
      paidAmount = tuitionFee;
      remainingAmount = 0;
      status = 'paid';
      const paymentCode = `VL-PT2026${String(paymentCounter++).padStart(4, '0')}`;
      invoicePayments.push({
        paymentCode,
        amount: tuitionFee,
        paymentDate: getRelativeDate(-20 + (idx % 10)),
        paymentMethod: idx % 3 === 0 ? 'bank_transfer' : idx % 3 === 1 ? 'cash' : 'card',
        status: 'completed',
        note: 'Thanh toán trọn gói học phí khóa học',
      });
    } else if (paymentPattern < 7) {
      // 30% PARTIALLY PAID (Pay 1,500,000 đ)
      const pay1 = Math.min(1500000, tuitionFee);
      paidAmount = pay1;
      remainingAmount = tuitionFee - pay1;
      status = 'partial';
      const paymentCode = `VL-PT2026${String(paymentCounter++).padStart(4, '0')}`;
      invoicePayments.push({
        paymentCode,
        amount: pay1,
        paymentDate: getRelativeDate(-15 + (idx % 10)),
        paymentMethod: 'bank_transfer',
        status: 'completed',
        note: 'Đóng trước đợt 1 học phí',
      });
    } else if (paymentPattern < 9) {
      // 20% UNPAID (Due in future)
      paidAmount = 0;
      remainingAmount = tuitionFee;
      status = 'unpaid';
      dueDate = getRelativeDate(10);
    } else {
      // 10% OVERDUE (Due in past)
      paidAmount = 0;
      remainingAmount = tuitionFee;
      status = 'overdue';
      dueDate = getRelativeDate(-14);
    }

    const inv = await TuitionInvoice.create({
      invoiceCode,
      student: enr.student,
      enrollment: enr._id,
      class: enr.class,
      totalAmount: tuitionFee,
      paidAmount,
      remainingAmount,
      status,
      dueDate,
      createdBy: receptionistUsers[0]._id,
      createdAt: enr.enrolledAt,
    });
    invoiceDocs.push(inv);

    // Create payment records matching invoice
    for (const pDef of invoicePayments) {
      const p = await Payment.create({
        paymentCode: pDef.paymentCode,
        invoice: inv._id,
        student: inv.student,
        amount: pDef.amount,
        paymentDate: pDef.paymentDate,
        paymentMethod: pDef.paymentMethod,
        status: 'completed',
        note: pDef.note,
        createdBy: receptionistUsers[0]._id,
      });
      paymentDocs.push(p);
    }
  }

  // Create 1 VOIDED payment for Admin demo/audit verification
  const firstPaidInvoice = invoiceDocs.find(i => i.status === 'paid' || i.status === 'partial');
  if (firstPaidInvoice) {
    const voidPaymentCode = `VL-PT2026${String(paymentCounter++).padStart(4, '0')}`;
    const voidedPayment = await Payment.create({
      paymentCode: voidPaymentCode,
      invoice: firstPaidInvoice._id,
      student: firstPaidInvoice.student,
      amount: 500000,
      paymentDate: getRelativeDate(-8),
      paymentMethod: 'cash',
      status: 'voided',
      voidReason: 'Khách hàng chuyển khoản nhầm số tài khoản, đã hoàn tiền và hủy phiếu thu',
      voidedBy: adminUsers[0]._id,
      voidedAt: getRelativeDate(-3),
      note: 'Phiếu thu thử nghiệm tính năng hủy giao dịch',
      createdBy: receptionistUsers[0]._id,
    });
    paymentDocs.push(voidedPayment);
  }

  // CRITICAL CONSISTENCY CHECK (Section 17)
  console.log('  → Đang kiểm tra tính nhất quán tài chính (Financial Consistency Verification)...');
  for (const inv of invoiceDocs) {
    const completedPayments = paymentDocs.filter(
      p => p.invoice.toString() === inv._id.toString() && p.status === 'completed'
    );
    const sumPaid = completedPayments.reduce((acc, p) => acc + p.amount, 0);

    if (inv.paidAmount !== sumPaid) {
      throw new Error(`Inconsistency detected for Invoice ${inv.invoiceCode}: paidAmount ${inv.paidAmount} !== sum(completed payments) ${sumPaid}`);
    }

    if (inv.remainingAmount !== (inv.totalAmount - inv.paidAmount)) {
      throw new Error(`Inconsistency detected for Invoice ${inv.invoiceCode}: remainingAmount ${inv.remainingAmount} !== totalAmount - paidAmount`);
    }
  }
  console.log(`✓ Đã tạo ${invoiceDocs.length} hóa đơn học phí và ${paymentDocs.length} phiếu thu (100% nhất quán dữ liệu công nợ).`);

  // 12. CREATE NOTICES & STUDY MATERIALS
  console.log('\n[12/12] Khởi tạo thông báo trung tâm và tài liệu học tập (Notices & Materials)...');
  const noticeDefs = [
    {
      title: 'Lịch nghỉ lễ Quốc khánh và kế hoạch học bù',
      content: 'Trung tâm VLearn thông báo toàn thể học viên và giảng viên lịch nghỉ lễ Quốc khánh 02/09. Các buổi học trùng ngày nghỉ sẽ được bù vào tuần tiếp theo theo hướng dẫn của bộ phận Giáo vụ.',
      audience: 'all',
      createdBy: adminUsers[0]._id,
      createdAt: getRelativeDate(-20),
    },
    {
      title: 'Hướng dẫn nộp học phí và chính sách ưu đãi khóa học mới',
      content: 'Nhằm hỗ trợ học viên thuận tiện trong thanh toán học phí, VLearn hỗ trợ hình thức chuyển khoản qua ngân hàng hoặc thanh toán thẻ trực tiếp tại quầy lễ tân với ưu đãi 10% khi đăng ký sớm.',
      audience: 'all',
      createdBy: receptionistUsers[0]._id,
      createdAt: getRelativeDate(-15),
    },
    {
      title: 'Lịch thi thử IELTS Mock Test định kỳ tháng này',
      content: 'Kỳ thi thử IELTS 4 kỹ năng sẽ diễn ra vào sáng Thứ Bảy tuần này tại phòng Lab 201. Học viên vui lòng có mặt trước 15 phút để làm thủ tục check-in và nhận số báo danh.',
      audience: 'student',
      createdBy: adminUsers[0]._id,
      createdAt: getRelativeDate(-7),
    },
    {
      title: 'Nhắc nhở cập nhật giáo án và điểm danh trên hệ thống VLearn',
      content: 'Kính gửi quý thầy cô, vui lòng hoàn tất việc đánh dấu điểm danh trong vòng 24 giờ sau mỗi buổi dạy và nhập điểm kiểm tra định kỳ để phụ huynh và học viên kịp thời theo dõi tiến độ.',
      audience: 'teacher',
      createdBy: adminUsers[0]._id,
      createdAt: getRelativeDate(-5),
    },
    {
      title: 'Quy trình tư vấn tuyển sinh và tiếp nhận hồ sơ học viên mới',
      content: 'Đề nghị bộ phận Lễ tân và Tư vấn viên thực hiện đúng quy trình tiếp nhận thông tin, kiểm tra sĩ số lớp và xuất hóa đơn học phí theo đúng mẫu quy định trên hệ thống VLearn.',
      audience: 'receptionist',
      createdBy: adminUsers[0]._id,
      createdAt: getRelativeDate(-10),
    },
    {
      title: 'Chuyên đề nâng cao kỹ năng Viết Task 2 và Nói Part 3 cùng chuyên gia',
      content: 'VLearn tổ chức buổi workshop trực tiếp giải đáp các lỗi thường gặp trong bài thi Viết và Nói IELTS. Học viên đang theo học các lớp Foundation và Intermediate đều được tham gia miễn phí.',
      audience: 'student',
      createdBy: teacherUsers[0]._id,
      createdAt: getRelativeDate(-2),
    },
  ];

  const noticeDocs = await Notice.create(noticeDefs);
  console.log(`✓ Đã tạo ${noticeDocs.length} thông báo toàn trung tâm.`);

  // Physical Study Materials linking to existing files
  const materialDefs = [
    {
      title: 'Tài liệu luyện nghe Unit 1 - Foundation Listening Practice',
      description: 'File tài liệu bài tập nghe căn bản kèm transcript chi tiết.',
      fileUrl: '/uploads/materials/listening_foundation_unit1.pdf',
      class: classDocs[0]._id,
      uploadedBy: teacherUsers[0]._id,
      fileSize: 1024,
      fileType: 'pdf',
      createdAt: getRelativeDate(-25),
    },
    {
      title: 'Bộ câu hỏi và dàn ý mẫu IELTS Speaking Part 2',
      description: 'Tổng hợp 50 chủ đề Speaking thường gặp trong quý này kèm từ vựng nâng cao.',
      fileUrl: '/uploads/materials/ielts_speaking_part2_card.pdf',
      class: classDocs[3]._id,
      uploadedBy: teacherUsers[0]._id,
      fileSize: 1024,
      fileType: 'pdf',
      createdAt: getRelativeDate(-20),
    },
    {
      title: 'Hướng dẫn viết bài và các cấu trúc mẫu Academic Writing Task 2',
      description: 'Mẫu phân tích đề bài, lập dàn ý và các cấu trúc ngữ pháp đạt điểm cao cho Task 2.',
      fileUrl: '/uploads/materials/academic_writing_task2_guide.pdf',
      class: classDocs[6]._id,
      uploadedBy: teacherUsers[3]._id,
      fileSize: 1024,
      fileType: 'pdf',
      createdAt: getRelativeDate(-18),
    },
  ];

  const materialDocs = await StudyMaterial.create(materialDefs);
  console.log(`✓ Đã tạo ${materialDocs.length} tài liệu học tập gắn liền với tệp PDF thực tế.`);

  // FINAL PRINT SUMMARY
  console.log('\n==================================================');
  console.log('VLearn Seed Complete');
  console.log('==================================================');
  console.log('Users:');
  console.log(`  Admins: ${adminUsers.length}`);
  console.log(`  Receptionists: ${receptionistUsers.length}`);
  console.log(`  Teachers: ${teacherUsers.length}`);
  console.log(`  Students: ${studentUsers.length}`);
  console.log(`Classes: ${classDocs.length}`);
  console.log(`Enrollments: ${enrollmentDocs.length}`);
  console.log(`Schedules: ${scheduleDocs.length}`);
  console.log(`Sessions: ${sessionDocs.length}`);
  console.log(`Attendance Records: ${attendanceDocs.length}`);
  console.log(`Learning Results: ${resultDocs.length}`);
  console.log(`Invoices: ${invoiceDocs.length}`);
  console.log(`Payments: ${paymentDocs.length}`);
  console.log(`Notices: ${noticeDocs.length}`);
  console.log(`Materials: ${materialDocs.length}`);
  console.log('\nDemo accounts:');
  console.log('  Admin:       admin@vlearn.edu.vn       (VLearnAdmin123!)');
  console.log('  Receptionist: letan@vlearn.edu.vn       (VLearnReception123!)');
  console.log('  Teacher:     teacher@vlearn.edu.vn     (VLearnTeacher123!)');
  console.log('  Student:     student@vlearn.edu.vn     (VLearnStudent123!)');
  console.log('==================================================\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Lỗi thực thi seedVLearn:', err);
  process.exit(1);
});
