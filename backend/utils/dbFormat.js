const withId = (record) => {
  if (!record) return record;
  return {
    ...record,
    _id: record.id || record._id
  };
};

const withoutPassword = (user) => {
  if (!user) return user;
  const { password, ...safeUser } = user;
  return withId(safeUser);
};

const normalizeOrder = (order) => {
  if (!order) return order;
  const items = Array.isArray(order.items) ? order.items : order.items || [];
  const fallbackFirstItem = items[0] || {};
  const customerName = order.customerName || order.address?.fullName || order.user?.name || 'Customer';
  const customerEmail = order.customerEmail || order.user?.email || '';
  const customerId = order.customerId || order.user?.customerId || '';
  const phone = order.phone || order.address?.phone || '';
  const orderStatus = order.orderStatus || order.status || 'pending';
  const paymentStatus = order.paymentStatus || 'PENDING';
  const orderId = order.orderId || String(order._id || order.id || '').slice(-8).toUpperCase();
  const totalAmount = Number(order.totalAmount ?? order.totalPrice ?? 0);
  const quantity = Number(order.quantity ?? fallbackFirstItem.quantity ?? 1);
  const price = Number(order.price ?? fallbackFirstItem.price ?? 0);
  const shippingCost = Number(order.shippingCost ?? 0);

  return {
    ...withId(order),
    orderId,
    customerId,
    customerName,
    customerEmail,
    phone,
    productName: order.productName || fallbackFirstItem.name || 'Product',
    size: order.size || fallbackFirstItem.size || 'One Size',
    quantity,
    price,
    shippingCost,
    totalAmount,
    orderStatus,
    orderDate: order.orderDate || order.createdAt,
    paymentMethod: order.paymentMethod || 'ONLINE',
    paymentStatus,
    transactionId: order.transactionId || '',
    user: order.user ? withId(order.user) : order.userId,
    payment: order.payment || {},
    address: order.address || {},
    items,
    totalPrice: totalAmount,
    status: orderStatus
  };
};

module.exports = { withId, withoutPassword, normalizeOrder };
