import React from 'react';
import { 
  PayPalScriptProvider, 
  PayPalButtons, 
  usePayPalScriptReducer 
} from '@paypal/react-paypal-js';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { createOrder } from '../../services/api';

interface PayPalPaymentProps {
  amount: number;
  orderData: any;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const PayPalButtonWrapper: React.FC<PayPalPaymentProps> = ({
  amount,
  orderData,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing
}) => {
  const [{ isPending }] = usePayPalScriptReducer();

  const createPayPalOrder = async () => {
    try {
      setIsProcessing(true);

      // Create order in our backend first
      const backendOrderData = {
        items: orderData.items || [],
        customerInfo: orderData.customerInfo || {},
        shippingInfo: orderData.shippingInfo || {},
        totals: {
          subtotal: amount - (amount * 0.08) - 5, // Subtract tax and shipping for demo
          tax: amount * 0.08,
          shipping: 5,
          total: amount
        },
        paymentMethod: 'paypal'
      };

      const backendResponse = await createOrder(backendOrderData);
      
      if (!backendResponse.success) {
        throw new Error('Failed to create order in backend');
      }

      // Return PayPal order ID for their system
      return backendResponse.orderId;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      onError(error);
      setIsProcessing(false);
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      setIsProcessing(true);

      // Here we would normally capture the payment via backend
      // For now, we'll simulate the success
      const paymentDetails = {
        id: data.orderID,
        status: 'COMPLETED',
        payer: {
          email_address: orderData.email,
          name: {
            given_name: orderData.customerName?.split(' ')[0] || 'Customer',
            surname: orderData.customerName?.split(' ')[1] || ''
          }
        },
        purchase_units: [{
          amount: {
            value: amount.toString(),
            currency_code: 'USD'
          }
        }]
      };

      onSuccess(paymentDetails);
    } catch (error) {
      console.error('Error approving PayPal payment:', error);
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const onCancel = () => {
    console.log('PayPal payment cancelled');
    setIsProcessing(false);
  };

  const onErrorPayPal = (error: any) => {
    console.error('PayPal error:', error);
    onError(error);
    setIsProcessing(false);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-gold-primary border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-white">Loading PayPal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <ShieldCheckIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <div>
          <p className="text-blue-400 font-medium text-sm">Secure PayPal Payment</p>
          <p className="text-gray-300 text-xs">
            Pay securely with your PayPal account or credit card through PayPal.
          </p>
        </div>
      </div>

      <div className="paypal-buttons-container">
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          }}
          createOrder={createPayPalOrder}
          onApprove={onApprove}
          onCancel={onCancel}
          onError={onErrorPayPal}
          disabled={isProcessing}
        />
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center p-4 bg-gold-primary/10 border border-gold-primary/30 rounded-lg">
          <div className="w-5 h-5 mr-3 border-2 border-gold-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-gold-primary">Processing PayPal payment...</span>
        </div>
      )}
    </div>
  );
};

const PayPalPayment: React.FC<PayPalPaymentProps> = (props) => {
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  if (!paypalClientId) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
        <h3 className="text-lg font-medium text-red-400 mb-2">PayPal Configuration Error</h3>
        <p className="text-gray-300">
          PayPal is not configured. Please add your PayPal Client ID to the .env file.
        </p>
      </div>
    );
  }

  const initialOptions = {
    clientId: paypalClientId,
    currency: 'USD',
    intent: 'capture',
    components: 'buttons',
    'disable-funding': 'venmo' // Optional: disable specific funding sources
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtonWrapper {...props} />
    </PayPalScriptProvider>
  );
};

export default PayPalPayment;
