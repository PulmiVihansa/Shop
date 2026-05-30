process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
require('dotenv').config();

async function inspect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL.');

    // 1. Get column names
    const columnsRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Order' AND table_schema = 'public';
    `);
    console.log('Columns in "Order" table:');
    columnsRes.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 2. Select rows
    const rowsRes = await client.query('SELECT * FROM "public"."Order" LIMIT 5;');
    console.log('Rows in "Order" table:', rowsRes.rows);

  } catch (error) {
    console.error('Error during DB inspection:', error);
  } finally {
    await client.end();
  }
}

inspect();
