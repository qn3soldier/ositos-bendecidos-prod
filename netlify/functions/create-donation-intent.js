const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle preflight
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
    const { amount, requestId, requestTitle, donorEmail, donorName } = JSON.parse(event.body);

    if (!amount || !requestId || !requestTitle) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        requestId,
        requestTitle,
        donorEmail: donorEmail || 'anonymous',
        donorName: donorName || 'Anonymous Donor'
      },
      description: `Donation for: ${requestTitle}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create pending donation record in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: donation, error } = await supabase
      .from('donations')
      .insert([{
        request_id: requestId,
        amount: amount,
        payment_intent_id: paymentIntent.id,
        payment_status: 'pending',
        donor_name: donorName || 'Anonymous',
        donor_email: donorEmail || null,
        payment_method: 'stripe'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating donation record:', error);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        donationId: donation?.id
      })
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};