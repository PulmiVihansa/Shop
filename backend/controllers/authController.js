const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const { store, createId, seedAdmin, getNextCustomerId } = require('../data/memoryStore');
const { getNextCustomerId: getNextDbCustomerId } = require('../utils/customerId');
const { withId } = require('../utils/dbFormat');
const { avatarUploadsDir, toAvatarImagePath } = require('../middleware/avatarUpload');
const devLog = require('../utils/devLog');

const createToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id }, secret, { expiresIn: '7d' });
};

const logAuthStep = (step, details = {}) => {
  devLog(`[auth] ${step}`, details);
};

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const redirectWithOAuthError = (res, code = 'oauth_failed') => {
  res.redirect(`${getFrontendUrl()}/auth/success?error=${encodeURIComponent(code)}`);
};

const sendAuthResponse = (res, user, status = 200) => {
  const userId = user._id || user.id;
  const token = createToken(userId);
  res.status(status).json({
    token,
    user: {
      id: userId,
      customerId: user.customerId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
};

const serializeUser = (user) => ({
  id: user._id || user.id,
  customerId: user.customerId,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  provider: user.provider,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const isAvatarUploadPath = (value) => String(value || '').startsWith('/uploads/avatars/');

const deleteAvatarFile = (avatarPath) => {
  if (!isAvatarUploadPath(avatarPath)) return;
  const filename = path.basename(avatarPath);
  const resolved = path.resolve(avatarUploadsDir, filename);
  if (resolved.startsWith(path.resolve(avatarUploadsDir))) {
    fs.promises.unlink(resolved).catch(() => {});
  }
};

const redirectGoogleAuthSuccess = (req, res) => {
  try {
    devLog('Google callback user:', req.user);
    logAuthStep('google callback success handler entered', {
      hasUser: Boolean(req.user),
      userId: req.user?._id || req.user?.id,
      email: req.user?.email,
      provider: req.user?.provider
    });

    if (!req.user) {
      return redirectWithOAuthError(res, 'invalid_session');
    }

    const userId = req.user._id || req.user.id;
    const token = createToken(userId);
    devLog('Generated token:', token);
    logAuthStep('google JWT generated', { userId, tokenLength: token.length });
    res.redirect(`${getFrontendUrl()}/auth/success?token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error('[auth] google callback failed to generate token', error);
    redirectWithOAuthError(res, 'token_generation_failed');
  }
};

const handleGoogleAuthFailure = (err, req, res, next) => {
  console.error('[auth] google passport failure', {
    code: err?.code,
    message: err?.message,
    stack: err?.stack
  });

  if (!err) return next();
  if (err.code === 'ACCOUNT_CONFLICT') return redirectWithOAuthError(res, 'account_conflict');
  if (err.code === 'OAUTH_PROFILE_INCOMPLETE') return redirectWithOAuthError(res, 'profile_incomplete');
  return redirectWithOAuthError(res, 'oauth_failed');
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    logAuthStep('register request received', { email: String(email || '').toLowerCase() });

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (global.useMemoryStore) {
      await seedAdmin();
      const existing = store.users.find((user) => user.email === email);
      if (existing) {
        return res.status(409).json({ message: 'Email is already registered' });
      }

      const customerRole = role === 'admin' && process.env.ALLOW_ADMIN_SIGNUP === 'true' ? 'admin' : 'user';
      const user = {
        _id: createId(),
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: customerRole,
        customerId: getNextCustomerId(customerRole === 'admin' ? 'ADMIN' : 'CUS'),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.users.push(user);
      logAuthStep('register completed in memory store', { userId: user._id, email: user.email });
      return res.status(201).json({
        success: true,
        message: 'Account created successfully. Please sign in.'
      });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const shouldAllowAdmin = role === 'admin' && process.env.ALLOW_ADMIN_SIGNUP === 'true';
    const customerRole = shouldAllowAdmin ? 'admin' : 'user';
    const customerId = await getNextDbCustomerId(prisma, customerRole === 'admin' ? 'ADMIN' : 'CUS');

    const user = await prisma.user.create({
      data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: customerRole,
      customerId
      }
    });
    await prisma.customer.create({
      data: {
        customerId,
        userId: user.id,
        name,
        email: normalizedEmail,
        phone: ''
      }
    });

    logAuthStep('register completed in database', { userId: user.id, email: user.email });
    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please sign in.'
    });
  } catch (error) {
    console.error('[auth] register failed', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    logAuthStep('login request received', { email: String(email || '').toLowerCase() });

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

      logAuthStep('login succeeded in memory store', { userId: user._id, email: user.email });
      return sendAuthResponse(res, user);
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Please continue with Google for this account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    logAuthStep('login succeeded in database', { userId: user.id, email: user.email });
    sendAuthResponse(res, withId(user));
  } catch (error) {
    console.error('[auth] login failed', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const getMe = async (req, res) => {
  res.json({ user: serializeUser(req.user) });
};

const updateAvatar = async (req, res) => {
  const nextAvatar = req.file ? toAvatarImagePath(req.file) : '';

  if (!nextAvatar) {
    return res.status(400).json({ message: 'Avatar image is required' });
  }

  try {
    if (global.useMemoryStore) {
      const userId = req.user._id || req.user.id;
      const index = store.users.findIndex((user) => String(user._id || user.id) === String(userId));
      if (index === -1) {
        deleteAvatarFile(nextAvatar);
        return res.status(404).json({ message: 'User not found' });
      }

      const previousAvatar = store.users[index].avatar;
      store.users[index] = { ...store.users[index], avatar: nextAvatar, updatedAt: new Date() };
      deleteAvatarFile(previousAvatar);
      return res.json({ user: serializeUser(store.users[index]) });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!existing) {
      deleteAvatarFile(nextAvatar);
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: nextAvatar }
    });
    deleteAvatarFile(existing.avatar);
    return res.json({ user: serializeUser(user) });
  } catch (error) {
    deleteAvatarFile(nextAvatar);
    console.error('[auth] avatar update failed', error);
    return res.status(500).json({ message: 'Avatar update failed', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateAvatar,
  redirectGoogleAuthSuccess,
  handleGoogleAuthFailure,
  redirectWithOAuthError,
  createToken
};
