const monthLabel = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getOrderItems = (order = {}) => {
  if (Array.isArray(order.items) && order.items.length) return order.items;
  return [{
    product: order.productId || order.product,
    name: order.productName,
    quantity: order.quantity,
    price: order.price,
  }];
};

const isPaidOrder = (order = {}) => order.paymentStatus === 'PAID' || order.payment?.status === 'PAID';

const productKeyFromItem = (item = {}, productsById, productIdByName) => {
  const rawId = item.productId || item.product || item.id;
  if (rawId && productsById.has(String(rawId))) return String(rawId);

  const name = String(item.name || item.productName || '').trim().toLowerCase();
  return productIdByName.get(name) || '';
};

const buildBestRevenueProducts = (orders = [], products = []) => {
  const paidOrders = orders.filter(isPaidOrder);
  const productsById = new Map(products.map((product) => [String(product.id || product._id), product]));
  const productIdByName = new Map(
    products
      .filter((product) => product.name)
      .map((product) => [String(product.name).trim().toLowerCase(), String(product.id || product._id)])
  );
  const byProduct = new Map();

  paidOrders.forEach((order) => {
    getOrderItems(order).forEach((item) => {
      const productId = productKeyFromItem(item, productsById, productIdByName);
      if (!productId) return;

      const product = productsById.get(productId);
      if (!product) return;

      const quantity = Math.max(1, Math.trunc(toNumber(item.quantity, 1)));
      const unitPrice = toNumber(item.price, toNumber(product.price, 0));
      const itemRevenue = unitPrice * quantity;
      const unitCost = toNumber(item.cost ?? item.costPrice ?? item.unitCost, 0);
      const itemProfit = itemRevenue - (unitCost * quantity);
      const current = byProduct.get(productId) || {
        id: productId,
        product: product.name,
        productName: product.name,
        orders: new Set(),
        revenue: 0,
        profit: 0,
      };

      current.orders.add(order.id || order._id || order.orderId);
      current.revenue += itemRevenue;
      current.profit += itemProfit;
      byProduct.set(productId, current);
    });
  });

  return Array.from(byProduct.values())
    .map((entry) => ({
      id: entry.id,
      product: entry.product,
      productName: entry.productName,
      orders: entry.orders.size,
      revenue: entry.revenue,
      profit: entry.profit,
    }))
    .filter((entry) => entry.revenue > 0)
    .sort((left, right) => right.revenue - left.revenue);
};

const buildMonthlyRevenue = (orders = []) => {
  const byMonth = new Map();
  orders.filter(isPaidOrder).forEach((order) => {
    const label = monthLabel(order.createdAt || order.orderDate);
    const current = byMonth.get(label) || { label, revenue: 0, orders: 0 };
    current.revenue += toNumber(order.totalAmount ?? order.totalPrice, 0);
    current.orders += 1;
    byMonth.set(label, current);
  });
  return Array.from(byMonth.values());
};

const buildRevenueByCollection = (bestProducts = [], products = []) => {
  const productsById = new Map(products.map((product) => [String(product.id || product._id), product]));
  const byCollection = new Map();

  bestProducts.forEach((entry) => {
    const product = productsById.get(String(entry.id));
    if (!product) return;
    const label = product.collection || product.category || 'Uncategorized';
    byCollection.set(label, (byCollection.get(label) || 0) + toNumber(entry.revenue, 0));
  });

  return Array.from(byCollection.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
};

const buildFinanceDashboard = ({ orders = [], products = [], revenue = 0, expenses = 0, bestProducts } = {}) => {
  const paidOrders = orders.filter(isPaidOrder);
  const liveBestProducts = bestProducts || buildBestRevenueProducts(paidOrders, products);
  const monthlyRevenue = buildMonthlyRevenue(paidOrders);
  const monthlyProfit = monthlyRevenue.map((entry) => ({
    label: entry.label,
    profit: Math.max(0, entry.revenue - (expenses / Math.max(monthlyRevenue.length, 1))),
  }));
  const profit = revenue - expenses;
  const margin = revenue ? Number(((profit / revenue) * 100).toFixed(1)) : 0;

  return {
    summary: [
      { label: 'Total Revenue', value: revenue, growth: 0, trend: revenue ? 'up' : 'neutral' },
      { label: 'Net Profit', value: profit, growth: 0, trend: profit >= 0 ? 'up' : 'down' },
      { label: 'Expenses', value: expenses, growth: 0, trend: expenses ? 'down' : 'neutral' },
      { label: 'Profit Margin', value: margin, suffix: '%', growth: 0, trend: margin >= 0 ? 'up' : 'down' },
    ],
    cashFlow: [
      { label: 'Cash Inflow', value: revenue, trend: revenue ? 'up' : 'neutral', growth: 0 },
      { label: 'Cash Outflow', value: expenses, trend: expenses ? 'down' : 'neutral', growth: 0 },
      { label: 'Net Cash Flow', value: profit, trend: profit >= 0 ? 'up' : 'down', growth: 0 },
    ],
    monthlyTarget: {
      revenueGoal: 0,
      currentRevenue: revenue,
      completion: 0,
      remaining: 0,
    },
    financialInsights: [],
    revenueSources: [
      { label: 'Website Orders', value: revenue },
    ],
    monthlyRevenue,
    monthlyProfit,
    revenueByCollection: buildRevenueByCollection(liveBestProducts, products),
    bestProducts: liveBestProducts,
    recentTransactions: [],
  };
};

module.exports = {
  buildBestRevenueProducts,
  buildFinanceDashboard,
};
