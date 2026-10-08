const mongoose = require('mongoose');
const LearningResult = require('../models/LearningResult');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Enrollment = require('../models/Enrollment');

const VALID_TEST_TYPES = ['placement', 'midterm', 'final', 'mock'];

/**
 * Tính điểm tổng kết (overallScore) làm tròn 1 chữ số thập phân
 * Chỉ tính trung bình các kỹ năng có điểm hợp lệ (không null/undefined)
 */
const calculateOverallScore = (listening, speaking, reading, writing) => {
  const scores = [listening, speaking, reading, writing].filter(
    s => s !== null && s !== undefined && s !== '' && !isNaN(Number(s))
  );

  if (scores.length === 0) return 0;

  const numScores = scores.map(Number);
  const sum = numScores.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / numScores.length).toFixed(1));
};

/**
 * Kiểm tra tính hợp lệ của điểm số (0 - 100)
 */
const validateScoreValue = (val, fieldName) => {
  if (val === null || val === undefined || val === '') {
    return null;
  }
  const num = Number(val);
  if (isNaN(num) || num < 0 || num > 100) {
    const error = new Error(`${fieldName} phải là giá trị số trong khoảng từ 0 đến 100`);
    error.statusCode = 422;
    throw error;
  }
  return Number(num.toFixed(1));
};

/**
 * Chuẩn hóa ngày kiểm tra về dải ngày (bắt đầu và kết thúc ngày theo UTC/Local)
 */
const getDateRange = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const error = new Error('Ngày kiểm tra (testDate) không hợp lệ');
    error.statusCode = 422;
    throw error;
  }
  const startOfDay = new Date(d);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(d);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return { targetDate: d, startOfDay, endOfDay };
};

/**
 * GET /api/classes/:classId/results
 */
const getClassResultsService = async (classId, queryParams, requestingUser) => {
  if (!mongoose.Types.ObjectId.isValid(classId)) {
    const error = new Error('classId không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const classDoc = await Class.findById(classId)
    .populate('teacher', 'fullName teacherCode email phone');

  if (!classDoc) {
    const error = new Error('Không tìm thấy lớp học');
    error.statusCode = 404;
    throw error;
  }

  // Phân quyền theo vai trò
  if (requestingUser.role === 'Teacher') {
    const teacherProfile = await Teacher.findOne({ userId: requestingUser._id });
    if (!teacherProfile || classDoc.teacher?._id?.toString() !== teacherProfile._id.toString()) {
      const error = new Error('Bạn chỉ được xem bảng điểm của các lớp do mình giảng dạy');
      error.statusCode = 403;
      throw error;
    }
  } else if (requestingUser.role === 'Student') {
    const error = new Error('Học viên không có quyền truy cập bảng điểm toàn lớp');
    error.statusCode = 403;
    throw error;
  }

  const filter = { class: classId };

  if (queryParams.testType) {
    if (!VALID_TEST_TYPES.includes(queryParams.testType)) {
      const error = new Error('testType không hợp lệ');
      error.statusCode = 422;
      throw error;
    }
    filter.testType = queryParams.testType;
  }

  if (queryParams.testDate) {
    const { startOfDay, endOfDay } = getDateRange(queryParams.testDate);
    filter.testDate = { $gte: startOfDay, $lte: endOfDay };
  }

  if (queryParams.studentId) {
    if (!mongoose.Types.ObjectId.isValid(queryParams.studentId)) {
      const error = new Error('studentId không hợp lệ');
      error.statusCode = 400;
      throw error;
    }
    filter.student = queryParams.studentId;
  }

  const results = await LearningResult.find(filter)
    .populate('student', 'studentCode fullName phone email gender')
    .populate('enteredBy', 'fullName name email')
    .sort({ testDate: -1, createdAt: -1 });

  return {
    class: {
      _id: classDoc._id,
      classCode: classDoc.classCode,
      className: classDoc.className,
      skill: classDoc.skill,
      teacher: classDoc.teacher ? {
        _id: classDoc.teacher._id,
        fullName: classDoc.teacher.fullName,
        teacherCode: classDoc.teacher.teacherCode
      } : null
    },
    results
  };
};

/**
 * POST /api/classes/:classId/results (Bulk create test results)
 */
const createClassResultsService = async (classId, payload, requestingUser) => {
  if (!mongoose.Types.ObjectId.isValid(classId)) {
    const error = new Error('classId không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    const error = new Error('Không tìm thấy lớp học');
    error.statusCode = 404;
    throw error;
  }

  // 1. Phân quyền
  if (requestingUser.role === 'Receptionist') {
    const error = new Error('Nhân viên lễ tân chỉ có quyền xem bảng điểm, không được tạo mới');
    error.statusCode = 403;
    throw error;
  }

  if (requestingUser.role === 'Student') {
    const error = new Error('Học viên không có quyền nhập điểm');
    error.statusCode = 403;
    throw error;
  }

  if (requestingUser.role === 'Teacher') {
    const teacherProfile = await Teacher.findOne({ userId: requestingUser._id });
    if (!teacherProfile || classDoc.teacher?.toString() !== teacherProfile._id.toString()) {
      const error = new Error('Bạn chỉ được nhập điểm cho lớp học do mình giảng dạy');
      error.statusCode = 403;
      throw error;
    }
  }

  // 2. Kiểm tra testType & testDate
  const { testType, testDate, records } = payload;

  if (!testType || !VALID_TEST_TYPES.includes(testType)) {
    const error = new Error(`Loại bài kiểm tra '${testType}' không hợp lệ. Phải là: placement, midterm, final, hoặc mock`);
    error.statusCode = 422;
    throw error;
  }

  const { targetDate, startOfDay, endOfDay } = getDateRange(testDate || new Date());

  if (!Array.isArray(records) || records.length === 0) {
    const error = new Error('Danh sách kết quả học tập (records) không được để trống');
    error.statusCode = 400;
    throw error;
  }

  // 3. Kiểm tra danh sách học viên thuộc lớp qua Enrollment
  const enrollments = await Enrollment.find({
    class: classId,
    status: { $in: ['active', 'completed'] }
  });
  const enrolledStudentIdSet = new Set(enrollments.map(e => e.student.toString()));

  const recordsToInsert = [];

  for (const r of records) {
    if (!r.studentId || !mongoose.Types.ObjectId.isValid(r.studentId)) {
      const error = new Error(`studentId '${r.studentId}' không hợp lệ`);
      error.statusCode = 400;
      throw error;
    }

    if (!enrolledStudentIdSet.has(r.studentId.toString())) {
      const error = new Error(`Học viên có ID ${r.studentId} không thuộc danh sách lớp học này`);
      error.statusCode = 422;
      throw error;
    }

    // Validate 4 skill scores
    const listeningScore = validateScoreValue(r.listeningScore, 'Điểm Nghe');
    const speakingScore  = validateScoreValue(r.speakingScore, 'Điểm Nói');
    const readingScore   = validateScoreValue(r.readingScore, 'Điểm Đọc');
    const writingScore   = validateScoreValue(r.writingScore, 'Điểm Viết');

    // Calculate overallScore server-side
    const overallScore = calculateOverallScore(
      listeningScore,
      speakingScore,
      readingScore,
      writingScore
    );

    // Duplicate check for student + class + testType + testDate
    const existingResult = await LearningResult.findOne({
      student: r.studentId,
      class: classId,
      testType,
      testDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingResult) {
      const error = new Error(`Học viên ID ${r.studentId} đã có kết quả bài kiểm tra '${testType}' vào ngày này`);
      error.statusCode = 409;
      throw error;
    }

    recordsToInsert.push({
      student: r.studentId,
      class: classId,
      testType,
      testDate: targetDate,
      listeningScore,
      speakingScore,
      readingScore,
      writingScore,
      overallScore,
      teacherComment: (r.teacherComment || '').trim(),
      enteredBy: requestingUser._id
    });
  }

  const createdResults = await LearningResult.insertMany(recordsToInsert);

  const populatedResults = await LearningResult.find({
    _id: { $in: createdResults.map(c => c._id) }
  })
    .populate('student', 'studentCode fullName phone email')
    .populate('enteredBy', 'fullName name email');

  return populatedResults;
};

/**
 * PUT /api/results/:id (Chỉnh sửa điểm số hoặc nhận xét)
 */
const updateResultService = async (resultId, payload, requestingUser) => {
  if (!mongoose.Types.ObjectId.isValid(resultId)) {
    const error = new Error('ID kết quả kiểm tra không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const resultDoc = await LearningResult.findById(resultId)
    .populate('class', 'teacher');

  if (!resultDoc) {
    const error = new Error('Không tìm thấy kết quả kiểm tra');
    error.statusCode = 404;
    throw error;
  }

  // Phân quyền
  if (requestingUser.role === 'Receptionist') {
    const error = new Error('Nhân viên lễ tân chỉ có quyền xem, không được cập nhật điểm số');
    error.statusCode = 403;
    throw error;
  }

  if (requestingUser.role === 'Student') {
    const error = new Error('Học viên không có quyền chỉnh sửa điểm số');
    error.statusCode = 403;
    throw error;
  }

  if (requestingUser.role === 'Teacher') {
    const teacherProfile = await Teacher.findOne({ userId: requestingUser._id });
    if (!teacherProfile || resultDoc.class?.teacher?.toString() !== teacherProfile._id.toString()) {
      const error = new Error('Bạn chỉ được chỉnh sửa điểm của học viên thuộc lớp do mình giảng dạy');
      error.statusCode = 403;
      throw error;
    }
  }

  // Update scores if provided
  if (payload.listeningScore !== undefined) {
    resultDoc.listeningScore = validateScoreValue(payload.listeningScore, 'Điểm Nghe');
  }
  if (payload.speakingScore !== undefined) {
    resultDoc.speakingScore = validateScoreValue(payload.speakingScore, 'Điểm Nói');
  }
  if (payload.readingScore !== undefined) {
    resultDoc.readingScore = validateScoreValue(payload.readingScore, 'Điểm Đọc');
  }
  if (payload.writingScore !== undefined) {
    resultDoc.writingScore = validateScoreValue(payload.writingScore, 'Điểm Viết');
  }

  if (payload.teacherComment !== undefined) {
    resultDoc.teacherComment = payload.teacherComment.trim();
  }

  if (payload.testType !== undefined) {
    if (!VALID_TEST_TYPES.includes(payload.testType)) {
      const error = new Error('testType không hợp lệ');
      error.statusCode = 422;
      throw error;
    }
    resultDoc.testType = payload.testType;
  }

  if (payload.testDate !== undefined) {
    const { targetDate } = getDateRange(payload.testDate);
    resultDoc.testDate = targetDate;
  }

  // Recalculate overallScore server-side
  resultDoc.overallScore = calculateOverallScore(
    resultDoc.listeningScore,
    resultDoc.speakingScore,
    resultDoc.readingScore,
    resultDoc.writingScore
  );

  resultDoc.enteredBy = requestingUser._id;
  await resultDoc.save();

  const populated = await LearningResult.findById(resultId)
    .populate('student', 'studentCode fullName phone email')
    .populate('class', 'classCode className skill')
    .populate('enteredBy', 'fullName name email');

  return populated;
};

/**
 * Lấy danh sách kết quả học tập của 1 học viên
 */
const getStudentResultsService = async (studentId) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    const error = new Error('studentId không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(studentId);
  if (!student) {
    const error = new Error('Không tìm thấy học viên');
    error.statusCode = 404;
    throw error;
  }

  const records = await LearningResult.find({ student: studentId })
    .populate('class', 'classCode className skill status')
    .populate('enteredBy', 'fullName name email')
    .sort({ testDate: -1, createdAt: -1 });

  return {
    student: {
      _id: student._id,
      studentCode: student.studentCode,
      fullName: student.fullName
    },
    results: records
  };
};

module.exports = {
  calculateOverallScore,
  validateScoreValue,
  getClassResultsService,
  createClassResultsService,
  updateResultService,
  getStudentResultsService
};
