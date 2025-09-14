import React, { useState, useEffect } from 'react';
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';

import { CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import GradientButton from '../shared/GradientButton';
import { stripePromise, createPaymentIntent, confirmPayment } from '../../services/stripe';

interface StripePaymentProps {
  amount: number;
  orderData: any;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const CardElementComponent: React.FC<StripePaymentProps> = ({
  amount,
  orderData,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Create payment intent when component mounts
  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsLoading(true);
        const { client_secret } = await createPaymentIntent(amount, 'usd', orderData);
        setClientSecret(client_secret);
      } catch (error) {
        console.error('Failed to create payment intent:', error);
        onError(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (amount > 0 && orderData) {
      initializePayment();
    }
  }, [amount, orderData]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const paymentIntent = await confirmPayment(stripe, elements, clientSecret);
      
      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      } else {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: 'transparent',
        '::placeholder': {
          color: '#9ca3af',
        },
        iconColor: '#ffd700',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-gold-primary border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-white">Initializing payment...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Card Information
        </label>
        <div className="p-4 bg-white/10 border border-white/20 rounded-lg focus-within:border-gold-primary/50 focus-within:ring-2 focus-within:ring-gold-primary/20">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="flex items-center space-x-3 p-4 bg-gold-primary/10 border border-gold-primary/30 rounded-lg">
        <ShieldCheckIcon className="w-5 h-5 text-gold-primary flex-shrink-0" />
        <div>
          <p className="text-gold-primary font-medium text-sm">Secure Payment</p>
          <p className="text-gray-300 text-xs">
            Your payment information is encrypted and processed securely by Stripe.
          </p>
        </div>
      </div>

      <GradientButton
        type="submit"
        size="lg"
        variant="gradient"
        disabled={!stripe || isProcessing}
        className="w-full flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCardIcon className="w-5 h-5 mr-3" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </GradientButton>
    </form>
  );
};

const StripePayment: React.FC<StripePaymentProps> = (props) => {
  if (!stripePromise) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
        <h3 className="text-lg font-medium text-red-400 mb-2">Payment Configuration Error</h3>
        <p className="text-gray-300">
          Stripe is not configured. Please add your Stripe publishable key to the .env file.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CardElementComponent {...props} />
    </Elements>
  );
};

export default StripePayment;
