import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe lazily to avoid HTTP warning in development
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey && import.meta.env.PROD) {
  console.warn('⚠️ Stripe publishable key not found. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file');
}

// Lazy load Stripe only when needed
export const getStripe = async () => {
  if (!stripePublishableKey) {
    return null;
  }
  return await loadStripe(stripePublishableKey);
};

// Legacy export for backward compatibility
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Payment Intent creation
export const createPaymentIntent = async (amount: number, currency: string = 'usd', orderData: any) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        orderData,
        metadata: {
          order_id: orderData.orderId || Date.now().toString(),
          customer_email: orderData.email,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Confirm payment
export const confirmPayment = async (stripe: any, elements: any, _clientSecret: string) => {
  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success`,
      },
      redirect: 'if_required'
    });

    if (error) {
      throw error;
    }

    return paymentIntent;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

// Handle payment method creation for saved cards
export const createPaymentMethod = async (stripe: any, elements: any, billingDetails: any) => {
  try {
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement('card'),
      billing_details: billingDetails,
    });

    if (error) {
      throw error;
    }

    return paymentMethod;
  } catch (error) {
    console.error('Error creating payment method:', error);
    throw error;
  }
};
