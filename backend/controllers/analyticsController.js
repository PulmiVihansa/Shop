const prisma = require('../config/prisma');
const { store, seedBusinessData } = require('../data/memoryStore');
const { withId, withoutPassword, normalizeOrder } = require('../utils/dbFormat');

const monthKey = (date) => new Date(date).toLocaleString('en-US', { month: 'short', year: 'numeric' });

const buildAnalytics = (products, orders, users, expenses = []) => {
  const revenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const lowStock = products.filter((product) => Number(product.stock || 0) <= 5);
  const productSales = {};

  orders.forEach((order) => {
    order.items?.forEach((item) => {
      const key = item.product || item.name;
      if (!productSales[key]) {
        productSales[key] = { name: item.name, quantity: 0, revenue: 0 };
      }
      productSales[key].quantity += Number(item.quantity || 1);
      productSales[key].revenue += Number(item.price || 0) * Number(item.quantity || 1);
    });
  });

  const monthlyRevenue = Object.values(
    orders.reduce((acc, order) => {
      const key = monthKey(order.createdAt || new Date());
      if (!acc[key]) acc[key] = { label: key, revenue: 0, orders: 0 };
      acc[key].revenue += Number(order.totalPrice || 0);
      acc[key].orders += 1;
      return acc;
    }, {})
  );

  const customerGrowth = Object.values(
    users.reduce((acc, user) => {
      const key = monthKey(user.createdAt || new Date());
      if (!acc[key]) acc[key] = { label: key, customers: 0 };
      acc[key].customers += 1;
      return acc;
    }, {})
  );

  const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  return {
    totals: {
      users: users.length,
      orders: orders.length,
      revenue,
      lowStock: lowStock.length,
      expenses: expenseTotal,
      profit: revenue - expenseTotal
    },
    lowStock,
    recentOrders: orders.slice(0, 8),
    topProducts: Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 8),
    monthlyRevenue,
    salesOverTime: monthlyRevenue,
    productPerformance: Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    customerGrowth,
    orderFrequency: monthlyRevenue.map((entry) => ({ label: entry.label, orders: entry.orders }))
  };
};

const getAnalytics = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      await seedBusinessData();
      const orders = store.orders.map((order) => ({
        ...order,
        user: store.users.find((user) => user._id === order.user) || { name: 'Customer', email: '' }
      }));
      return res.json(buildAnalytics(store.products, orders, store.users, store.expenses));
    }

    const [products, orders, users, expenses] = await Promise.all([
      prisma.product.findMany(),
      prisma.order.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.expense.findMany()
    ]);
    res.json(buildAnalytics(products.map(withId), orders.map(normalizeOrder), users.map(withoutPassword), expenses.map(withId)));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};

module.exports = { getAnalytics };
