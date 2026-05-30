const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to Prisma...');
    await prisma.$connect();
    console.log('Connected successfully.');

    const usersCount = await prisma.user.count();
    const ordersCount = await prisma.order.count();
    const productsCount = await prisma.product.count();

    console.log('Database Stats:');
    console.log(`- Users: ${usersCount}`);
    console.log(`- Orders: ${ordersCount}`);
    console.log(`- Products: ${productsCount}`);

    const users = await prisma.user.findMany({ take: 5 });
    console.log('Sample Users:', users.map(u => ({ id: u.id, email: u.email, role: u.role, customerId: u.customerId })));

  } catch (error) {
    console.error('Error during DB connection/query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
