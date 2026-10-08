const mongoose = require('mongoose');
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

/**
 * Vietnam Timezone (UTC+7) Date Helpers
 */
const getVietnamTodayRange = () => {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const y = vnTime.getUTCFullYear();
  const m = vnTime.getUTCMonth();
  const d = vnTime.getUTCDate();

  const start = new Date(Date.UTC(y, m, d, 0, 0, 0) - 7 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - 7 * 60 * 60 * 1000);
  return { start, end };
};

const getVietnamMonthRange = () => {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const y = vnTime.getUTCFullYear();
  const m = vnTime.getUTCMonth();

  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0) - 7 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999) - 7 * 60 * 60 * 1000);
  return { start, end };
};

const getVietnamPastMonthsStart = (monthsCount = 6) => {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const y = vnTime.getUTCFullYear();
  const m = vnTime.getUTCMonth() - (monthsCount - 1);
  return new Date(Date.UTC(y, m, 1, 0, 0, 0) - 7 * 60 * 60 * 1000);
};

/**
 * 1. ADMIN DASHBOARD SERVICE
 */
const getAdminDashboardData = async () => {
  const { start: startToday, end: endToday } = getVietnamTodayRange();
  const { start: startMonth, end: endMonth } = getVietnamMonthRange();
  const sixMonthsAgo = getVietnamPastMonthsStart(6);

  const [
    totalStudents,
    activeStudents,
    totalTeachers,
    activeClasses,
    todaySessions,
    tuitionAgg,
    paidTuitionAgg,
    recentStudents,
    recentPayments,
    monthlyStudentGrowthRaw,
    monthlyTuitionSummaryRaw,
    attendanceAgg,
  ] = await Promise.all([
    // Student metrics
    Student.countDocuments(),
    Student.countDocuments({ academicStatus: 'active' }),

    // Teacher metrics
    Teacher.countDocuments(),

    // Class metrics
    Class.countDocuments({ status: 'active' }),

    // Today's sessions
    ClassSession.find({
      sessionDate: { $gte: startToday, $lte: endToday },
      status: { $ne: 'cancelled' },
    })
      .populate('class', 'className classCode skill room')
      .populate('teacher', 'fullName teacherCode phone')
      .sort('startTime')
      .lean(),

    // Tuition invoices aggregate (total and remaining)
    TuitionInvoice.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalTuition: { $sum: '$totalAmount' },
          outstandingTuition: { $sum: '$remainingAmount' },
        },
      },
    ]),

    // Paid tuition from completed payments
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, paidTuition: { $sum: '$amount' } } },
    ]),

    // Recent 5 students
    Student.find()
      .select('fullName studentCode phone email academicStatus createdAt')
      .sort('-createdAt')
      .limit(5)
      .lean(),

    // Recent 5 completed payments
    Payment.find({ status: 'completed' })
      .select('paymentCode amount paymentDate paymentMethod student invoice createdAt')
      .populate('student', 'fullName studentCode')
      .populate('invoice', 'invoiceCode')
      .sort('-paymentDate -createdAt')
      .limit(5)
      .lean(),

    // Monthly student growth (last 6 months)
    Student.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: { $add: ['$createdAt', 7 * 60 * 60 * 1000] },
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Monthly tuition collection (last 6 months completed payments)
    Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paymentDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: { $add: ['$paymentDate', 7 * 60 * 60 * 1000] },
            },
          },
          collectedAmount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Attendance overview for current month
    Attendance.aggregate([
      {
        $match: {
          $or: [
            { markedAt: { $gte: startMonth, $lte: endMonth } },
            { createdAt: { $gte: startMonth, $lte: endMonth } },
          ],
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const totalTuition = tuitionAgg[0]?.totalTuition || 0;
  const paidTuition = paidTuitionAgg[0]?.paidTuition || 0;
  const outstandingTuition = tuitionAgg[0]?.outstandingTuition || 0;

  // Format today's class list
  const todayClassList = todaySessions.map((s) => ({
    sessionId: s._id,
    classId: s.class?._id,
    classCode: s.class?.classCode || 'N/A',
    className: s.class?.className || 'N/A',
    skill: s.class?.skill || 'N/A',
    teacher: s.teacher?.fullName || 'Chưa phân công',
    room: s.room || s.class?.room || '—',
    startTime: s.startTime,
    endTime: s.endTime,
    status: s.status,
    attendanceStatus: s.attendanceStatus || (s.status === 'completed' ? 'completed' : 'pending'),
  }));

  // Format attendance overview
  const attendanceOverview = {
    Present: 0,
    Absent: 0,
    Late: 0,
    Excused: 0,
  };
  attendanceAgg.forEach((item) => {
    if (item._id && attendanceOverview[item._id] !== undefined) {
      attendanceOverview[item._id] = item.count;
    }
  });

  const totalMonthAtt = Object.values(attendanceOverview).reduce((a, b) => a + b, 0);
  if (totalMonthAtt === 0) {
    const allTimeAtt = await Attendance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    allTimeAtt.forEach((item) => {
      if (item._id && attendanceOverview[item._id] !== undefined) {
        attendanceOverview[item._id] = item.count;
      }
    });
  }

  // Format monthly student growth
  const monthlyStudentGrowth = monthlyStudentGrowthRaw.map((item) => ({
    month: item._id,
    count: item.count,
  }));

  // Format monthly tuition summary
  const monthlyTuitionSummary = monthlyTuitionSummaryRaw.map((item) => ({
    month: item._id,
    collectedAmount: item.collectedAmount,
  }));

  return {
    totalStudents,
    activeStudents,
    totalTeachers,
    activeClasses,
    todayClasses: todaySessions.length,
    totalTuition,
    paidTuition,
    outstandingTuition,
    todayClassList,
    recentStudents,
    recentPayments,
    monthlyStudentGrowth,
    monthlyTuitionSummary,
    attendanceOverview,
  };
};

/**
 * 2. RECEPTIONIST DASHBOARD SERVICE
 */
const getReceptionistDashboardData = async () => {
  const { start: startToday, end: endToday } = getVietnamTodayRange();
  const { start: startMonth, end: endMonth } = getVietnamMonthRange();
  const in14Days = new Date(endToday.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [
    newStudentsThisMonth,
    recentStudents,
    upcomingClassesDocs,
    outstandingAgg,
    overdueInvoicesCount,
    todayCollectedAgg,
    todaySessions,
    reminderInvoicesDocs,
    recentPayments,
  ] = await Promise.all([
    // New students created this month
    Student.countDocuments({ createdAt: { $gte: startMonth, $lte: endMonth } }),

    // Recent 5 students
    Student.find()
      .select('studentCode fullName phone academicStatus createdAt')
      .sort('-createdAt')
      .limit(5)
      .lean(),

    // Upcoming classes in next 14 days
    Class.find({
      status: 'upcoming',
      startDate: { $gte: startToday, $lte: in14Days },
    })
      .populate('teacher', 'fullName phone')
      .select('classCode className skill startDate maxCapacity currentEnrollment teacher tuitionFee')
      .sort('startDate')
      .limit(10)
      .lean(),

    // Total outstanding amount
    TuitionInvoice.aggregate([
      { $match: { status: { $ne: 'cancelled' }, remainingAmount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } },
    ]),

    // Overdue invoices count
    TuitionInvoice.countDocuments({
      status: { $ne: 'cancelled' },
      remainingAmount: { $gt: 0 },
      dueDate: { $lt: new Date() },
    }),

    // Today collected payments
    Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paymentDate: { $gte: startToday, $lte: endToday },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    // Today's classes for reception guidance
    ClassSession.find({
      sessionDate: { $gte: startToday, $lte: endToday },
      status: { $ne: 'cancelled' },
    })
      .populate('class', 'className classCode skill room')
      .populate('teacher', 'fullName phone')
      .sort('startTime')
      .lean(),

    // Students needing payment reminder (overdue or nearest due date, remaining > 0)
    TuitionInvoice.find({
      status: { $ne: 'cancelled' },
      remainingAmount: { $gt: 0 },
    })
      .populate('student', 'fullName studentCode phone')
      .populate('class', 'className classCode')
      .sort({ dueDate: 1, remainingAmount: -1 })
      .limit(10)
      .lean(),

    // Recent 5 payments recorded
    Payment.find({ status: 'completed' })
      .populate('student', 'fullName studentCode')
      .populate('invoice', 'invoiceCode')
      .sort('-paymentDate -createdAt')
      .limit(5)
      .lean(),
  ]);

  const upcomingClasses = upcomingClassesDocs.map((c) => ({
    classId: c._id,
    classCode: c.classCode,
    className: c.className,
    skill: c.skill,
    startDate: c.startDate,
    enrolledCount: c.currentEnrollment || 0,
    maxCapacity: c.maxCapacity,
    teacher: c.teacher?.fullName || 'Chưa phân công',
  }));

  const studentsNeedingPaymentReminder = reminderInvoicesDocs.map((inv) => ({
    _id: inv._id,
    invoiceId: inv._id,
    invoiceCode: inv.invoiceCode,
    student: inv.student
      ? {
          _id: inv.student._id,
          fullName: inv.student.fullName,
          studentCode: inv.student.studentCode,
          phone: inv.student.phone,
        }
      : null,
    class: inv.class
      ? {
          _id: inv.class._id,
          className: inv.class.className,
          classCode: inv.class.classCode,
        }
      : null,
    remainingAmount: inv.remainingAmount,
    dueDate: inv.dueDate,
    status: inv.dueDate && new Date(inv.dueDate) < new Date() ? 'overdue' : inv.status,
  }));

  const todayClasses = todaySessions.map((s) => ({
    sessionId: s._id,
    classId: s.class?._id,
    classCode: s.class?.classCode || 'N/A',
    className: s.class?.className || 'N/A',
    skill: s.class?.skill || 'N/A',
    teacher: s.teacher?.fullName || 'Chưa phân công',
    room: s.room || s.class?.room || '—',
    startTime: s.startTime,
    endTime: s.endTime,
    status: s.status,
  }));

  return {
    newStudentsThisMonth,
    recentStudents,
    upcomingClasses,
    outstandingTuition: outstandingAgg[0]?.total || 0,
    overdueInvoicesCount,
    todayCollectedAmount: todayCollectedAgg[0]?.total || 0,
    todayClasses,
    studentsNeedingPaymentReminder,
    recentPayments,
  };
};

/**
 * 3. TEACHER DASHBOARD SERVICE
 */
const getTeacherDashboardData = async (userId) => {
  const teacher = await Teacher.findOne({ userId });
  if (!teacher) {
    const err = new Error('Không tìm thấy hồ sơ giáo viên');
    err.statusCode = 404;
    throw err;
  }

  const { start: startToday, end: endToday } = getVietnamTodayRange();

  // Find classes assigned to this teacher
  const assignedClasses = await Class.find({
    teacher: teacher._id,
    status: { $in: ['active', 'upcoming'] },
  })
    .select('className classCode skill status maxCapacity currentEnrollment room startDate endDate')
    .lean();

  const assignedClassIds = assignedClasses.map((c) => c._id);

  const [todaySessions, upcomingSessions, teacherSessionsCount, markedSessionsCount, attendanceRecords] =
    await Promise.all([
      // Today sessions
      ClassSession.find({
        $or: [{ teacher: teacher._id }, { class: { $in: assignedClassIds } }],
        sessionDate: { $gte: startToday, $lte: endToday },
        status: { $ne: 'cancelled' },
      })
        .populate('class', 'className classCode skill room')
        .sort('startTime')
        .lean(),

      // Upcoming 5 sessions
      ClassSession.find({
        $or: [{ teacher: teacher._id }, { class: { $in: assignedClassIds } }],
        sessionDate: { $gt: endToday },
        status: { $ne: 'cancelled' },
      })
        .populate('class', 'className classCode skill room')
        .sort('sessionDate startTime')
        .limit(5)
        .lean(),

      // Total sessions conducted by this teacher
      ClassSession.countDocuments({
        $or: [{ teacher: teacher._id }, { class: { $in: assignedClassIds } }],
        status: { $in: ['completed', 'scheduled'] },
      }),

      // Marked attendance sessions
      ClassSession.countDocuments({
        $or: [{ teacher: teacher._id }, { class: { $in: assignedClassIds } }],
        attendanceStatus: 'completed',
      }),

      // Attendance records for sessions taught by this teacher
      Attendance.find({
        class: { $in: assignedClassIds },
      })
        .select('status')
        .lean(),
    ]);

  const todaySchedule = todaySessions.map((s) => ({
    sessionId: s._id,
    classId: s.class?._id,
    classCode: s.class?.classCode || 'N/A',
    className: s.class?.className || 'N/A',
    skill: s.class?.skill || 'N/A',
    startTime: s.startTime,
    endTime: s.endTime,
    room: s.room || s.class?.room || '—',
    status: s.status,
    attendanceStatus: s.attendanceStatus || (s.status === 'completed' ? 'completed' : 'pending'),
  }));

  const totalAttendanceRecords = attendanceRecords.length;
  const presentOrLate = attendanceRecords.filter(
    (a) => a.status === 'Present' || a.status === 'Late'
  ).length;
  const averageAttendanceRate =
    totalAttendanceRecords > 0
      ? Number(((presentOrLate / totalAttendanceRecords) * 100).toFixed(1))
      : 100;

  const totalStudentsTaught = assignedClasses.reduce(
    (sum, c) => sum + (c.currentEnrollment || 0),
    0
  );

  return {
    assignedClassesCount: assignedClasses.length,
    totalStudentsTaught,
    assignedClasses,
    todaySchedule,
    upcomingSessions: upcomingSessions.map((s) => ({
      sessionId: s._id,
      sessionDate: s.sessionDate,
      classCode: s.class?.classCode,
      className: s.class?.className,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room || s.class?.room,
    })),
    attendanceSummary: {
      totalSessions: teacherSessionsCount,
      markedSessions: markedSessionsCount,
      averageAttendanceRate,
    },
  };
};

/**
 * 4. STUDENT DASHBOARD SERVICE
 */
const getStudentDashboardData = async (userId) => {
  const student = await Student.findOne({ userId });
  if (!student) {
    const err = new Error('Không tìm thấy hồ sơ học viên');
    err.statusCode = 404;
    throw err;
  }

  // Active enrollments
  const activeEnrollments = await Enrollment.find({
    student: student._id,
    status: 'active',
  })
    .populate({
      path: 'class',
      populate: { path: 'teacher', select: 'fullName phone email' },
    })
    .lean();

  const activeClasses = activeEnrollments
    .filter((e) => e.class)
    .map((e) => ({
      enrollmentId: e._id,
      classId: e.class._id,
      classCode: e.class.classCode,
      className: e.class.className,
      skill: e.class.skill,
      room: e.class.room,
      teacher: e.class.teacher?.fullName || 'Chưa phân công',
      status: e.class.status,
      startDate: e.class.startDate,
      endDate: e.class.endDate,
    }));

  const activeClassIds = activeClasses.map((c) => c.classId);

  const [schedules, attendanceDocs, latestResultsDocs, invoicesDocs] = await Promise.all([
    // Weekly schedules for student's active classes
    Schedule.find({ class: { $in: activeClassIds } })
      .populate('class', 'className classCode skill')
      .populate('teacher', 'fullName')
      .sort('dayOfWeek startTime')
      .lean(),

    // Attendance records (Phase 5 convention)
    Attendance.find({ student: student._id }).select('status markedAt createdAt').lean(),

    // Latest 3 test results (Phase 6 convention)
    LearningResult.find({ student: student._id })
      .populate('class', 'className classCode skill')
      .sort('-testDate -createdAt')
      .limit(3)
      .lean(),

    // Tuition invoices (Phase 7 convention)
    TuitionInvoice.find({
      student: student._id,
      status: { $ne: 'cancelled' },
    })
      .populate('class', 'className classCode')
      .sort('-createdAt')
      .lean(),
  ]);

  // Format attendance summary exactly matching Phase 5
  const totalAttendance = attendanceDocs.length;
  const presentCount = attendanceDocs.filter((a) => a.status === 'Present').length;
  const absentCount = attendanceDocs.filter((a) => a.status === 'Absent').length;
  const lateCount = attendanceDocs.filter((a) => a.status === 'Late').length;
  const excusedCount = attendanceDocs.filter((a) => a.status === 'Excused').length;
  const attendanceRate =
    totalAttendance > 0
      ? Number((((presentCount + lateCount) / totalAttendance) * 100).toFixed(1))
      : 100;

  const attendanceSummary = {
    attendanceRate,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    totalSessions: totalAttendance,
  };

  // Format weekly schedule
  const weeklySchedule = schedules.map((sc) => ({
    scheduleId: sc._id,
    className: sc.class?.className || 'N/A',
    classCode: sc.class?.classCode || 'N/A',
    skill: sc.class?.skill || 'N/A',
    dayOfWeek: sc.dayOfWeek,
    startTime: sc.startTime,
    endTime: sc.endTime,
    room: sc.room,
    teacher: sc.teacher?.fullName || 'Giáo viên',
  }));

  // Format latest results
  const latestResults = latestResultsDocs.map((r) => ({
    resultId: r._id,
    class: r.class ? { className: r.class.className, classCode: r.class.classCode } : null,
    testType: r.testType,
    testDate: r.testDate,
    listeningScore: r.listeningScore,
    speakingScore: r.speakingScore,
    readingScore: r.readingScore,
    writingScore: r.writingScore,
    overallScore: r.overallScore,
    teacherComment: r.teacherComment,
  }));

  // Format tuition summary
  const totalOutstanding = invoicesDocs.reduce(
    (sum, inv) => sum + (inv.remainingAmount || 0),
    0
  );
  const unpaidInvoiceCount = invoicesDocs.filter(
    (inv) => inv.remainingAmount > 0 && inv.paidAmount === 0
  ).length;
  const partialInvoiceCount = invoicesDocs.filter(
    (inv) => inv.remainingAmount > 0 && inv.paidAmount > 0
  ).length;

  const tuitionSummary = {
    totalOutstanding,
    unpaidInvoiceCount,
    partialInvoiceCount,
    latestInvoices: invoicesDocs.slice(0, 3).map((inv) => ({
      invoiceId: inv._id,
      invoiceCode: inv.invoiceCode,
      className: inv.class?.className,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      remainingAmount: inv.remainingAmount,
      dueDate: inv.dueDate,
      status: inv.status,
    })),
  };

  return {
    activeClassesCount: activeClasses.length,
    activeClasses,
    weeklySchedule,
    attendanceSummary,
    latestResults,
    tuitionSummary,
  };
};

module.exports = {
  getVietnamTodayRange,
  getVietnamMonthRange,
  getVietnamPastMonthsStart,
  getAdminDashboardData,
  getReceptionistDashboardData,
  getTeacherDashboardData,
  getStudentDashboardData,
};
