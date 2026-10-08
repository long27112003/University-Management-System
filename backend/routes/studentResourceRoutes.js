const express = require('express');
const router = express.Router();
const { protect, staffOnly, hasRole } = require('../middleware/authMiddleware');
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateStudentStatus,
  getStudentEnrollments,
  getStudentAttendance,
  getStudentResults,
  getStudentInvoices,
  getStudentPayments
} = require('../controllers/studentResourceController');

router.use(protect);

router.route('/')
  .get(staffOnly, getStudents)
  .post(staffOnly, createStudent);

router.route('/:id')
  .get(getStudentById)
  .put(staffOnly, updateStudent);

router.patch('/:id/status', staffOnly, updateStudentStatus);

// Sub-endpoints for hybrid tabbed detail
router.get('/:id/enrollments', staffOnly, getStudentEnrollments);
router.get('/:id/attendance', hasRole('Admin', 'Receptionist', 'Teacher'), getStudentAttendance);
router.get('/:id/results', hasRole('Admin', 'Receptionist', 'Teacher'), getStudentResults);
router.get('/:id/invoices', staffOnly, getStudentInvoices);
router.get('/:id/payments', staffOnly, getStudentPayments);

module.exports = router;
