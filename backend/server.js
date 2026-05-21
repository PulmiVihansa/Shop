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

// Health check route.
app.get('/', (req, res) => {
  res.json({ message: 'Shop API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
