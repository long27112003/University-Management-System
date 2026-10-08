const express = require('express');
const router = express.Router();
const { protect, hasRole } = require('../middleware/authMiddleware');
const { updateResult } = require('../controllers/learningResultController');

router.use(protect);

// PUT /api/results/:id
router.put('/:id', hasRole('Admin', 'Teacher'), updateResult);

module.exports = router;
