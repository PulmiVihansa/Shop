const prisma = require('../config/prisma');
const { store, createId } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');

const BULK_ORDER_STATUSES = ['Pending', 'Approved', 'Production', 'Completed', 'Cancelled'];

const parseProducts = (products) => {
  if (Array.isArray(products)) {
    return products.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return String(products || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeStatus = (status) => (BULK_ORDER_STATUSES.includes(status) ? status : 'Pending');

const normalizeOrder = (order) => {
  const createdAt = order.createdAt || new Date();
  const products = parseProducts(order.products || order.requestedProducts);
  const orderValue = Number(order.orderValue ?? order.budget ?? 0);
  const companyName = order.companyName || order.company || '';

  return {
    ...withId(order),
    id: order.id || order._id,
    companyName,
    company: companyName,
    contactPerson: order.contactPerson || '',
    email: order.email || '',
    phone: order.phone || '',
    products,
    requestedProducts: products,
    quantity: Number(order.quantity || 0),
    orderValue,
    budget: orderValue,
    message: order.message || order.notes || '',
    notes: order.message || order.notes || '',
    status: normalizeStatus(order.status),
    date: order.date || new Date(createdAt).toISOString().slice(0, 10),
    createdAt,
    updatedAt: order.updatedAt || createdAt,
  };
};

const buildDashboard = (orders) => ({
  summary: BULK_ORDER_STATUSES.map((status) => {
    const items = orders.filter((order) => normalizeStatus(order.status) === status);
    const revenue = items.reduce((sum, order) => sum + Number(order.orderValue || 0), 0);
    return {
      label: status,
      value: items.length,
      revenue,
      growth: revenue,
      trend: 'up',
    };
  }),
  orders,
});

const companyKey = (value) => String(value || '').trim().toLowerCase();
const emailKey = (value) => String(value || '').trim().toLowerCase();

const findMemoryCustomerByEmail = (email) =>
  store.bulkCustomers.find((customer) => emailKey(customer.email) === emailKey(email));

const buildCustomerAnalytics = (customer, orders) => {
  const id = customer.id || customer._id;
  const customerOrders = orders.filter((order) =>
    (order.bulkCustomerId && order.bulkCustomerId === id) ||
    emailKey(order.email) === emailKey(customer.email)
  );
  const revenue = customerOrders.reduce((sum, order) => sum + Number(order.orderValue || order.budget || 0), 0);
  const lastOrder = customerOrders
    .map((order) => order.createdAt || order.date)
    .filter(Boolean)
    .sort((left, right) => new Date(right) - new Date(left))[0] || null;

  return {
    ...withId(customer),
    id,
    companyName: customer.companyName || customer.company || '',
    company: customer.companyName || customer.company || '',
    contactPerson: customer.contactPerson || customer.name || '',
    name: customer.contactPerson || customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    discount: Number(customer.discount || 0),
    notes: customer.notes || '',
    orders: customerOrders.length,
    revenue,
    lastOrder,
  };
};

const createCustomerForOrder = async (order, updatedOrderData = {}) => {
  const companyName = order.companyName || order.company;
  const email = String(order.email || '').trim();

  if (global.useMemoryStore) {
    let customer = findMemoryCustomerByEmail(email);
    let customerCreated = false;

    if (!customer) {
      customerCreated = true;
      customer = {
        _id: createId(),
        companyName,
        contactPerson: order.contactPerson,
        email,
        phone: order.phone || '',
        discount: 0,
        notes: 'Generated automatically from approved wholesale orders.',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.bulkCustomers.unshift(customer);
    }

    Object.assign(order, updatedOrderData, { bulkCustomerId: customer._id });
    return { customer, customerCreated, order };
  }

  let customer = await prisma.bulkCustomer.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  let customerCreated = false;

  if (!customer) {
    customerCreated = true;
    customer = await prisma.bulkCustomer.create({
      data: {
        companyName,
        contactPerson: order.contactPerson,
        email,
        phone: order.phone || '',
        discount: 0,
        notes: 'Generated automatically from approved wholesale orders.',
      },
    });
  }

  const updated = await prisma.bulkOrderRequest.update({
    where: { id: order.id },
    data: { ...updatedOrderData, bulkCustomerId: customer.id },
  });

  return { customer, customerCreated, order: updated };
};

const getBulkOrders = async (req, res) => {
  if (global.useMemoryStore) {
    return res.json(buildDashboard(store.bulkOrderRequests.map(normalizeOrder)));
  }

  const orders = await prisma.bulkOrderRequest.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(buildDashboard(orders.map(normalizeOrder)));
};

const createBulkOrderRequest = async (req, res) => {
  const {
    companyName,
    contactPerson,
    email,
    phone = '',
    products = [],
    quantity = 0,
    orderValue = 0,
    message = '',
  } = req.body;

  if (!String(companyName || '').trim() || !String(contactPerson || '').trim() || !String(email || '').trim()) {
    return res.status(400).json({ message: 'Company, contact person, and email are required' });
  }

  const payload = {
    companyName: String(companyName).trim(),
    contactPerson: String(contactPerson).trim(),
    email: String(email).trim(),
    phone: String(phone || '').trim(),
    products: parseProducts(products),
    quantity: Math.max(0, Math.trunc(Number(quantity || 0))),
    orderValue: Math.max(0, Number(orderValue || 0)),
    message: String(message || '').trim(),
    status: 'Pending',
  };

  if (global.useMemoryStore) {
    const request = {
      _id: `BULK-${String(store.bulkOrderRequests.length + 2042).padStart(4, '0')}`,
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.bulkOrderRequests.unshift(request);
    return res.status(201).json(normalizeOrder(request));
  }

  const saved = await prisma.bulkOrderRequest.create({ data: payload });
  res.status(201).json(normalizeOrder(saved));
};

const updateBulkOrder = async (req, res) => {
  try {
    const status = req.body.status;
    if (!BULK_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid bulk order status' });
    }

    if (global.useMemoryStore) {
      const order = store.bulkOrderRequests.find((item) => (item._id || item.id) === req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Bulk order not found' });
      }

      const previousStatus = normalizeStatus(order.status);
      const updatedAt = new Date();
      const messages = ['Status updated successfully'];
      let customerCreated = false;

      if (previousStatus !== 'Approved' && status === 'Approved') {
        const result = await createCustomerForOrder(order, { status, updatedAt });
        customerCreated = result.customerCreated;
        messages.unshift('Bulk order approved');
        if (customerCreated) messages.splice(1, 0, 'Customer added to wholesale CRM');
        return res.json({ order: normalizeOrder(result.order), customerCreated, messages });
      }

      Object.assign(order, { status, updatedAt });
      return res.json({ order: normalizeOrder(order), customerCreated, messages });
    }

    const order = await prisma.bulkOrderRequest.findUnique({ where: { id: req.params.id } });
    if (!order) {
      return res.status(404).json({ message: 'Bulk order not found' });
    }

    const previousStatus = normalizeStatus(order.status);
    const messages = ['Status updated successfully'];
    let customerCreated = false;
    let updated;

    if (previousStatus !== 'Approved' && status === 'Approved') {
      const result = await createCustomerForOrder(order, { status });
      updated = result.order;
      customerCreated = result.customerCreated;
      messages.unshift('Bulk order approved');
      if (customerCreated) messages.splice(1, 0, 'Customer added to wholesale CRM');
    } else {
      updated = await prisma.bulkOrderRequest.update({
        where: { id: req.params.id },
        data: { status },
      });
    }

    res.json({ order: normalizeOrder(updated), customerCreated, messages });
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message || 'Unable to update bulk order' });
  }
};

const deleteBulkOrder = async (req, res) => {
  const { id } = req.params;

  if (global.useMemoryStore) {
    const index = store.bulkOrderRequests.findIndex((item) => (item._id || item.id) === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Bulk order not found' });
    }

    store.bulkOrderRequests.splice(index, 1);
    return res.status(204).send();
  }

  await prisma.bulkOrderRequest.delete({ where: { id } });
  res.status(204).send();
};

const getBulkCustomers = async (req, res) => {
  if (global.useMemoryStore) {
    const orders = store.bulkOrderRequests.map(normalizeOrder);
    return res.json(store.bulkCustomers.map((customer) => buildCustomerAnalytics(customer, orders)));
  }

  const customers = await prisma.bulkCustomer.findMany({
    include: { orders: true },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = customers.map((customer) => {
    const orders = (customer.orders || []).map(normalizeOrder);
    const revenue = orders.reduce((sum, order) => sum + Number(order.orderValue || 0), 0);
    const lastOrder = orders
      .map((order) => order.createdAt)
      .filter(Boolean)
      .sort((left, right) => new Date(right) - new Date(left))[0] || null;
    const { orders: relatedOrders, ...customerData } = customer;

    return {
      ...withId(customerData),
      company: customer.companyName,
      name: customer.contactPerson,
      orders: relatedOrders.length,
      revenue,
      lastOrder,
    };
  });

  res.json(formatted);
};

module.exports = { getBulkOrders, createBulkOrderRequest, getBulkCustomers, updateBulkOrder, deleteBulkOrder };
