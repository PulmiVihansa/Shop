const prisma = require('../config/prisma');
const { ensureCustomerIds, backfillOrderCustomerIds } = require('../utils/customerId');

async function run() {
  try {
    await ensureCustomerIds(prisma);
    await backfillOrderCustomerIds(prisma);
    console.log('Customer ID backfill complete.');
  } catch (error) {
    console.error('Customer ID backfill failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
