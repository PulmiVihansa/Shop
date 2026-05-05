const Order = require('../models/Order');
const { store } = require('../data/memoryStore');

const notifyPayment = async (req, res) => {
  try {
    const orderId = req.body.order_id || req.body.orderId;
    const transactionId = req.body.payment_id || req.body.transactionId || `SIM-${Date.now()}`;
    const statusCode = String(req.body.status_code || '2');
    const isPaid = statusCode === '2' || req.body.status === 'PAID';

    if (global.useMemoryStore) {
      const order = store.orders.find((entry) => entry._id === orderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      order.paymentStatus = isPaid ? 'PAID' : 'PENDING';
      order.transactionId = transactionId;
      order.payment = {
        ...(order.payment || {}),
        status: isPaid ? 'paid' : 'pending',
        reference: transactionId,
        paidAt: isPaid ? new Date() : undefined
      };
      return res.json({ message: 'Payment notification processed' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = isPaid ? 'PAID' : 'PENDING';
    order.transactionId = transactionId;
    order.payment.status = isPaid ? 'paid' : 'pending';
    order.payment.reference = transactionId;
    order.payment.paidAt = isPaid ? new Date() : undefined;
    await order.save();

    res.json({ message: 'Payment notification processed' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to process payment notification', error: error.message });
  }
};

module.exports = { notifyPayment };
