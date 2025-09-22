const https = require('https');

const endpoints = [
  '/.netlify/functions/create-donation-intent',
  '/.netlify/functions/create-checkout-session',
  '/.netlify/functions/create-general-donation',
  '/.netlify/functions/stripe-webhook',
  '/.netlify/functions/stripe-webhook-orders',
  '/.netlify/functions/products',
  '/.netlify/functions/auth',
  '/.netlify/functions/community'
];

function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'ositosbendecidos.com',
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) {
          console.log(`❌ ${path} - NOT FOUND`);
        } else if (res.statusCode === 405) {
          console.log(`✅ ${path} - EXISTS (Method not allowed for GET)`);
        } else if (res.statusCode === 401) {
          console.log(`✅ ${path} - EXISTS (Auth required)`);
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${path} - EXISTS (${res.statusCode})`);
        } else {
          console.log(`⚠️ ${path} - Status: ${res.statusCode}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${path} - Error: ${err.message}`);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`⚠️ ${path} - Timeout`);
      resolve();
    });

    req.end();
  });
}

async function testAll() {
  console.log('Testing all Netlify Functions endpoints...\n');

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }

  console.log('\n✅ Functions that exist are deployed');
  console.log('❌ Functions that return 404 are NOT deployed yet');
}

testAll();