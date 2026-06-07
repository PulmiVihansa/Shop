const express = require('express');
const {
  downloadVoucherPdf,
  emailVoucher,
} = require('../controllers/giftVoucherController');

const router = express.Router();

router.post('/download', downloadVoucherPdf);
router.post('/email', emailVoucher);

module.exports = router;
