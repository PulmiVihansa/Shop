const prisma = require('./prisma');

const connectDB = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    await prisma.$connect();
    global.useMemoryStore = false;
    console.log('PostgreSQL connected');
  } catch (error) {
    global.useMemoryStore = true;
    console.warn('PostgreSQL unavailable, using in-memory development store:', error.message);
  }
};

module.exports = connectDB;
