const express = require('express');
const router = express.Router();
const { protect, hasRole } = require('../middleware/authMiddleware');
const {
  getInvoices,
  getInvoiceById,
  createManualInvoice,
  updateInvoice,
  createPayment,
  getInvoicePayments,
} = require('../controllers/tuitionController');

// All tuition invoice routes require Admin or Receptionist (Teacher & Student forbidden)
router.use(protect, hasRole('Admin', 'Receptionist'));

router.route('/')
  .get(getInvoices)
  .post(createManualInvoice);

router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice);

router.route('/:invoiceId/payments')
  .get(getInvoicePayments)
  .post(createPayment);

module.exports = router;
