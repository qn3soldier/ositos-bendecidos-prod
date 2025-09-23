import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  CheckCircleIcon,
  EnvelopeIcon,
  PrinterIcon,
  HomeIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../shared/GlassCard';
import GradientButton from '../../shared/GradientButton';

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/.netlify/functions/get-order?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success && data.order) {
          setOrderData(data.order);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [sessionId]);

  // If error or no order data after loading
  if (error || (!orderData && !isLoading && !sessionId)) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h1 className="text-4xl font-bold text-gold-primary mb-4">
              Order Not Found
            </h1>
            <p className="text-gray-300 mb-8">
              We couldn't find your order information.
            </p>
            <Link to="/">
              <GradientButton size="lg" variant="gradient">
                Go Home
              </GradientButton>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show success page if we have order data
  if (orderData) {
    const { orderNumber, total, customerEmail, customerName, items, fulfillmentStatus } = orderData;
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            {/* Success Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center"
            >
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-bold bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent mb-4"
            >
              Order Confirmed!
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-gray-300 mb-2"
            >
              Thank you for your purchase! Your order has been successfully placed.
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-gray-400"
            >
              Order #{orderNumber}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard padding="lg">
                <h2 className="text-2xl font-semibold text-white mb-6">Order Details</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-300">Order Number:</span>
                    <span className="text-white font-mono">{orderNumber}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-300">Total Amount:</span>
                    <span className="text-2xl font-bold text-gold-primary">${total?.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-300">Payment Status:</span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      Paid
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-300">Order Status:</span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                      {fulfillmentStatus || 'Processing'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-300">Estimated Delivery:</span>
                    <span className="text-white">3-5 business days</span>
                  </div>

                  {items && items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h3 className="text-lg font-semibold text-white mb-3">Order Items:</h3>
                      <div className="space-y-2">
                        {items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-gray-300">
                              {item.product_name} x{item.quantity}
                            </span>
                            <span className="text-white">
                              ${item.subtotal?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <GlassCard padding="lg">
                <h2 className="text-2xl font-semibold text-white mb-6">What's Next?</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gold-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <EnvelopeIcon className="w-4 h-4 text-gold-primary" />
                    </div>
                    <div>
                      <h3 className="text-gold-primary font-semibold mb-1">Confirmation Email</h3>
                      <p className="text-gray-300 text-sm">
                        We've sent a confirmation email to {email} with your order details and tracking information.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gold-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-gold-primary font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="text-gold-primary font-semibold mb-1">Order Processing</h3>
                      <p className="text-gray-300 text-sm">
                        Your order is being prepared and will be shipped within 1-2 business days.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gold-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-gold-primary font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="text-gold-primary font-semibold mb-1">Tracking Updates</h3>
                      <p className="text-gray-300 text-sm">
                        You'll receive tracking information once your order ships so you can monitor its progress.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gold-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-gold-primary font-bold text-sm">4</span>
                    </div>
                    <div>
                      <h3 className="text-gold-primary font-semibold mb-1">Delivery</h3>
                      <p className="text-gray-300 text-sm">
                        Your order will be delivered to your specified address within the estimated timeframe.
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <GlassCard padding="lg">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                >
                  <PrinterIcon className="w-5 h-5" />
                  <span>Print Receipt</span>
                </button>
                
                <Link to="/shop">
                  <GradientButton variant="outline" className="flex items-center space-x-2">
                    <ShoppingBagIcon className="w-5 h-5" />
                    <span>Continue Shopping</span>
                  </GradientButton>
                </Link>
                
                <Link to="/">
                  <GradientButton variant="gradient" className="flex items-center space-x-2">
                    <HomeIcon className="w-5 h-5" />
                    <span>Go Home</span>
                  </GradientButton>
                </Link>
              </div>
            </GlassCard>
          </motion.div>

          {/* Support Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-8"
          >
            <GlassCard padding="lg">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gold-primary mb-4">
                  Need Help?
                </h3>
                <p className="text-gray-300 mb-6">
                  If you have any questions about your order, please don't hesitate to contact us.
                </p>
                <div className="flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-8">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <EnvelopeIcon className="w-5 h-5 text-gold-primary" />
                    <span>support@ositosbendecidos.com</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <span className="w-5 h-5 text-gold-primary flex items-center justify-center">📞</span>
                    <span>+1 (555) 123-4567</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Community Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-8"
          >
            <GlassCard padding="lg" className="text-center">
              <h3 className="text-xl font-semibold text-gold-primary mb-4">
                Thank You for Supporting Our Community
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Your purchase directly supports our community programs and helps us bring hope and assistance 
                to families in need. Together, we're building a stronger, more compassionate community. 
                Thank you for being part of the Ositos Bendecidos family!
              </p>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen py-12 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-primary mx-auto mb-4"></div>
        <p className="text-gray-300">Processing your order...</p>
      </div>
    </div>
  );
};

export default OrderSuccess;
