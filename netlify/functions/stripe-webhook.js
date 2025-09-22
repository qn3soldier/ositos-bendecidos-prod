const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, headers, body: `Webhook Error: ${err.message}` };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Handle the event
  switch (stripeEvent.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = stripeEvent.data.object;

      console.log('Webhook received payment_intent.succeeded:', paymentIntent.id);
      console.log('Metadata:', paymentIntent.metadata);

      try {
        // Update donation status
        const { data: donation, error: donationError } = await supabase
          .from('donations')
          .update({
            status: 'completed',  // Changed from payment_status to status
            completed_at: new Date().toISOString()
          })
          .eq('payment_intent_id', paymentIntent.id)
          .select()
          .single();

        if (donationError) {
          console.error('Error updating donation:', donationError);
          throw donationError;
        }
        console.log('Donation updated:', donation);

        // Update community request raised amount
        const { data: request, error: requestError } = await supabase
          .from('community_requests')
          .select('raised_amount, target_amount, donor_count')
          .eq('id', paymentIntent.metadata.requestId)
          .single();

        if (requestError) {
          console.error('Error fetching request:', requestError);
        } else if (request) {
          const newRaised = (request.raised_amount || 0) + (paymentIntent.amount / 100);
          const newDonorCount = (request.donor_count || 0) + 1;

          console.log('Updating request:', paymentIntent.metadata.requestId);
          console.log('New raised amount:', newRaised);

          const { error: updateError } = await supabase
            .from('community_requests')
            .update({
              raised_amount: newRaised,
              donor_count: newDonorCount,
              status: newRaised >= request.target_amount ? 'completed' : 'active'
            })
            .eq('id', paymentIntent.metadata.requestId);

          if (updateError) {
            console.error('Error updating request:', updateError);
          } else {
            console.log('Request updated successfully!');
          }
        }

        console.log('Payment processed successfully:', paymentIntent.id);
      } catch (error) {
        console.error('Error updating database:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = stripeEvent.data.object;

      try {
        await supabase
          .from('donations')
          .update({
            status: 'failed',  // Changed from payment_status to status
            failed_at: new Date().toISOString()
          })
          .eq('payment_intent_id', failedPayment.id);
      } catch (error) {
        console.error('Error updating failed payment:', error);
      }
      break;

    default:
      console.log(`Unhandled event type ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ received: true })
  };
};