const express = require('express');
const {
  createPayHerePayment,
  handlePayHereNotify,
  payHereSuccess,
  payHereCancel,
  getPaymentOrder,
} = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', authMiddleware, createPayHerePayment);
router.post('/payhere/notify', handlePayHereNotify);
router.get('/payhere/success', payHereSuccess);
router.get('/payhere/cancel', payHereCancel);
router.get('/order/:orderId', authMiddleware, getPaymentOrder);

router.post('/notify', handlePayHereNotify);

module.exports = router;
