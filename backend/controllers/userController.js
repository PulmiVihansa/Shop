const prisma = require('../config/prisma');
const { store, seedBusinessData } = require('../data/memoryStore');
const { ensureCustomerIds } = require('../utils/customerId');
const { withoutPassword, normalizeOrder } = require('../utils/dbFormat');
const { sendAdminEmpty, sendAdminList } = require('../utils/adminApiResponse');

const customerSummary = (user, orders) => {
  const userId = user._id || user.id;
  const userOrders = orders.filter((order) => String(order.user?._id || order.user || order.userId) === String(userId));
  const totalSpent = userOrders.reduce((sum, order) => sum + Number(order.totalAmount ?? order.totalPrice ?? 0), 0);
  return {
    id: userId,
    _id: userId,
    customerId: user.customerId,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    provider: user.provider,
    role: user.role,
    totalOrders: userOrders.length,
    totalSpent,
    orders: userOrders,
    createdAt: user.createdAt
  };
};

const getUsers = async (req, res) => {
  const endpoint = req.originalUrl?.includes('/customers') ? 'GET /api/customers' : 'GET /api/users';
  try {
    if (global.useMemoryStore) {
      await seedBusinessData();
      const data = store.users.map((user) => customerSummary(user, store.orders));
      return sendAdminList(res, endpoint, data, { customers: data, users: data });
    }

    await ensureCustomerIds(prisma);

    const [users, orders] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.order.findMany({
        include: { customer: true, transaction: true, transactionRecord: true, invoice: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    const normalizedOrders = orders.map(normalizeOrder);
    const data = users.map((user) => customerSummary(withoutPassword(user), normalizedOrders));
    return sendAdminList(res, endpoint, data, { customers: data, users: data });
  } catch (error) {
    return sendAdminEmpty(res, endpoint, error);
  }
};

const deleteUser = async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    if (global.useMemoryStore) {
      const index = store.users.findIndex((user) => user._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'User not found' });
      store.users.splice(index, 1);
      return res.json({ message: 'User deleted' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

module.exports = { getUsers, deleteUser };
