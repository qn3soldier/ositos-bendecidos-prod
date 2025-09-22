const https = require('https');

// Test general donation endpoint
function testGeneralDonation() {
  const data = JSON.stringify({
    amount: 10,
    donorName: "Test Donor",
    donorEmail: "test@test.com",
    message: "Test donation",
    isAnonymous: false
  });

  const options = {
    hostname: 'ositosbendecidos.com',
    path: '/.netlify/functions/create-general-donation',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('Testing General Donation API...');

  const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(responseData);
        if (parsed.clientSecret) {
          console.log('✅ Success! Payment Intent created');
          console.log('Payment Intent ID:', parsed.paymentIntentId);
        } else {
          console.log('Response:', parsed);
        }
      } catch (e) {
        console.log('Response:', responseData.substring(0, 200));
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.write(data);
  req.end();
}

// Test checkout session endpoint
function testCheckoutSession() {
  const data = JSON.stringify({
    items: [{
      id: 'test-1',
      name: 'Test Product',
      price: 29.99,
      quantity: 1,
      image: 'https://via.placeholder.com/200'
    }],
    customerEmail: 'test@example.com',
    customerName: 'Test Customer',
    shippingAddress: {
      street: '123 Test St',
      city: 'Sunrise',
      state: 'FL',
      zip: '33322',
      country: 'US'
    }
  });

  const options = {
    hostname: 'ositosbendecidos.com',
    path: '/.netlify/functions/create-checkout-session',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('\nTesting Shop Checkout API...');

  const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(responseData);
        if (parsed.url) {
          console.log('✅ Success! Checkout session created');
          console.log('Checkout URL:', parsed.url);
        } else {
          console.log('Response:', parsed);
        }
      } catch (e) {
        console.log('Response:', responseData.substring(0, 200));
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.write(data);
  req.end();
}

// Run tests
testGeneralDonation();
setTimeout(() => testCheckoutSession(), 2000);