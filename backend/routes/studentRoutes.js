const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getStudentDashboard } = require('../controllers/dashboardController');
const {
  updateProfile,
  getNotices,
  getMySchedule,
} = require('../controllers/studentController');
const { getMyAttendance } = require('../controllers/attendanceController');
const { getMyResults } = require('../controllers/learningResultController');
const { getStudentSelfInvoices, getStudentSelfPayments } = require('../controllers/tuitionController');

router.use(protect);
const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Student') next();
  else res.status(403).json({ message: 'Not authorized as a student' });
};
router.use(studentOnly);

router.get('/dashboard', getStudentDashboard);
router.put('/profile', updateProfile);
router.get('/notices', getNotices);

// Attendance APIs for student
router.get('/me/attendance', getMyAttendance);
router.get('/attendance', getMyAttendance);

// Learning Results APIs for student
router.get('/me/results', getMyResults);
router.get('/results', getMyResults);

// Tuition and Payment APIs for student
router.get('/me/invoices', getStudentSelfInvoices);
router.get('/invoices', getStudentSelfInvoices);
router.get('/me/payments', getStudentSelfPayments);
router.get('/payments', getStudentSelfPayments);

// Schedule APIs for student
router.get('/schedule', getMySchedule);
router.get('/me/schedule', getMySchedule);

module.exports = router;
