const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
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
const cmsRoutes = require('./routes/cmsRoutes');

// Load environment variables.
dotenv.config();

const app = express();

// Connect to PostgreSQL.
connectDB();

// Global middleware.
app.use(cors());
app.use(express.json({ limit: '12mb' }));

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bulk-orders', bulkOrderRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/cms', cmsRoutes);

// Health check route.
app.get('/', (req, res) => {
  res.json({ message: 'Shop API is running' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to a free value.`);
    process.exit(1);
  }

  console.error('Server error:', err);
  process.exit(1);
});

const shutdown = (signal) => {
  server.close(() => {
    process.exit(0);
  });

  // Force-exit if the server doesn't close in time.
  setTimeout(() => process.exit(1), 5000).unref();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Nodemon uses SIGUSR2 for restarts on many platforms.
process.once('SIGUSR2', () => {
  server.close(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});
