const express = require('express');
const router = express.Router();
const { protect, hasRole } = require('../middleware/authMiddleware');
const {
  getPaymentById,
  voidPayment,
} = require('../controllers/tuitionController');

// All payment routes require authentication
router.use(protect);

// GET /api/payments/:id (Admin, Receptionist)
router.get('/:id', hasRole('Admin', 'Receptionist'), getPaymentById);

// POST /api/payments/:id/void (ADMIN ONLY - Receptionist/Teacher/Student 403 Forbidden)
router.post('/:id/void', hasRole('Admin'), voidPayment);

module.exports = router;
