const prisma = require('../config/prisma');
const { store, createId, seedBusinessData } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');
const { getFinanceDashboard } = require('../services/financeService');
const { formatTransaction } = require('./transactionController');

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
  try {
    if (global.useMemoryStore) {
      await seedBusinessData();
      return res.json({
        ...summarizeFinance(store.orders, store.expenses),
        recentTransactions: (store.transactions || []).slice(0, 6).map(formatTransaction),
        expenseItems: store.expenses
      });
    }

    const where = req.query.category ? { category: req.query.category } : {};
    const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 500);
    const [orderTotals, expenseTotals, expenseBreakdown, expenses, transactions] = await Promise.all([
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
      prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true }
      }),
      prisma.expense.findMany({ where, orderBy: { date: 'desc' }, take: limit }),
      prisma.transaction.findMany({
        include: { order: true, customer: true },
        orderBy: { createdAt: 'desc' },
        take: 6
      })
    ]);
    const breakdown = expenseBreakdown.reduce((acc, item) => {
      acc[item.category] = Number(item._sum.amount || 0);
      return acc;
    }, {});
    res.json({
      ...summarizeFinance([], expenses, {
        revenue: Number(orderTotals._sum.totalAmount || 0),
        expenses: Number(expenseTotals._sum.amount || 0),
        breakdown
      }),
      recentTransactions: transactions.map(formatTransaction),
      expenseItems: expenses.map(withId)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch finance summary', error: error.message });
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
