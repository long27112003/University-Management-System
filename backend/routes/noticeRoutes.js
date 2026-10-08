const express = require('express');
const router = express.Router();
const { protect, adminOnly, hasRole } = require('../middleware/authMiddleware');
const {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');

router.use(protect);

router
  .route('/')
  .get(getNotices)
  .post(hasRole('Admin', 'Receptionist'), createNotice);

router
  .route('/:id')
  .put(hasRole('Admin', 'Receptionist'), updateNotice)
  .delete(adminOnly, deleteNotice);

module.exports = router;
