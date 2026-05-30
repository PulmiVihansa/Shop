const prisma = require('../config/prisma');
const { store } = require('../data/memoryStore');

const notifyPayment = async (req, res) => {
  try {
    const orderId = req.body.order_id || req.body.orderId;
    const transactionId = req.body.payment_id || req.body.transactionId || `SIM-${Date.now()}`;
    const statusCode = String(req.body.status_code || '2');
    const isPaid = statusCode === '2' || req.body.status === 'PAID';

    if (global.useMemoryStore) {
      const order = store.orders.find((entry) => entry._id === orderId || entry.orderId === orderId);
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

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderId }]
      }
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: isPaid ? 'PAID' : 'PENDING',
        transactionId,
        payment: {
          ...(order.payment || {}),
          status: isPaid ? 'paid' : 'pending',
          reference: transactionId,
          paidAt: isPaid ? new Date() : undefined
        }
      }
    });

    res.json({ message: 'Payment notification processed' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to process payment notification', error: error.message });
  }
};

module.exports = { notifyPayment };
