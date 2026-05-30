process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
require('dotenv').config();

async function clearOrders() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL.');

    const res = await client.query('DELETE FROM "public"."Order";');
    console.log('Successfully deleted orders. Rows affected:', res.rowCount);

  } catch (error) {
    console.error('Error deleting orders:', error);
  } finally {
    await client.end();
  }
}

clearOrders();
