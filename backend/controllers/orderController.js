const prisma = require('../config/prisma');
const { store, createId } = require('../data/memoryStore');
const { getPaymentSettingsDoc } = require('./paymentSettingsController');
const { normalizeOrder } = require('../utils/dbFormat');
const {
  getNextPublicId,
  ensureCustomerForOrder,
  createTransactionAndInvoice
} = require('../services/orderDocumentService');
const { generateInvoiceForOrder } = require('../services/invoiceService');

const ORDER_STATUS_ALLOWED = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_ALLOWED = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value, fallback = '') => {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const memoryOrderMatches = (order, id) => (
  String(order._id || '') === String(id) ||
  String(order.id || '') === String(id) ||
  String(order.orderId || '') === String(id)
);

const findOrderByAnyId = (id, include = {}) => prisma.order.findFirst({
  where: {
    OR: [
      { id },
      { orderId: id }
    ]
  },
  include
});

const orderStatusData = (status) => ({
  status,
  orderStatus: status.toUpperCase()
});

const buildSummaryProductName = (items) => {
  if (!items.length) return 'Product';
  if (items.length === 1) return items[0].name || 'Product';
  return `${items[0].name || 'Product'} +${items.length - 1} more`;
};

const buildSummarySize = (items) => {
  const unique = Array.from(new Set(items.map((item) => item.size || 'One Size')));
  return unique.length === 1 ? unique[0] : 'Mixed';
};

const createMemoryTransactionId = () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const transactionId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    if (!(store.transactions || []).some((transaction) => transaction.transactionId === transactionId)) return transactionId;
  }
  return `TXN-${Date.now().toString().slice(-6)}`;
};

const reduceStock = async (items) => {
  if (global.useMemoryStore) {
    items.forEach((item) => {
      const product = store.products.find((entry) => entry._id === item.product);
      if (product) {
        product.sizeStock = product.sizeStock || {};
        if (item.size && product.sizeStock[item.size] !== undefined) {
          product.sizeStock[item.size] = Math.max(0, Number(product.sizeStock[item.size] || 0) - Number(item.quantity || 1));
        }
        product.stock = Math.max(0, Number(product.stock || 0) - Number(item.quantity || 1));
      }
    });
    return;
  }

  await Promise.all(
    items
      .filter((item) => item.product)
      .map(async (item) => {
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
            sizeStock: nextSizeStock
          }
        });
      })
  );
};

const createOrder = async (req, res) => {
  try {
    const settings = await getPaymentSettingsDoc();
    const incomingItems = Array.isArray(req.body.items) ? req.body.items : [];

    const items = incomingItems.length
      ? incomingItems.map((item) => ({
          product: item.product || item.productId || item.id || undefined,
          name: toText(item.name, toText(req.body.productName, 'Product')),
          price: toNumber(item.price, 0),
          quantity: Math.max(1, Math.trunc(toNumber(item.quantity, 1))),
          size: toText(item.size, toText(req.body.size, 'One Size')),
          image: toText(item.image, '')
        }))
      : [
          {
            product: req.body.product || undefined,
            name: toText(req.body.productName, 'Product'),
            price: toNumber(req.body.price, 0),
            quantity: Math.max(1, Math.trunc(toNumber(req.body.quantity, 1))),
            size: toText(req.body.size, 'One Size'),
          }
        ];

    if (!items.length || !items[0].name) {
      return res.status(400).json({ message: 'Order must include at least one product' });
    }

    const address = req.body.address || {};
    const customerName = toText(req.body.customerName, toText(address.fullName, toText(req.user?.name, 'Customer')));
    const customerEmail = toText(req.body.customerEmail, toText(req.user?.email, ''));
    const phone = toText(req.body.phone, toText(address.phone, ''));

    if (!customerName || !customerEmail) {
      return res.status(400).json({ message: 'Customer name and email are required' });
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
    const requestedMethod = String(req.body.payment?.method || req.body.paymentMethod || 'ONLINE').toUpperCase();
    const paymentMethod = requestedMethod === 'COD' ? 'COD' : 'ONLINE';

    if (paymentMethod === 'COD' && !settings.enableCOD) {
      return res.status(400).json({ message: 'Cash on Delivery is currently disabled' });
    }

    if (paymentMethod === 'ONLINE' && !settings.enableOnlinePayment) {
      return res.status(400).json({ message: 'Online payment is currently disabled' });
    }

    const defaultDelivery = subtotal > 25000 || subtotal === 0 ? 0 : 650;
    const codHandling = paymentMethod === 'COD' ? 250 : 0;
    const shippingCost = Math.max(0, toNumber(req.body.shippingCost, defaultDelivery + codHandling));
    const totalAmount = Math.max(0, toNumber(req.body.totalAmount, subtotal + shippingCost));

    const incomingTransactionReference = req.body.payment?.transactionId || req.body.transactionId || '';
    const paymentSucceeded = paymentMethod === 'ONLINE' && Boolean(incomingTransactionReference || req.body.paymentStatus === 'PAID');
    const paymentStatus = paymentSucceeded ? 'PAID' : 'PENDING';

    const paymentInfo = {
      method: paymentMethod === 'COD' ? 'cod' : 'card',
      status: paymentStatus === 'PAID' ? 'paid' : 'pending',
      reference: req.body.payment?.reference || incomingTransactionReference || '',
      paidAt: paymentStatus === 'PAID' ? new Date() : undefined
    };

    const orderStatus = toText(req.body.orderStatus, paymentSucceeded ? 'processing' : 'pending').toLowerCase();
    const safeOrderStatus = ORDER_STATUS_ALLOWED.includes(orderStatus) ? orderStatus : 'pending';

    await reduceStock(items);

    const userId = req.user._id || req.user.id;
    const orderId = global.useMemoryStore
      ? `ORD-${1001 + store.orders.length}`
      : await getNextPublicId(prisma, 'order', 'orderId', 'ORD', 1001);
    const orderPayload = {
      userId,
      address,
      productName: toText(req.body.productName, buildSummaryProductName(items)),
      size: toText(req.body.size, buildSummarySize(items)),
      quantity: Math.max(1, Math.trunc(toNumber(req.body.quantity, items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)))),
      price: toNumber(req.body.price, subtotal),
      shippingCost,
      totalAmount,
      status: safeOrderStatus,
      orderStatus: safeOrderStatus.toUpperCase(),
      paymentStatus,
      items,
    };

    const paymentRequest =
      paymentMethod === 'ONLINE'
        ? {
            provider: settings.paymentProvider || 'PayHere',
            merchant_id: settings.merchantId,
            return_url: process.env.PAYMENT_RETURN_URL || 'http://localhost:5173/order-success',
            cancel_url: process.env.PAYMENT_CANCEL_URL || 'http://localhost:5173/checkout',
            notify_url: process.env.PAYMENT_NOTIFY_URL || 'http://localhost:5000/api/payment/notify',
            currency: settings.currency || 'LKR',
            amount: totalAmount,
            order_id: orderId
          }
        : null;

    if (global.useMemoryStore) {
      const transactionId = paymentSucceeded ? createMemoryTransactionId() : '';
      const order = {
        _id: createId(),
        user: userId,
        customerId: req.user.customerId,
        customerName,
        customerEmail,
        phone,
        paymentMethod,
        paymentStatus,
        transactionId,
        orderStatus: safeOrderStatus.toUpperCase(),
        orderDate: new Date(),
        ...orderPayload,
        orderId,
        payment: { ...paymentInfo, reference: transactionId || paymentInfo.reference },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.orders.unshift(order);
      if (paymentSucceeded) {
        store.transactions = store.transactions || [];
        store.invoices = store.invoices || [];
        const transaction = {
          _id: createId(),
          transactionId,
          orderId: order._id,
          orderReference: order.orderId,
          customerId: order.customerId,
          customer: customerName,
          amount: totalAmount,
          paymentMethod,
          paymentStatus,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const invoice = {
          _id: createId(),
          invoiceId: `INV-${new Date().getFullYear()}-${String(1001 + store.invoices.length).padStart(4, '0')}`,
          orderId: order._id,
          orderReference: order.orderId,
          transactionId,
          customerId: order.customerId,
          customer: customerName,
          email: customerEmail,
          subtotal,
          shipping: shippingCost,
          tax: 0,
          grandTotal: totalAmount,
          status: 'Paid',
          products: items,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        store.transactions.unshift(transaction);
        store.invoices.unshift(invoice);
        order.invoiceId = invoice.invoiceId;
        await generateInvoiceForOrder(order._id, { paymentStatus: 'PAID', sendEmail: false }).catch(() => {});
      }
      return res.status(201).json({ ...normalizeOrder(order), paymentRequest });
    }

    const order = await prisma.$transaction(async (tx) => {
      const customer = await ensureCustomerForOrder(tx, req.user, {
        name: customerName,
        email: customerEmail,
        phone
      });
      const createdOrder = await tx.order.create({
        data: {
          ...orderPayload,
          orderId,
          customerId: customer.id
        }
      });

      if (paymentSucceeded) {
        await createTransactionAndInvoice(tx, createdOrder, {
          paymentMethod,
          paymentStatus,
          amount: totalAmount,
          subtotal,
          shipping: shippingCost,
          tax: 0,
          grandTotal: totalAmount
        });
      }

      return tx.order.findUnique({
        where: { id: createdOrder.id },
        include: {
          customer: true,
          user: { select: { id: true, name: true, email: true, customerId: true } },
          transaction: true,
          transactionRecord: true,
          invoice: true
        }
      });
    });
    if (paymentSucceeded) {
      await generateInvoiceForOrder(order.id, { paymentStatus: 'PAID', sendEmail: false }).catch((invoiceError) => {
        console.warn('[invoice] automatic generation failed', invoiceError.message);
      });
    }
    return res.status(201).json({ ...normalizeOrder(order), paymentRequest });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create order', error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const orders = store.orders.filter((order) => String(order.user) === String(req.user._id || req.user.id));
      return res.json(orders.map(normalizeOrder));
    }

    const orders = await prisma.order.findMany({
      where: { userId: req.user._id || req.user.id },
      include: {
        customer: true,
        transaction: true,
        transactionRecord: true,
        invoice: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(orders.map(normalizeOrder));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const orders = store.orders.map((order) => ({
        ...order,
        user: store.users.find((user) => user._id === order.user) || { name: 'Customer', email: '' }
      }));
      return res.json(orders.map(normalizeOrder));
    }

    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, customerId: true } },
        customer: true,
        transaction: true,
        transactionRecord: true,
        invoice: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(orders.map(normalizeOrder));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderStatus = String(req.body.status || req.body.orderStatus || '').toLowerCase();
    if (!ORDER_STATUS_ALLOWED.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    if (global.useMemoryStore) {
      const order = store.orders.find((entry) => memoryOrderMatches(entry, req.params.id));
      if (!order) return res.status(404).json({ message: 'Order not found' });
      order.orderStatus = orderStatus.toUpperCase();
      order.status = orderStatus;
      order.updatedAt = new Date();
      return res.json(normalizeOrder(order));
    }

    const existing = await findOrderByAnyId(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Order not found' });
    const order = await prisma.order.update({
      where: { id: existing.id },
      data: orderStatusData(orderStatus),
      include: {
        user: { select: { id: true, name: true, email: true, customerId: true } },
        customer: true,
        transaction: true,
        transactionRecord: true,
        invoice: true
      }
    });
    return res.json(normalizeOrder(order));
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update order', error: error.message });
  }
};

const updateOrderPaymentStatus = async (req, res) => {
  try {
    const paymentStatus = String(req.body.paymentStatus || '').toUpperCase();
    if (!PAYMENT_STATUS_ALLOWED.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    if (global.useMemoryStore) {
      const order = store.orders.find((entry) => memoryOrderMatches(entry, req.params.id));
      if (!order) return res.status(404).json({ message: 'Order not found' });
      order.paymentStatus = paymentStatus;
      order.payment = {
        ...(order.payment || {}),
        status: paymentStatus.toLowerCase()
      };
      order.updatedAt = new Date();
      return res.json(normalizeOrder(order));
    }

    const existing = await findOrderByAnyId(req.params.id, {
      include: { transaction: true, transactionRecord: true }
    });
    if (!existing) return res.status(404).json({ message: 'Order not found' });

    const order = await prisma.$transaction(async (tx) => {
      const transaction = existing.transaction || existing.transactionRecord;
      const nextOrderData = {
        paymentStatus,
        ...(paymentStatus === 'PAID' ? orderStatusData('processing') : {})
      };

      await tx.order.update({
        where: { id: existing.id },
        data: nextOrderData
      });

      if (transaction) {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { paymentStatus }
        });
      }

      if (paymentStatus === 'PAID' && !transaction) {
        await createTransactionAndInvoice(tx, existing, {
          paymentMethod: req.body.paymentMethod || 'COD',
          paymentStatus
        }).catch(() => null);
      }

      return tx.order.findUnique({
        where: { id: existing.id },
        include: {
          user: { select: { id: true, name: true, email: true, customerId: true } },
          customer: true,
          transaction: true,
          transactionRecord: true,
          invoice: true
        }
      });
    });
    if (paymentStatus === 'PAID' || paymentStatus === 'REFUNDED') {
      await generateInvoiceForOrder(order.id, { paymentStatus, sendEmail: false }).catch((invoiceError) => {
        console.warn('[invoice] status-change generation failed', invoiceError.message);
      });
    }
    return res.json(normalizeOrder(order));
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update payment status', error: error.message });
  }
};

module.exports = { createOrder, getUserOrders, getAllOrders, updateOrderStatus, updateOrderPaymentStatus };
