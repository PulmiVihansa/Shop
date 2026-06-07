const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const path = require('path');
const connectDB = require('./config/db');
const { configurePassport } = require('./config/passport');
const devLog = require('./utils/devLog');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const financeRoutes = require('./routes/financeRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const bulkOrderRoutes = require('./routes/bulkOrderRoutes');
const settingRoutes = require('./routes/settingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const contentRoutes = require('./routes/contentRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const virtualTryOnRoutes = require('./routes/virtualTryOnRoutes');
const salesRoutes = require('./routes/salesRoutes');
const featuredProductRoutes = require('./routes/featuredProductRoutes');
const giftVoucherRoutes = require('./routes/giftVoucherRoutes');
const contactRoutes = require('./routes/contactRoutes');

// Load environment variables.
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

devLog('[server] environment bootstrap', {
  cwd: process.cwd(),
  backendDir: __dirname,
  hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
  hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
  hasJwtSecret: Boolean(process.env.JWT_SECRET),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
});

const app = express();
const allowedOrigins = String(process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5180')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const staticCacheOptions = {
  maxAge: process.env.NODE_ENV === 'production' ? '30d' : 0,
  etag: true,
  immutable: process.env.NODE_ENV === 'production',
  setHeaders: (res, filePath) => {
    if (filePath.toLowerCase().endsWith('.avif')) {
      res.setHeader('Content-Type', 'image/avif');
    }
    res.setHeader('Vary', 'Accept-Encoding');
  }
};

const cachePublicRead = (seconds) => (req, res, next) => {
  if (req.method === 'GET' && !req.headers.authorization) {
    res.setHeader('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
  }
  next();
};

// Connect to PostgreSQL.
connectDB();
configurePassport();

// Global middleware.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticCacheOptions));
app.use('/uploads/invoices', express.static(path.join(__dirname, 'uploads', 'invoices'), staticCacheOptions));
app.use('/storage/invoices', express.static(path.join(__dirname, 'storage', 'invoices'), staticCacheOptions));
app.use('/storage/gift-vouchers', express.static(path.join(__dirname, 'storage', 'gift-vouchers'), staticCacheOptions));

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/products', cachePublicRead(120), productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', userRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bulk-orders', bulkOrderRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/virtual-tryon', virtualTryOnRoutes);
app.use('/api/sales', cachePublicRead(120), salesRoutes);
app.use('/api/featured-products', cachePublicRead(120), featuredProductRoutes);
app.use('/api/gift-vouchers', giftVoucherRoutes);
app.use('/api/contact', contactRoutes);

// Health check route.
app.get('/', (req, res) => {
  res.json({ message: 'Shop API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'astravia-api',
    storage: global.useMemoryStore ? 'memory' : 'postgres',
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message
  });
});

const basePort = Number(process.env.PORT || 5000);

function startServer(port, attemptsLeft = 10) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
      server.close(() => startServer(port + 1, attemptsLeft - 1));
      return;
    }

    throw error;
  });
}

startServer(basePort);
