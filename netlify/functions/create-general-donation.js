const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const {
      amount,
      donorName,
      donorEmail,
      message,
      isAnonymous,
      purpose = 'general_fund'
    } = JSON.parse(event.body);

    if (!amount || amount < 1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid donation amount' })
      };
    }

    // Create Stripe Payment Intent for general donation
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        type: 'general_donation',
        donorName: isAnonymous ? 'Anonymous' : (donorName || 'Anonymous'),
        donorEmail: donorEmail || '',
        message: message || '',
        purpose: purpose
      },
      description: `General donation to Ositos Bendecidos`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create pending donation record in Supabase
    const { data: donation, error } = await supabase
      .from('general_donations')
      .insert([{
        stripe_payment_intent_id: paymentIntent.id,
        amount: amount,
        donor_name: isAnonymous ? 'Anonymous' : (donorName || 'Anonymous'),
        donor_email: donorEmail || null,
        message: message || null,
        is_anonymous: isAnonymous || false,
        purpose: purpose,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating donation record:', error);
      // Don't fail the whole request if DB insert fails
      // Stripe webhook will handle it later
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        donationId: donation?.id,
        paymentIntentId: paymentIntent.id
      })
    };

  } catch (error) {
    console.error('Error creating donation intent:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};