const express = require('express');
const router = express.Router();
const { protect, staffOnly } = require('../middleware/authMiddleware');
const {
  transferEnrollment,
  dropEnrollment
} = require('../controllers/enrollmentController');

router.use(protect);

// Action endpoints on Enrollments
router.post('/:id/transfer', staffOnly, transferEnrollment);
router.post('/:id/drop', staffOnly, dropEnrollment);

module.exports = router;
