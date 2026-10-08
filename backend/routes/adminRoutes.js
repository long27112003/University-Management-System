const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getAdminDashboard } = require('../controllers/dashboardController');
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getNotices,
  createNotice,
  deleteNotice,
} = require('../controllers/adminController');

router.use(protect, adminOnly);

// Admin Dashboard
router.get('/dashboard', getAdminDashboard);

// User Management (Admin profile / legacy compatibility)
router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

// Notices
router.route('/notices')
  .get(getNotices)
  .post(createNotice);

router.route('/notices/:id')
  .delete(deleteNotice);

module.exports = router;
