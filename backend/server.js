const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

// Load environment variables.
dotenv.config();

const app = express();

// Connect to MongoDB.
connectDB();

// Global middleware.
app.use(cors());
app.use(express.json());

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Health check route.
app.get('/', (req, res) => {
  res.json({ message: 'Shop API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
