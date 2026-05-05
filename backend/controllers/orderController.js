const Order = require('../models/Order');
const Product = require('../models/Product');
const { store, createId } = require('../data/memoryStore');
const { getPaymentSettingsDoc } = require('./paymentSettingsController');

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

  await Promise.all(items
    .filter((item) => item.product)
    .map((item) => Product.findByIdAndUpdate(item.product, {
      $inc: {
        stock: -Number(item.quantity || 1),
        ...(item.size ? { [`sizeStock.${item.size}`]: -Number(item.quantity || 1) } : {})
      }
    })));
};

const createOrder = async (req, res) => {
  try {
    const { items, address, payment } = req.body;
    const settings = await getPaymentSettingsDoc();

    if (!items?.length) {
      return res.status(400).json({ message: 'Order must include at least one item' });
    }

    if (!address?.fullName || !address?.line1 || !address?.city || !address?.postalCode || !address?.country) {
      return res.status(400).json({ message: 'Shipping address is incomplete' });
    }

    const normalizedItems = items.map((item) => ({
      product: item.product || (String(item.id || '').match(/^[a-f\d]{24}$/i) ? item.id : undefined),
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity || 1),
      size: item.size || 'One Size',
      imageClass: item.imageClass || ''
    }));

    const totalPrice = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const requestedMethod = String(payment?.method || 'ONLINE').toUpperCase();
    const paymentMethod = requestedMethod === 'COD' ? 'COD' : 'ONLINE';

    if (paymentMethod === 'COD' && !settings.enableCOD) {
      return res.status(400).json({ message: 'Cash on Delivery is currently disabled' });
    }

    if (paymentMethod === 'ONLINE' && !settings.enableOnlinePayment) {
      return res.status(400).json({ message: 'Online payment is currently disabled' });
    }

    const paymentStatus = paymentMethod === 'COD' ? 'PENDING' : 'PAID';
    const transactionId = paymentMethod === 'ONLINE'
      ? payment?.transactionId || `SIM-${Date.now().toString(36).toUpperCase()}`
      : '';
    const paymentInfo = {
      method: paymentMethod === 'COD' ? 'cod' : 'card',
      status: paymentStatus === 'PAID' ? 'paid' : 'pending',
      reference: payment?.reference || transactionId || `ATL-${Date.now().toString(36).toUpperCase()}`,
      paidAt: paymentStatus === 'PAID' ? new Date() : undefined
    };
    const paymentRequest = paymentMethod === 'ONLINE' ? {
      provider: settings.paymentProvider || 'PayHere',
      merchant_id: settings.merchantId,
      return_url: process.env.PAYMENT_RETURN_URL || 'http://localhost:5173/order-success',
      cancel_url: process.env.PAYMENT_CANCEL_URL || 'http://localhost:5173/checkout',
      notify_url: process.env.PAYMENT_NOTIFY_URL || 'http://localhost:5000/api/payment/notify',
      currency: settings.currency || 'LKR',
      amount: totalPrice,
      order_id: undefined
    } : null;
    await reduceStock(normalizedItems);

    if (global.useMemoryStore) {
      const order = {
        _id: createId(),
        user: req.user._id,
        items: normalizedItems,
        totalPrice,
        paymentMethod,
        paymentStatus,
        transactionId,
        status: 'pending',
        payment: paymentInfo,
        address,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      if (paymentRequest) paymentRequest.order_id = order._id;
      store.orders.unshift(order);
      return res.status(201).json({ ...order, paymentRequest });
    }

    const order = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      totalPrice,
      paymentMethod,
      paymentStatus,
      transactionId,
      payment: paymentInfo,
      address
    });

    if (paymentRequest) paymentRequest.order_id = order._id;
    res.status(201).json({ ...order.toObject(), paymentRequest });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create order', error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      return res.json(store.orders.filter((order) => order.user === req.user._id));
    }

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const orders = store.orders.map((order) => ({
        ...order,
        user: store.users.find((user) => user._id === order.user) || { name: 'Customer', email: '' }
      }));
      return res.json(orders);
    }

    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    if (global.useMemoryStore) {
      const order = store.orders.find((entry) => entry._id === req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      order.status = status;
      order.updatedAt = new Date();
      return res.json(order);
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update order', error: error.message });
  }
};

module.exports = { createOrder, getUserOrders, getAllOrders, updateOrderStatus };
