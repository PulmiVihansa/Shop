const prisma = require('../config/prisma');
const { store, seedBusinessData } = require('../data/memoryStore');
const { withId, withoutPassword, normalizeOrder } = require('../utils/dbFormat');
const { getAnalyticsDashboard } = require('../services/analyticsService');

const monthKey = (date) => new Date(date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
const getOrderTotal = (order) => Number(order.totalAmount ?? order.totalPrice ?? 0);
const getTotalStock = (product) => {
  if (product?.sizeStock && typeof product.sizeStock === 'object') {
    return Object.values(product.sizeStock).reduce((sum, value) => sum + Math.max(0, Math.trunc(Number(value) || 0)), 0);
  }
  return Math.max(0, Math.trunc(Number(product?.stock) || 0));
};
const getOrderDate = (order) => order.orderDate || order.createdAt || new Date();
const getOrderItems = (order) => {
  if (Array.isArray(order.items) && order.items.length) return order.items;
  return [{
    product: order.productId || order.product || order.id,
    name: order.productName || 'Product',
    price: Number(order.price || 0),
    quantity: Number(order.quantity || 1),
    size: order.size || 'One Size'
  }];
};

const buildAnalytics = (products, orders, users, expenses = [], metrics = {}) => {
  const revenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const lowStock = products.filter((product) => {
    const stock = getTotalStock(product);
    return stock > 0 && stock <= 10;
  });
  const productSales = {};

  orders.forEach((order) => {
    getOrderItems(order).forEach((item) => {
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
      const key = monthKey(getOrderDate(order));
      if (!acc[key]) acc[key] = { label: key, revenue: 0, orders: 0 };
      acc[key].revenue += getOrderTotal(order);
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

  const expenseTotal = metrics.expenseTotal ?? expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  return {
    ...getAnalyticsDashboard(),
    totals: {
      users: metrics.userCount ?? users.length,
      orders: metrics.orderCount ?? orders.length,
      revenue: metrics.revenue ?? revenue,
      lowStock: lowStock.length,
      expenses: expenseTotal,
      profit: (metrics.revenue ?? revenue) - expenseTotal
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

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        collection: true,
        category: true,
        stock: true,
        sizeStock: true,
        price: true,
        images: true,
        createdAt: true,
        updatedAt: true
      }
    });
    const [orderCount, userCount, orderTotals, expenseTotals] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } })
    ]);
    const [orders, users] = await Promise.all([
      prisma.order.findMany({
        select: {
          id: true,
          orderId: true,
          productName: true,
          quantity: true,
          price: true,
          totalAmount: true,
          items: true,
          orderStatus: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, provider: true, avatar: true, customerId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1000
      })
    ]);
    res.json(buildAnalytics(
      products.map(withId),
      orders.map(normalizeOrder),
      users.map(withoutPassword),
      [],
      {
        orderCount,
        userCount,
        revenue: Number(orderTotals._sum.totalAmount || 0),
        expenseTotal: Number(expenseTotals._sum.amount || 0)
      }
    ));
  } catch (error) {
     console.error(error);
     res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };
