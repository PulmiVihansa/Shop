const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { store, createId, seedAdmin } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');

const createToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id }, secret, { expiresIn: '7d' });
};

const sendAuthResponse = (res, user, status = 200) => {
  const userId = user._id || user.id;
  const token = createToken(userId);
  res.status(status).json({
    token,
    user: {
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (global.useMemoryStore) {
      await seedAdmin();
      const existing = store.users.find((user) => user.email === email);
      if (existing) {
        return res.status(409).json({ message: 'Email is already registered' });
      }

      const user = {
        _id: createId(),
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: role === 'admin' && process.env.ALLOW_ADMIN_SIGNUP === 'true' ? 'admin' : 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.users.push(user);
      return sendAuthResponse(res, user, 201);
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const shouldAllowAdmin = role === 'admin' && process.env.ALLOW_ADMIN_SIGNUP === 'true';

    const user = await prisma.user.create({
      data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: shouldAllowAdmin ? 'admin' : 'user'
      }
    });

    sendAuthResponse(res, withId(user), 201);
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (global.useMemoryStore) {
      await seedAdmin();
      const user = store.users.find((entry) => entry.email === email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      return sendAuthResponse(res, user);
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    sendAuthResponse(res, withId(user));
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user._id || req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
};

module.exports = { registerUser, loginUser, getMe };
