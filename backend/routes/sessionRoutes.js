const express = require('express');
const router = express.Router();
const { protect, adminOnly, hasRole } = require('../middleware/authMiddleware');
const {
  getSessionById,
  updateSessionStatus,
  updateSession
} = require('../controllers/sessionController');
const {
  getSessionAttendance,
  bulkUpdateSessionAttendance
} = require('../controllers/attendanceController');

router.use(protect);

// Session Details & Management
router.get('/:id', getSessionById);
router.patch('/:id/status', hasRole('Admin', 'Teacher'), updateSessionStatus);
router.put('/:id', adminOnly, updateSession);

// Session Attendance APIs
router.get('/:sessionId/attendance', hasRole('Admin', 'Receptionist', 'Teacher'), getSessionAttendance);
router.put('/:sessionId/attendance', hasRole('Admin', 'Teacher'), bulkUpdateSessionAttendance);

module.exports = router;
