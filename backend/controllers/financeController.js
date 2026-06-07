const prisma = require('../config/prisma');
const { store, createId, seedBusinessData } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');
const { sendAdminEmpty, sendAdminObject } = require('../utils/adminApiResponse');
const { getFinanceDashboard } = require('../services/financeService');
const { formatTransaction } = require('./transactionController');
const { getGiftVoucherSalesSummary } = require('../services/giftVoucherService');

const summarizeFinance = (orders, expenses, totals = {}) => {
  const revenue = totals.revenue ?? orders.reduce((sum, order) => sum + Number(order.totalAmount ?? order.totalPrice ?? 0), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const breakdown = totals.breakdown ?? expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});
  const totalExpenses = totals.expenses ?? expenseTotal;
  return { ...getFinanceDashboard(), revenue, expenses: totalExpenses, profit: revenue - totalExpenses, breakdown };
};

const getFinanceSummary = async (req, res) => {
  const endpoint = 'GET /api/finance';
  try {
    const giftVoucherSales = await getGiftVoucherSalesSummary().catch((error) => {
      console.error({ endpoint, table: 'GiftVoucher', error: error.message });
      return { totalAmount: 0, totalSales: 0, activeCount: 0, redeemedCount: 0, vouchers: [] };
    });
    if (global.useMemoryStore) {
      await seedBusinessData();
      const financeTransactions = store.financeTransactions || [];
      const payload = {
        ...summarizeFinance(store.orders, store.expenses),
        giftVoucherSales,
        financeTransactions,
        recentTransactions: [
          ...(financeTransactions || []).map((transaction) => ({
            ...transaction,
            customer: transaction.category,
            paymentStatus: transaction.status,
            date: transaction.createdAt,
          })),
          ...(store.transactions || []).map(formatTransaction),
        ].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).slice(0, 6),
        expenseItems: store.expenses
      };
      return sendAdminObject(res, endpoint, payload, payload);
    }

    const where = req.query.category ? { category: req.query.category } : {};
    const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 500);
    const safe = async (label, promise, fallback) => promise.catch((error) => {
      console.error({ endpoint, table: label, error: error.message });
      return fallback;
    });
    const [orderTotals, expenseTotals, expenseBreakdown, expenses, transactions, financeTransactions] = await Promise.all([
      safe('Order', prisma.order.aggregate({ _sum: { totalAmount: true } }), { _sum: { totalAmount: 0 } }),
      safe('Expense', prisma.expense.aggregate({ where, _sum: { amount: true } }), { _sum: { amount: 0 } }),
      safe('Expense', prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true }
      }), []),
      safe('Expense', prisma.expense.findMany({ where, orderBy: { date: 'desc' }, take: limit }), []),
      safe('Transaction', prisma.transaction.findMany({
        include: { order: true, customer: true },
        orderBy: { createdAt: 'desc' },
        take: 6
      }), []),
      safe('FinanceTransaction', prisma.$queryRaw`SELECT * FROM "FinanceTransaction" ORDER BY "createdAt" DESC LIMIT 20`, [])
    ]);
    const breakdown = expenseBreakdown.reduce((acc, item) => {
      acc[item.category] = Number(item._sum.amount || 0);
      return acc;
    }, {});
    const payload = {
      ...summarizeFinance([], expenses, {
        revenue: Number(orderTotals._sum.totalAmount || 0),
        expenses: Number(expenseTotals._sum.amount || 0),
        breakdown
      }),
      giftVoucherSales,
      financeTransactions: financeTransactions.map(withId),
      recentTransactions: [
        ...financeTransactions.map((transaction) => ({
          ...withId(transaction),
          customer: transaction.category,
          paymentStatus: transaction.status,
          date: transaction.createdAt,
        })),
        ...transactions.map(formatTransaction),
      ].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).slice(0, 6),
      expenseItems: expenses.map(withId)
    };
    return sendAdminObject(res, endpoint, payload, payload);
  } catch (error) {
    return sendAdminEmpty(res, endpoint, error);
  }
};

const createExpense = async (req, res) => {
  try {
    const { title, category, amount, date } = req.body;
    if (!title || !category || !amount) {
      return res.status(400).json({ message: 'Title, category, and amount are required' });
    }

    if (global.useMemoryStore) {
      const expense = { _id: createId(), title, category, amount: Number(amount), date: date ? new Date(date) : new Date(), createdAt: new Date() };
      store.expenses.unshift(expense);
      return res.status(201).json(expense);
    }

    const expense = await prisma.expense.create({
      data: { title, category, amount: Number(amount), date: date ? new Date(date) : undefined }
    });
    res.status(201).json(withId(expense));
  } catch (error) {
    res.status(400).json({ message: 'Failed to create expense', error: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { title, category, amount, date } = req.body;
    if (!title || !category || !amount) {
      return res.status(400).json({ message: 'Title, category, and amount are required' });
    }

    if (global.useMemoryStore) {
      const index = store.expenses.findIndex((expense) => expense._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Expense not found' });
      const updatedExpense = {
        ...store.expenses[index],
        title,
        category,
        amount: Number(amount),
        date: date ? new Date(date) : store.expenses[index].date,
        updatedAt: new Date()
      };
      store.expenses[index] = updatedExpense;
      return res.json(updatedExpense);
    }

    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    const updatedExpense = await prisma.expense.update({
      where: { id: req.params.id },
      data: { title, category, amount: Number(amount), date: date ? new Date(date) : undefined }
    });
    res.json(withId(updatedExpense));
  } catch (error) {
    res.status(400).json({ message: 'Failed to update expense', error: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const index = store.expenses.findIndex((expense) => expense._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Expense not found' });
      store.expenses.splice(index, 1);
      return res.json({ message: 'Expense deleted' });
    }

    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete expense', error: error.message });
  }
};

module.exports = { getFinanceSummary, createExpense, updateExpense, deleteExpense };
