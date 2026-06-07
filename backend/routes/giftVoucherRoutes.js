const express = require('express');
const {
  downloadVoucherPdf,
  emailVoucher,
  getVoucherByOrder,
  getAdminGiftVoucherSales,
} = require('../controllers/giftVoucherController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/admin/sales', authMiddleware, adminMiddleware, getAdminGiftVoucherSales);
router.get('/order/:orderId', authMiddleware, getVoucherByOrder);
router.get('/:id/download', authMiddleware, downloadVoucherPdf);
router.post('/:id/email', authMiddleware, emailVoucher);
router.post('/download', authMiddleware, downloadVoucherPdf);
router.post('/email', authMiddleware, emailVoucher);

module.exports = router;
