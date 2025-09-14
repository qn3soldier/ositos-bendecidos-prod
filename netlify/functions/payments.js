const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe');

// Initialize services
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe
const stripeClient = stripe(stripeSecretKey);

// CORS Headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Helper: Calculate order amount in cents
const calculateOrderAmount = (items, shipping = 0, tax = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + shipping + tax;
  return Math.round(total * 100); // Convert to cents
};

// Helper: Verify webhook signature
const verifyWebhookSignature = (payload, signature, secret) => {
  try {
    return stripeClient.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return null;
  }
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const path = event.path.replace('/.netlify/functions/payments', '').replace('/api/payments', '');
  const method = event.httpMethod;

  try {
    // POST /api/payments/create-payment-intent - Create Stripe payment intent
    if (method === 'POST' && path === '/create-payment-intent') {
      const { items, shipping = 0, tax = 0, customerEmail, orderId } = JSON.parse(event.body);

      if (!items || !items.length) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Items are required'
          })
        };
      }

      // Calculate amount
      const amount = calculateOrderAmount(items, shipping, tax);

      // Create payment intent
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId: orderId || '',
          customerEmail: customerEmail || ''
        },
        description: `Order from Ositos Bendecidos - ${items.length} items`
      });

      // Store payment intent in database
      if (orderId) {
        await supabase
          .from('payment_intents')
          .insert([{
            id: paymentIntent.id,
            order_id: orderId,
            amount: amount / 100, // Convert back to dollars
            currency: 'usd',
            status: paymentIntent.status,
            customer_email: customerEmail
          }]);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: amount / 100
        })
      };
    }

    // POST /api/payments/confirm - Confirm payment
    if (method === 'POST' && path === '/confirm') {
      const { paymentIntentId, orderId } = JSON.parse(event.body);

      if (!paymentIntentId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Payment intent ID is required'
          })
        };
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

      // Update payment status in database
      await supabase
        .from('payment_intents')
        .update({
          status: paymentIntent.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentIntentId);

      // If payment succeeded, update order
      if (paymentIntent.status === 'succeeded' && orderId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_intent_id: paymentIntentId,
            paid_at: new Date().toISOString(),
            status: 'processing'
          })
          .eq('id', orderId);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          status: paymentIntent.status,
          message: paymentIntent.status === 'succeeded' 
            ? 'Payment confirmed successfully' 
            : `Payment status: ${paymentIntent.status}`
        })
      };
    }

    // POST /api/payments/refund - Process refund
    if (method === 'POST' && path === '/refund') {
      const { paymentIntentId, amount, reason = 'requested_by_customer' } = JSON.parse(event.body);

      if (!paymentIntentId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Payment intent ID is required'
          })
        };
      }

      // Create refund in Stripe
      const refund = await stripeClient.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
        reason
      });

      // Store refund in database
      await supabase
        .from('refunds')
        .insert([{
          id: refund.id,
          payment_intent_id: paymentIntentId,
          amount: refund.amount / 100,
          reason: refund.reason,
          status: refund.status
        }]);

      // Update order if refund succeeded
      if (refund.status === 'succeeded') {
        const { data: paymentIntent } = await supabase
          .from('payment_intents')
          .select('order_id')
          .eq('id', paymentIntentId)
          .single();

        if (paymentIntent?.order_id) {
          await supabase
            .from('orders')
            .update({
              payment_status: amount ? 'partially_refunded' : 'refunded',
              refunded_at: new Date().toISOString()
            })
            .eq('id', paymentIntent.order_id);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          refundId: refund.id,
          status: refund.status,
          amount: refund.amount / 100,
          message: 'Refund processed successfully'
        })
      };
    }

    // POST /api/payments/webhook - Handle Stripe webhooks
    if (method === 'POST' && path === '/webhook') {
      const signature = event.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!signature || !webhookSecret) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Missing webhook signature'
          })
        };
      }

      // Verify webhook signature
      const webhookEvent = verifyWebhookSignature(event.body, signature, webhookSecret);
      
      if (!webhookEvent) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Invalid webhook signature'
          })
        };
      }

      // Handle different webhook events
      switch (webhookEvent.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = webhookEvent.data.object;
          
          // Update payment and order status
          await supabase
            .from('payment_intents')
            .update({
              status: 'succeeded',
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentIntent.id);

          if (paymentIntent.metadata.orderId) {
            await supabase
              .from('orders')
              .update({
                payment_status: 'paid',
                paid_at: new Date().toISOString(),
                status: 'processing'
              })
              .eq('id', paymentIntent.metadata.orderId);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = webhookEvent.data.object;
          
          await supabase
            .from('payment_intents')
            .update({
              status: 'failed',
              error_message: failedPayment.last_payment_error?.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', failedPayment.id);

          if (failedPayment.metadata.orderId) {
            await supabase
              .from('orders')
              .update({
                payment_status: 'failed',
                status: 'payment_failed'
              })
              .eq('id', failedPayment.metadata.orderId);
          }
          break;

        case 'charge.refunded':
          const refundedCharge = webhookEvent.data.object;
          
          // Update refund status
          if (refundedCharge.refunds.data.length > 0) {
            const refund = refundedCharge.refunds.data[0];
            await supabase
              .from('refunds')
              .update({
                status: 'succeeded',
                updated_at: new Date().toISOString()
              })
              .eq('id', refund.id);
          }
          break;

        default:
          console.log(`Unhandled webhook event type: ${webhookEvent.type}`);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          received: true
        })
      };
    }

    // GET /api/payments/config - Get Stripe publishable key
    if (method === 'GET' && path === '/config') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_key',
          paypalClientId: process.env.VITE_PAYPAL_CLIENT_ID || ''
        })
      };
    }

    // POST /api/payments/paypal/create - Create PayPal order (stub)
    if (method === 'POST' && path === '/paypal/create') {
      const { items, shipping = 0, tax = 0 } = JSON.parse(event.body);
      
      // This is a stub - implement actual PayPal SDK integration
      const amount = calculateOrderAmount(items, shipping, tax) / 100;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          orderId: `PAYPAL-${Date.now()}`,
          amount,
          message: 'PayPal order created (stub implementation)'
        })
      };
    }

    // POST /api/payments/paypal/capture - Capture PayPal payment (stub)
    if (method === 'POST' && path === '/paypal/capture') {
      const { paypalOrderId, orderId } = JSON.parse(event.body);
      
      // This is a stub - implement actual PayPal SDK integration
      if (orderId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_method: 'paypal',
            paid_at: new Date().toISOString(),
            status: 'processing'
          })
          .eq('id', orderId);
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'PayPal payment captured (stub implementation)'
        })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };

  } catch (error) {
    console.error('Payments API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};