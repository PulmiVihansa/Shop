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

// Connect to PostgreSQL.
connectDB();
configurePassport();

// Global middleware.
app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use(passport.initialize());

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

// Health check route.
app.get('/', (req, res) => {
  res.json({ message: 'Shop API is running' });
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
