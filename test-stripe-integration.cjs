const https = require('https');

// Test General Donation
function testGeneralDonation() {
  const data = JSON.stringify({
    amount: 25,
    donorName: "Test Donor",
    donorEmail: "test@example.com",
    message: "Test donation from API",
    isAnonymous: false,
    purpose: "general_fund"
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

  console.log('=== Testing General Donation ===');

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
          console.log('✅ SUCCESS! Payment Intent created');
          console.log('Payment Intent ID:', parsed.paymentIntentId);
          console.log('Client Secret:', parsed.clientSecret.substring(0, 30) + '...');
          console.log('\nYou can now complete the donation at:');
          console.log('https://ositosbendecidos.com/donate');
        } else if (parsed.error) {
          console.log('❌ Error:', parsed.error);
        } else {
          console.log('Response:', parsed);
        }
      } catch (e) {
        console.log('Response:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request Error:', error);
  });

  req.write(data);
  req.end();
}

// Test Shop Checkout
function testShopCheckout() {
  const data = JSON.stringify({
    items: [{
      id: 'test-product-1',
      name: 'Test Product',
      price: 29.99,
      quantity: 2,
      image: 'https://via.placeholder.com/200'
    }],
    customerEmail: 'customer@example.com',
    customerName: 'John Doe',
    shippingAddress: {
      street: '123 Main St',
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

  console.log('\n=== Testing Shop Checkout ===');

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
          console.log('✅ SUCCESS! Checkout session created');
          console.log('Session ID:', parsed.sessionId);
          console.log('\n🔗 Complete checkout at:');
          console.log(parsed.url);
        } else if (parsed.error) {
          console.log('❌ Error:', parsed.error);
        } else {
          console.log('Response:', parsed);
        }
      } catch (e) {
        console.log('Response:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request Error:', error);
  });

  req.write(data);
  req.end();
}

// Run tests
console.log('Testing Stripe Integration...\n');
testGeneralDonation();
setTimeout(() => testShopCheckout(), 2000);