const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  updateAccountStatus,
  updateAccountRole
} = require('../controllers/accountController');

router.use(protect, adminOnly);

router.route('/')
  .get(getAccounts)
  .post(createAccount);

router.route('/:id')
  .get(getAccountById)
  .put(updateAccount);

router.patch('/:id/status', updateAccountStatus);
router.patch('/:id/role', updateAccountRole);

module.exports = router;
