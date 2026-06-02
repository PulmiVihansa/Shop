const prisma = require('../config/prisma');
const { store } = require('../data/memoryStore');
const { createTransactionAndInvoice } = require('../services/orderDocumentService');
const { generateInvoiceForOrder } = require('../services/invoiceService');

const notifyPayment = async (req, res) => {
  try {
    const orderId = req.body.order_id || req.body.orderId;
    const providerReference = req.body.payment_id || req.body.transactionId || '';
    const statusCode = String(req.body.status_code || '2');
    const isPaid = statusCode === '2' || req.body.status === 'PAID';

    if (global.useMemoryStore) {
      const order = store.orders.find((entry) => entry._id === orderId || entry.orderId === orderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      order.paymentStatus = isPaid ? 'PAID' : 'PENDING';
      order.payment = {
        ...(order.payment || {}),
        status: isPaid ? 'paid' : 'pending',
        reference: order.transactionId || providerReference,
        paidAt: isPaid ? new Date() : undefined
      };
      if (isPaid && !order.transactionId) {
        store.transactions = store.transactions || [];
        store.invoices = store.invoices || [];
        order.transactionId = `TXN-${1001 + store.transactions.length}`;
        store.transactions.unshift({
          _id: `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 14)}`,
          transactionId: order.transactionId,
          orderId: order._id,
          orderReference: order.orderId,
          customerId: order.customerId,
          customer: order.customerName,
          amount: order.totalAmount,
          paymentMethod: order.paymentMethod || 'ONLINE',
          paymentStatus: 'PAID',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        store.invoices.unshift({
          _id: `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 14)}`,
          invoiceId: `INV-${new Date().getFullYear()}-${String(1001 + store.invoices.length).padStart(4, '0')}`,
          orderId: order._id,
          orderReference: order.orderId,
          transactionId: order.transactionId,
          customerId: order.customerId,
          customer: order.customerName,
          email: order.customerEmail,
          subtotal: order.price,
          shipping: order.shippingCost,
          tax: 0,
          grandTotal: order.totalAmount,
          status: 'Paid',
          products: order.items || [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      if (isPaid) {
        await generateInvoiceForOrder(order._id, { paymentStatus: 'PAID', sendEmail: false }).catch((invoiceError) => {
          console.warn('[invoice] automatic generation failed', invoiceError.message);
        });
      }
      return res.json({ message: 'Payment notification processed' });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderId }]
      }
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (isPaid) {
      await prisma.$transaction(async (tx) => {
        await createTransactionAndInvoice(tx, order, {
          paymentMethod: req.body.paymentMethod || req.body.method || 'ONLINE',
          paymentStatus: 'PAID'
        });
      });
      await generateInvoiceForOrder(order.id, { paymentStatus: 'PAID', sendEmail: false }).catch((invoiceError) => {
        console.warn('[invoice] automatic generation failed', invoiceError.message);
      });
    }

    res.json({ message: 'Payment notification processed' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to process payment notification', error: error.message });
  }
};

module.exports = { notifyPayment };
