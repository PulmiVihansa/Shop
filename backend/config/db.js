const mongoose = require('mongoose');

// Connect to MongoDB using Mongoose.
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    await mongoose.connect(uri);
    global.useMemoryStore = false;
    console.log('MongoDB connected');
  } catch (error) {
    global.useMemoryStore = true;
    console.warn('MongoDB unavailable, using in-memory development store:', error.message);
  }
};

module.exports = connectDB;
