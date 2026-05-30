async function test() {
  try {
    console.log('Logging in as admin...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@atelier.com',
        password: 'admin12345'
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const token = loginData.token;
    console.log('Login successful. Token:', token.slice(0, 15) + '...');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const endpoints = [
      '/products',
      '/orders',
      '/users',
      '/analytics',
      '/finance',
      '/bulk-orders/customers',
      '/settings/payment',
      '/content/homepage',
      '/content/banners',
      '/settings'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Fetching ${endpoint}...`);
        const res = await fetch(`http://localhost:5000/api${endpoint}`, { headers });
        const data = await res.json();
        if (res.ok) {
          console.log(`  Success! Status: ${res.status}, data length/keys:`, Array.isArray(data) ? data.length : Object.keys(data));
        } else {
          console.error(`  Failed fetching ${endpoint}: Status: ${res.status}, data:`, data);
        }
      } catch (err) {
        console.error(`  Error fetching ${endpoint}:`, err.message);
      }
    }

  } catch (error) {
    console.error('Test run failed:', error.message);
  }
}

test();
