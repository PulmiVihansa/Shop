process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

async function testPooler() {
  const url = "postgresql://postgres.dzusptvrtndsvfvzytqm:Testpulsanu123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true";
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Successfully connected to Supabase pooler on port 6543.');
    const res = await client.query('SELECT NOW();');
    console.log('Result:', res.rows[0]);
  } catch (err) {
    console.error('Failed to connect on 6543:', err.message);
  } finally {
    await client.end();
  }
}

testPooler();
