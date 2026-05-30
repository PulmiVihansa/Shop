const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const prisma = require('../config/prisma');
const { seedAdmin } = require('../data/memoryStore');

dotenv.config();

async function createAdmin() {
  const name = process.env.ADMIN_NAME || 'ATELIER Admin';
  const email = process.env.ADMIN_EMAIL || 'admin@atelier.com';
  const password = process.env.ADMIN_PASSWORD || 'admin12345';

  await connectDB();

  if (global.useMemoryStore) {
    const admin = await seedAdmin();
    console.log(`Development admin ready in memory: ${admin.email}`);
    console.log('Start the backend with npm.cmd run dev, then log in before restarting the server.');
    process.exit(0);
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  const hashedPassword = await bcrypt.hash(password, 10);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        password: hashedPassword,
        role: 'admin',
        customerId: existing.customerId || 'ADMIN-001'
      }
    });
    console.log(`Admin updated: ${email}`);
  } else {
    await prisma.user.create({
      data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      customerId: 'ADMIN-001'
      }
    });
    console.log(`Admin created: ${email}`);
  }

  process.exit(0);
}

createAdmin().catch((error) => {
  console.error('Failed to create admin:', error.message);
  process.exit(1);
});
