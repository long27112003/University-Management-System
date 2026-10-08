const express = require('express');
const router = express.Router();
const { protect, hasRole, adminOnly, staffOnly } = require('../middleware/authMiddleware');
const {
  getClasses,
  createClass,
  getClassById,
  updateClass,
  updateClassStatus
} = require('../controllers/classController');
const {
  enrollStudent,
  getClassEnrollments
} = require('../controllers/enrollmentController');
const {
  getClassSchedules,
  createClassSchedule
} = require('../controllers/scheduleController');
const {
  getClassSessions,
  generateSessions
} = require('../controllers/sessionController');
const {
  getClassResults,
  createClassResults
} = require('../controllers/learningResultController');
const {
  getClassMaterials,
  uploadClassMaterial
} = require('../controllers/materialController');
const handleMaterialUpload = require('../middleware/materialUploadMiddleware');

router.use(protect);

// Base Class APIs
router.get('/', getClasses);
router.post('/', adminOnly, createClass);
router.get('/:id', getClassById);
router.put('/:id', adminOnly, updateClass);
router.patch('/:id/status', adminOnly, updateClassStatus);

// Nested Enrollment APIs on Class
router.post('/:classId/enrollments', staffOnly, enrollStudent);
router.get(
  '/:classId/enrollments',
  hasRole('Admin', 'Receptionist', 'Teacher'),
  getClassEnrollments
);

// Nested Schedule APIs on Class
router.get('/:classId/schedules', getClassSchedules);
router.post('/:classId/schedules', adminOnly, createClassSchedule);

// Nested Session APIs on Class
router.get('/:classId/sessions', getClassSessions);
router.post('/:classId/sessions/generate', adminOnly, generateSessions);

// Nested Learning Results APIs on Class
router.get(
  '/:classId/results',
  hasRole('Admin', 'Receptionist', 'Teacher'),
  getClassResults
);
router.post(
  '/:classId/results',
  hasRole('Admin', 'Teacher'),
  createClassResults
);

// Nested Study Materials APIs on Class (Phase 9)
router.get('/:classId/materials', getClassMaterials);
router.post('/:classId/materials', handleMaterialUpload, uploadClassMaterial);

module.exports = router;
