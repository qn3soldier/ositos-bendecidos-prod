import express from 'express';
import Stripe from 'stripe';
import Joi from 'joi';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Validation schemas
const createPaymentIntentSchema = Joi.object({
  amount: Joi.number().min(50).max(999999).required(), // Min $0.50, Max $9,999.99
  currency: Joi.string().length(3).default('usd'),
  orderData: Joi.object().required(),
  metadata: Joi.object().optional()
});

// Create Payment Intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { error, value } = createPaymentIntentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details
      });
    }

    const { amount, currency, orderData, metadata } = value;

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_id: orderData.orderId || Date.now().toString(),
        customer_email: orderData.email || '',
        ...metadata
      }
    });

    return res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: process.env.NODE_ENV !== 'production' ? error : undefined
    });
  }
});

// Confirm Payment
router.post('/confirm-payment', async (req, res) => {
  try {
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required'
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    return res.json({
      success: true,
      status: paymentIntent.status,
      payment_intent: paymentIntent
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: process.env.NODE_ENV !== 'production' ? error : undefined
    });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // TODO: Update order status in database
      // TODO: Send confirmation email
      // TODO: Trigger order fulfillment
      
      break;
    
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // TODO: Update order status as failed
      // TODO: Send failure notification
      
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return res.json({ received: true });
});

// Refund payment
router.post('/refund', async (req, res) => {
  try {
    const { payment_intent_id, amount, reason } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required'
      });
    }

    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      amount, // Optional: partial refund
      reason: reason || 'requested_by_customer'
    });

    return res.json({
      success: true,
      refund
    });

  } catch (error) {
    console.error('Error creating refund:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create refund',
      error: process.env.NODE_ENV !== 'production' ? error : undefined
    });
  }
});

export default router;
