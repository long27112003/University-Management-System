const express = require('express');
const router = express.Router();
const { protect, adminOnly, staffOnly, teacherOnly } = require('../middleware/authMiddleware');
const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  updateTeacherStatus,
  getMyTeacherProfile,
  getMyClasses,
  getMySchedule
} = require('../controllers/teacherController');

const { getTeacherDashboard } = require('../controllers/dashboardController');

router.use(protect);

// Self routes for Teacher
router.get('/dashboard', teacherOnly, getTeacherDashboard);
router.get('/me', teacherOnly, getMyTeacherProfile);
router.get('/me/classes', teacherOnly, getMyClasses);
router.get('/me/schedule', teacherOnly, getMySchedule);

// Resource routes for Teachers
router.route('/')
  .get(staffOnly, getTeachers)
  .post(adminOnly, createTeacher);

router.route('/:id')
  .get(staffOnly, getTeacherById)
  .put(adminOnly, updateTeacher);

router.patch('/:id/status', adminOnly, updateTeacherStatus);

module.exports = router;
