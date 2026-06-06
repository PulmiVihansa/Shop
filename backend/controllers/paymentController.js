const crypto = require('crypto');
const prisma = require('../config/prisma');
const { store, createId } = require('../data/memoryStore');
const { getPaymentSettingsDoc } = require('./paymentSettingsController');
const { normalizeOrder } = require('../utils/dbFormat');
const {
  ensureCustomerForOrder,
  getNextPublicId,
  getNextTransactionId,
  createTransactionAndInvoice,
} = require('../services/orderDocumentService');
const { generateInvoiceForOrder } = require('../services/invoiceService');

const PAYHERE_SANDBOX_URL = 'https://sandbox.payhere.lk/pay/checkout';
const PAYHERE_PRODUCTION_URL = 'https://www.payhere.lk/pay/checkout';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value, fallback = '') => {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const md5Upper = (value) => crypto.createHash('md5').update(String(value), 'utf8').digest('hex').toUpperCase();
const money = (value) => Number(value || 0).toFixed(2);
const isSandbox = (settings = {}) => Boolean(settings.sandboxMode ?? settings.payhereSandbox ?? true);
const frontendUrl = () => String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const apiUrl = (req) => String(process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
const checkoutHash = ({ merchantId, orderId, amount, currency, merchantSecret }) =>
  md5Upper(`${merchantId}${orderId}${money(amount)}${currency}${md5Upper(merchantSecret)}`);
const notifyHash = ({ merchantId, orderId, amount, currency, statusCode, merchantSecret }) =>
  md5Upper(`${merchantId}${orderId}${amount}${currency}${statusCode}${md5Upper(merchantSecret)}`);

const normalizeItems = (body = {}) => {
  const incoming = Array.isArray(body.items) ? body.items : [];
  const items = incoming.length ? incoming : [{
    product: body.product || body.productId,
    name: body.productName || 'Product',
    price: body.price || body.totalAmount || 0,
    quantity: body.quantity || 1,
    size: body.size || 'One Size',
    image: body.image || '',
  }];

  return items.map((item) => ({
    product: item.product || item.productId || item.id || undefined,
    name: toText(item.name, toText(body.productName, 'Product')),
    price: toNumber(item.price, 0),
    quantity: Math.max(1, Math.trunc(toNumber(item.quantity, 1))),
    size: toText(item.size, toText(body.size, 'One Size')),
    image: toText(item.image, ''),
  }));
};

const summaryName = (items) => {
  if (items.length <= 1) return items[0]?.name || 'Product';
  return `${items[0]?.name || 'Product'} +${items.length - 1} more`;
};

const summarySize = (items) => {
  const sizes = Array.from(new Set(items.map((item) => item.size || 'One Size')));
  return sizes.length === 1 ? sizes[0] : 'Mixed';
};

const reduceStock = async (items) => {
  if (global.useMemoryStore) {
    items.forEach((item) => {
      const product = store.products.find((entry) => entry._id === item.product || entry.id === item.product);
      if (!product) return;
      product.sizeStock = product.sizeStock || {};
      const quantity = Number(item.quantity || 1);
      if (item.size && product.sizeStock[item.size] !== undefined) {
        product.sizeStock[item.size] = Math.max(0, Number(product.sizeStock[item.size] || 0) - quantity);
      }
      product.stock = Math.max(0, Number(product.stock || 0) - quantity);
    });
    return;
  }

  await Promise.all(items.filter((item) => item.product).map(async (item) => {
    const product = await prisma.product.findUnique({ where: { id: item.product } });
    if (!product) return;
    const quantity = Number(item.quantity || 1);
    const nextSizeStock = { ...(product.sizeStock || {}) };
    if (item.size && nextSizeStock[item.size] !== undefined) {
      nextSizeStock[item.size] = Math.max(0, Number(nextSizeStock[item.size] || 0) - quantity);
    }
    await prisma.product.update({
      where: { id: item.product },
      data: {
        stock: Math.max(0, Number(product.stock || 0) - quantity),
        sizeStock: nextSizeStock,
      },
    });
  }));
};

const buildOrderData = (req, settings) => {
  const items = normalizeItems(req.body);
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const shippingCost = Math.max(0, toNumber(req.body.shippingCost, toNumber(req.body.shipping, subtotal > 25000 || subtotal === 0 ? 0 : 650)));
  const totalAmount = Math.max(0, toNumber(req.body.totalAmount, toNumber(req.body.total, subtotal + shippingCost)));
  const address = req.body.address || {};
  const customerName = toText(req.body.customerName, toText(address.fullName, toText(req.user?.name, 'Customer')));
  const customerEmail = toText(req.body.customerEmail, toText(req.user?.email, ''));
  const phone = toText(req.body.phone, toText(address.phone, ''));

  if (!items.length || !items[0].name) throw new Error('Order must include at least one product');
  if (!customerName || !customerEmail) throw new Error('Customer name and email are required');
  if (!settings.enableOnlinePayment) throw new Error('Online payment is currently disabled');
  if (!settings.merchantId || !settings.merchantSecret) throw new Error('PayHere merchant credentials are not configured');

  return {
    items,
    subtotal,
    shippingCost,
    totalAmount,
    address,
    customerName,
    customerEmail,
    phone,
    userId: req.user?._id || req.user?.id,
  };
};

const memoryTransactionId = () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const id = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    if (!(store.transactions || []).some((transaction) => transaction.transactionId === id)) return id;
  }
  return `TXN-${Date.now().toString().slice(-6)}`;
};

const createPayHerePayment = async (req, res) => {
  try {
    const settings = await getPaymentSettingsDoc();
    const data = buildOrderData(req, settings);
    const currency = String(settings.currency || 'LKR').toUpperCase();
    await reduceStock(data.items);

    const orderId = global.useMemoryStore
      ? `ORD-${1001 + store.orders.length}`
      : await getNextPublicId(prisma, 'order', 'orderId', 'ORD', 1001);

    let order;
    if (global.useMemoryStore) {
      order = {
        _id: createId(),
        orderId,
        user: data.userId,
        customerId: req.user?.customerId || '',
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        phone: data.phone,
        paymentMethod: 'ONLINE',
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        status: 'pending',
        orderDate: new Date(),
        userId: data.userId,
        address: data.address,
        productName: summaryName(data.items),
        size: summarySize(data.items),
        quantity: data.items.reduce((sum, item) => sum + item.quantity, 0),
        price: data.subtotal,
        shippingCost: data.shippingCost,
        totalAmount: data.totalAmount,
        items: data.items,
        payment: { method: 'card', status: 'pending', reference: '' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.orders.unshift(order);
    } else {
      order = await prisma.$transaction(async (tx) => {
        const customer = await ensureCustomerForOrder(tx, req.user, {
          name: data.customerName,
          email: data.customerEmail,
          phone: data.phone,
        });
        const createdOrder = await tx.order.create({
          data: {
            orderId,
            customerId: customer.id,
            userId: data.userId,
            address: data.address,
            productName: summaryName(data.items),
            size: summarySize(data.items),
            quantity: data.items.reduce((sum, item) => sum + item.quantity, 0),
            price: data.subtotal,
            shippingCost: data.shippingCost,
            totalAmount: data.totalAmount,
            status: 'pending',
            orderStatus: 'PENDING',
            paymentStatus: 'PENDING',
            items: data.items,
          },
        });
        return tx.order.findUnique({
          where: { id: createdOrder.id },
          include: { customer: true, user: { select: { id: true, name: true, email: true, customerId: true } }, transaction: true, transactionRecord: true, invoice: true },
        });
      });
    }

    const backendBase = apiUrl(req);
    const returnUrl = `${backendBase}/api/payments/payhere/success?order_id=${encodeURIComponent(orderId)}`;
    const cancelUrl = `${backendBase}/api/payments/payhere/cancel?order_id=${encodeURIComponent(orderId)}`;
    const notifyUrl = `${backendBase}/api/payments/payhere/notify`;
    const [firstName, ...lastParts] = data.customerName.split(/\s+/);
    const city = data.address.city || data.address.province || 'Colombo';
    const line1 = data.address.line1 || data.address.address || data.address.street || 'Astravia customer address';
    const fields = {
      merchant_id: settings.merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      order_id: orderId,
      items: summaryName(data.items),
      currency,
      amount: money(data.totalAmount),
      first_name: firstName || data.customerName,
      last_name: lastParts.join(' ') || '-',
      email: data.customerEmail,
      phone: data.phone || '0770000000',
      address: line1,
      city,
      country: data.address.country || 'Sri Lanka',
      custom_1: order.id || order._id || '',
      custom_2: 'Astravia',
      hash: checkoutHash({
        merchantId: settings.merchantId,
        orderId,
        amount: data.totalAmount,
        currency,
        merchantSecret: settings.merchantSecret,
      }),
    };

    return res.status(201).json({
      order: normalizeOrder(order),
      gatewayUrl: isSandbox(settings) ? PAYHERE_SANDBOX_URL : PAYHERE_PRODUCTION_URL,
      sandbox: isSandbox(settings),
      fields,
    });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create PayHere payment', error: error.message });
  }
};

const updateMemoryPayment = async ({ order, paid, failed, providerReference, method }) => {
  order.paymentStatus = paid ? 'PAID' : failed ? 'FAILED' : 'PENDING';
  order.orderStatus = paid ? 'PROCESSING' : 'PENDING';
  order.status = paid ? 'processing' : 'pending';
  order.payment = {
    ...(order.payment || {}),
    status: order.paymentStatus.toLowerCase(),
    reference: order.transactionId || providerReference || '',
    paidAt: paid ? new Date() : order.payment?.paidAt,
  };
  order.updatedAt = new Date();

  if (paid && !order.transactionId) {
    store.transactions = store.transactions || [];
    order.transactionId = memoryTransactionId();
    store.transactions.unshift({
      _id: createId(),
      transactionId: order.transactionId,
      orderId: order._id,
      orderReference: order.orderId,
      customerId: order.customerId,
      customer: order.customerName,
      amount: order.totalAmount,
      paymentMethod: method || 'ONLINE',
      paymentStatus: 'PAID',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (paid) {
    await generateInvoiceForOrder(order._id, { paymentStatus: 'PAID', sendEmail: true }).catch((invoiceError) => {
      console.warn('[invoice] PayHere email generation failed', invoiceError.message);
    });
  }
};

const handlePayHereNotify = async (req, res) => {
  try {
    const settings = await getPaymentSettingsDoc();
    const body = req.body || {};
    const merchantId = toText(body.merchant_id);
    const orderId = toText(body.order_id);
    const payhereAmount = toText(body.payhere_amount);
    const payhereCurrency = toText(body.payhere_currency);
    const statusCode = toText(body.status_code);
    const signature = toText(body.md5sig).toUpperCase();

    const localSignature = notifyHash({
      merchantId,
      orderId,
      amount: payhereAmount,
      currency: payhereCurrency,
      statusCode,
      merchantSecret: settings.merchantSecret,
    });

    if (merchantId !== String(settings.merchantId) || !signature || signature !== localSignature) {
      return res.status(400).send('INVALID_SIGNATURE');
    }

    const paid = statusCode === '2';
    const failed = ['0', '-1', '-2', '-3'].includes(statusCode);
    const providerReference = toText(body.payment_id);
    const method = toText(body.method, 'ONLINE').toUpperCase();

    if (global.useMemoryStore) {
      const order = store.orders.find((entry) => entry._id === orderId || entry.id === orderId || entry.orderId === orderId);
      if (!order) return res.status(404).send('ORDER_NOT_FOUND');
      await updateMemoryPayment({ order, paid, failed, providerReference, method });
      return res.status(200).send('OK');
    }

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderId }] },
      include: { customer: true, transaction: true, transactionRecord: true, invoice: true },
    });
    if (!order) return res.status(404).send('ORDER_NOT_FOUND');

    if (paid) {
      const transactionId = order.transactionRecord?.transactionId || order.transaction?.transactionId || await getNextTransactionId(prisma);
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'PAID', orderStatus: 'PROCESSING', status: 'processing' },
        });
        await createTransactionAndInvoice(tx, order, {
          transactionId,
          paymentMethod: method || 'ONLINE',
          paymentStatus: 'PAID',
          amount: Number(payhereAmount || order.totalAmount || 0),
          subtotal: order.price,
          shipping: order.shippingCost,
          grandTotal: order.totalAmount,
          customer: order.customer,
          customerAddress: order.address,
        });
      });
      await generateInvoiceForOrder(order.id, { paymentStatus: 'PAID', sendEmail: true }).catch((invoiceError) => {
        console.warn('[invoice] PayHere email generation failed', invoiceError.message);
      });
    } else if (failed) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED', orderStatus: 'PENDING', status: 'pending' },
      });
      const transaction = order.transactionRecord || order.transaction;
      if (transaction) {
        await prisma.transaction.update({ where: { id: transaction.id }, data: { paymentStatus: 'FAILED' } });
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    return res.status(400).send(error.message || 'PAYMENT_NOTIFY_FAILED');
  }
};

const redirectToFrontend = (path, query = {}) => (req, res) => {
  const params = new URLSearchParams(query);
  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && !params.has(key)) params.set(key, String(value));
  });
  return res.redirect(`${frontendUrl()}${path}${params.toString() ? `?${params.toString()}` : ''}`);
};

const getPaymentOrder = async (req, res) => {
  try {
    const id = req.params.orderId || req.query.order_id;
    if (global.useMemoryStore) {
      const order = store.orders.find((entry) => entry._id === id || entry.id === id || entry.orderId === id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      return res.json(normalizeOrder(order));
    }

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
      include: { customer: true, user: { select: { id: true, name: true, email: true, customerId: true } }, transaction: true, transactionRecord: true, invoice: true },
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(normalizeOrder(order));
  } catch (error) {
    return res.status(400).json({ message: 'Failed to fetch payment order', error: error.message });
  }
};

module.exports = {
  createPayHerePayment,
  handlePayHereNotify,
  payHereSuccess: redirectToFrontend('/order-success'),
  payHereCancel: redirectToFrontend('/payment', { cancelled: 'true' }),
  getPaymentOrder,
};
