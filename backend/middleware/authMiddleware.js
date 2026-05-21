const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { store, seedAdmin } = require('../data/memoryStore');
const { withoutPassword } = require('../utils/dbFormat');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (global.useMemoryStore) {
      await seedAdmin();
      const user = store.users.find((entry) => entry._id === decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = { ...user, password: undefined };
      return next();
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = withoutPassword(user);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
