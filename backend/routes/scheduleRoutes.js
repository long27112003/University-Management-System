const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getSchedules,
  updateSchedule,
  deleteSchedule
} = require('../controllers/scheduleController');

router.use(protect);

router.get('/', getSchedules);
router.put('/:id', adminOnly, updateSchedule);
router.delete('/:id', adminOnly, deleteSchedule);

module.exports = router;
