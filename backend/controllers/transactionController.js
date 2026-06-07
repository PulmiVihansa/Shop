const prisma = require('../config/prisma');
const { store } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');
const { sendAdminEmpty, sendAdminList } = require('../utils/adminApiResponse');

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
  const endpoint = 'GET /api/transactions';
  try {
    if (global.useMemoryStore) {
      const data = (store.transactions || []).map(formatTransaction);
      return sendAdminList(res, endpoint, data, { transactions: data });
    }

    const transactions = await prisma.transaction.findMany({
      include: {
        order: true,
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });
    const data = transactions.map(formatTransaction);
    return sendAdminList(res, endpoint, data, { transactions: data });
  } catch (error) {
    return sendAdminEmpty(res, endpoint, error);
  }
};

module.exports = { getTransactions, formatTransaction };
