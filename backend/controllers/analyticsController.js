const prisma = require('../config/prisma');
const { store, seedBusinessData } = require('../data/memoryStore');
const { withId, withoutPassword, normalizeOrder } = require('../utils/dbFormat');
const { getAnalyticsDashboard } = require('../services/analyticsService');
const { getGiftVoucherSalesSummary } = require('../services/giftVoucherService');
const { sendAdminEmpty, sendAdminObject } = require('../utils/adminApiResponse');

const monthKey = (date) => new Date(date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
const getOrderTotal = (order) => Number(order.totalAmount ?? order.totalPrice ?? 0);
const isPaidOrder = (order = {}) => order.paymentStatus === 'PAID' || order.payment?.status === 'PAID';
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
  const paidOrders = orders.filter(isPaidOrder);
  const revenue = paidOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const voucherRevenue = Number(metrics.voucherRevenue || 0);
  const lowStock = products.filter((product) => {
    const stock = getTotalStock(product);
    return stock > 0 && stock <= 10;
  });
  const productSales = {};

  paidOrders.forEach((order) => {
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
    paidOrders.reduce((acc, order) => {
      const key = monthKey(getOrderDate(order));
      if (!acc[key]) acc[key] = { label: key, revenue: 0, orders: 0 };
      acc[key].revenue += getOrderTotal(order);
      acc[key].orders += 1;
      return acc;
    }, {})
  );
  monthlyRevenue.sort((left, right) => new Date(`01 ${left.label}`) - new Date(`01 ${right.label}`));

  const customerGrowth = Object.values(
    users.reduce((acc, user) => {
      const key = monthKey(user.createdAt || new Date());
      if (!acc[key]) acc[key] = { label: key, customers: 0 };
      acc[key].customers += 1;
      return acc;
    }, {})
  );

  const expenseTotal = metrics.expenseTotal ?? expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const liveRevenue = metrics.revenue ?? revenue;
  const liveOrderCount = metrics.orderCount ?? orders.length;
  const liveCustomerCount = metrics.customerCount ?? metrics.userCount ?? users.filter((user) => user.role !== 'admin').length;
  const monthlyRevenueTotal = monthlyRevenue.reduce((sum, entry) => sum + Number(entry.revenue || 0), 0);
  const productPerformance = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);

  return {
    ...getAnalyticsDashboard(),
    kpis: [
      { label: 'Total Revenue', value: liveRevenue, trend: liveRevenue ? 'up' : 'neutral', note: 'Paid and recorded order value' },
      { label: 'Orders Count', value: liveOrderCount, trend: liveOrderCount ? 'up' : 'neutral', note: 'Orders in database' },
      { label: 'Customer Count', value: liveCustomerCount, trend: liveCustomerCount ? 'up' : 'neutral', note: 'Customers in database' },
      { label: 'Voucher Revenue', value: voucherRevenue, trend: voucherRevenue ? 'up' : 'neutral', note: 'Gift voucher income' },
      { label: 'Monthly Revenue', value: monthlyRevenueTotal, trend: monthlyRevenueTotal ? 'up' : 'neutral', note: `${monthlyRevenue.length} monthly buckets` },
    ],
    totals: {
      users: metrics.userCount ?? users.length,
      customers: liveCustomerCount,
      orders: liveOrderCount,
      revenue: liveRevenue,
      voucherRevenue,
      lowStock: lowStock.length,
      expenses: expenseTotal,
      profit: liveRevenue - expenseTotal
    },
    lowStock,
    recentOrders: orders.slice(0, 8),
    topProducts: productPerformance.slice(0, 8).map((product) => ({
      ...product,
      sales: product.quantity,
      views: Math.max(product.quantity, product.quantity * 24),
      conversion: product.quantity ? Number(Math.min(100, (product.quantity / Math.max(product.quantity * 24, 1)) * 100).toFixed(1)) : 0,
    })),
    monthlyRevenue,
    salesOverTime: monthlyRevenue,
    productPerformance: productPerformance.slice(0, 8),
    customerGrowth,
    orderFrequency: monthlyRevenue.map((entry) => ({ label: entry.label, orders: entry.orders }))
  };
};

const getAnalytics = async (req, res) => {
  const endpoint = 'GET /api/analytics';
  try {
    const giftVoucherSales = await getGiftVoucherSalesSummary().catch(() => ({ totalAmount: 0, vouchers: [] }));
    if (global.useMemoryStore) {
      await seedBusinessData();
      const orders = store.orders.map((order) => ({
        ...order,
        user: store.users.find((user) => user._id === order.user) || { name: 'Customer', email: '' }
      }));
      const payload = buildAnalytics(store.products, orders, store.users, store.expenses, {
        voucherRevenue: giftVoucherSales.totalAmount,
        customerCount: store.users.filter((user) => user.role !== 'admin').length,
      });
      return sendAdminObject(res, endpoint, payload, payload);
    }

    const safe = async (label, promise, fallback) => promise.catch((error) => {
      console.error({ endpoint, table: label, error: error.message });
      return fallback;
    });
    const paidOrderWhere = { paymentStatus: 'PAID' };

    const products = await safe('Product', prisma.product.findMany({
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
    }), []);
    const [orderCount, userCount, customerCount, orderTotals, expenseTotals] = await Promise.all([
      safe('Order', prisma.order.count(), 0),
      safe('User', prisma.user.count(), 0),
      safe('Customer', prisma.customer.count(), 0),
      safe('Order', prisma.order.aggregate({ where: paidOrderWhere, _sum: { totalAmount: true } }), { _sum: { totalAmount: 0 } }),
      safe('Expense', prisma.expense.aggregate({ _sum: { amount: true } }), { _sum: { amount: 0 } })
    ]);
    const [orders, users] = await Promise.all([
      safe('Order', prisma.order.findMany({
        where: paidOrderWhere,
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
      }), []),
      safe('User', prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, provider: true, avatar: true, customerId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1000
      }), [])
    ]);
    const payload = buildAnalytics(
      products.map(withId),
      orders.map(normalizeOrder),
      users.map(withoutPassword),
      [],
      {
        orderCount,
        userCount,
        customerCount: customerCount || users.filter((user) => user.role !== 'admin').length,
        revenue: Number(orderTotals._sum.totalAmount || 0),
        expenseTotal: Number(expenseTotals._sum.amount || 0),
        voucherRevenue: giftVoucherSales.totalAmount,
      }
    );
    return sendAdminObject(res, endpoint, payload, payload);
  } catch (error) {
     return sendAdminEmpty(res, endpoint, error);
  }
};

module.exports = { getAnalytics };
