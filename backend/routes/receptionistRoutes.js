const express = require('express');
const router = express.Router();
const { protect, receptionistOnly } = require('../middleware/authMiddleware');
const { getReceptionistDashboard } = require('../controllers/dashboardController');

// All routes under /api/receptionist require authentication and Receptionist role
router.use(protect, receptionistOnly);

router.get('/dashboard', getReceptionistDashboard);

module.exports = router;
