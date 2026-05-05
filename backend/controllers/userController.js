const User = require('../models/User');
const Order = require('../models/Order');
const { store, seedBusinessData } = require('../data/memoryStore');

const customerSummary = (user, orders) => {
  const userOrders = orders.filter((order) => String(order.user?._id || order.user) === String(user._id));
  const totalSpent = userOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    totalOrders: userOrders.length,
    totalSpent,
    orders: userOrders,
    createdAt: user.createdAt
  };
};

const getUsers = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      await seedBusinessData();
      return res.json(store.users.map((user) => customerSummary(user, store.orders)));
    }

    const [users, orders] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }),
      Order.find().sort({ createdAt: -1 })
    ]);
    res.json(users.map((user) => customerSummary(user, orders)));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
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

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

module.exports = { getUsers, deleteUser };
