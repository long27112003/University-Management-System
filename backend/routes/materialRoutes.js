const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { deleteMaterial } = require('../controllers/materialController');

router.use(protect);

router.delete('/:id', deleteMaterial);

module.exports = router;
