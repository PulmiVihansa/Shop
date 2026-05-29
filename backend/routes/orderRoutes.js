const express = require('express');
const { createOrder, getUserOrders, getAllOrders, updateOrderStatus, updateOrderPaymentStatus } = require('../controllers/orderController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, createOrder);
router.get('/user', authMiddleware, getUserOrders);
router.get('/', authMiddleware, adminMiddleware, getAllOrders);
router.put('/:id/status', authMiddleware, adminMiddleware, updateOrderStatus);
router.put('/:id/payment-status', authMiddleware, adminMiddleware, updateOrderPaymentStatus);

module.exports = router;
