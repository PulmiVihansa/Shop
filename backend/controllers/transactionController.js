const prisma = require('../config/prisma');
const { store } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');

const formatTransaction = (transaction) => {
  if (!transaction) return transaction;
  const order = transaction.order || {};
  const customer = transaction.customer || {};
  return {
    ...withId(transaction),
    transactionId: transaction.transactionId,
    orderId: order.orderId || transaction.orderReference || transaction.orderId,
    customerId: customer.customerId || transaction.customerId,
    customer: customer.name || transaction.customer || 'Customer',
    email: customer.email || '',
    amount: Number(transaction.amount || 0),
    paymentMethod: transaction.paymentMethod || '-',
    paymentStatus: transaction.paymentStatus || 'PENDING',
    date: transaction.createdAt
  };
};

const getTransactions = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      return res.json((store.transactions || []).map(formatTransaction));
    }

    const transactions = await prisma.transaction.findMany({
      include: {
        order: true,
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions.map(formatTransaction));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};

module.exports = { getTransactions, formatTransaction };
