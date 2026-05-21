const withId = (record) => {
  if (!record) return record;
  return {
    ...record,
    _id: record.id
  };
};

const withoutPassword = (user) => {
  if (!user) return user;
  const { password, ...safeUser } = user;
  return withId(safeUser);
};

const normalizeOrder = (order) => {
  if (!order) return order;
  return {
    ...withId(order),
    user: order.user ? withId(order.user) : order.userId,
    payment: order.payment || {},
    address: order.address || {},
    items: order.items || []
  };
};

module.exports = { withId, withoutPassword, normalizeOrder };
