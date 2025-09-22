import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../shared/GlassCard';
import GradientButton from '../../shared/GradientButton';
import StripePayment from '../../payment/StripePayment';
import PayPalPayment from '../../payment/PayPalPayment';
import { useCart } from '../../../contexts/CartContext';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutForm {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Shipping Address
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Payment
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  
  // Options
  shippingMethod: 'standard' | 'express' | 'overnight';
  paymentMethod: 'card' | 'paypal';
  saveInfo: boolean;
  newsletter: boolean;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  
  const [formData, setFormData] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    shippingMethod: 'standard',
    paymentMethod: 'card',
    saveInfo: false,
    newsletter: true
  });
  
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});

  // Если корзина пуста, перенаправляем
  if (items.length === 0) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h1 className="text-4xl font-bold text-gold-primary mb-4">
              Your cart is empty
            </h1>
            <p className="text-gray-300 mb-8">
              Add some items to your cart before proceeding to checkout.
            </p>
            <Link to="/shop">
              <GradientButton size="lg" variant="gradient">
                Continue Shopping
              </GradientButton>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const shippingOptions = [
    { id: 'standard', name: 'Standard Shipping', price: 0, days: '5-7 business days' },
    { id: 'express', name: 'Express Shipping', price: 15, days: '2-3 business days' },
    { id: 'overnight', name: 'Overnight Shipping', price: 35, days: 'Next business day' }
  ];

  const taxRate = 0.08;
  const shippingCost = shippingOptions.find(option => option.id === formData.shippingMethod)?.price || 0;
  const subtotal = totalPrice;
  const tax = subtotal * taxRate;
  const total = subtotal + tax + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof CheckoutForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateStep = (step: string): boolean => {
    const newErrors: Partial<CheckoutForm> = {};
    
    if (step === 'shipping') {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.phone) newErrors.phone = 'Phone is required';
      if (!formData.address) newErrors.address = 'Address is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required';
    }
    
    if (step === 'payment') {
      if (formData.paymentMethod === 'card') {
        if (!formData.cardNumber) newErrors.cardNumber = 'Card number is required';
        if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
        if (!formData.cvv) newErrors.cvv = 'CVV is required';
        if (!formData.cardName) newErrors.cardName = 'Cardholder name is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 'shipping' && validateStep('shipping')) {
      setCurrentStep('payment');
    } else if (currentStep === 'payment' && validateStep('payment')) {
      setCurrentStep('review');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('shipping');
    } else if (currentStep === 'review') {
      setCurrentStep('payment');
    }
  };

  const handleStripeCheckout = async () => {
    try {
      setIsProcessing(true);

      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`,
          shippingAddress: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zipCode,
            country: formData.country
          }
        }),
      });

      const { sessionId, url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        // Fallback to embedded checkout
        const stripe = await stripePromise;
        const { error } = await stripe!.redirectToCheckout({ sessionId });

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment failed:', error);
    alert(`Payment failed: ${error.message || 'Unknown error'}`);
    setIsProcessing(false);
  };

  const handlePayPalSuccess = async (paymentDetails: any) => {
    try {
      setIsProcessing(true);
      
      // Create order in backend with PayPal payment details
      // TODO: Implement order creation with PayPal details
      /* const orderData = {
        items,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        shippingInfo: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          shippingMethod: formData.shippingMethod
        },
        totals: {
          subtotal,
          tax,
          shipping: shippingCost,
          total
        },
        paymentMethod: formData.paymentMethod,
        paypalOrderId: paymentDetails.id,
        paypalDetails: paymentDetails
      }; */

      // TODO: Implement order creation API call
      const response = { success: false, orderId: null, message: 'Order creation not implemented' };
      // const response = await createOrder(orderData);
      
      if (response.success) {
        // Clear cart and redirect to success page
        clearCart();
        navigate('/order-success', { 
          state: { 
            orderNumber: response.orderId,
            total,
            email: formData.email,
            paypalOrderId: paymentDetails.id
          }
        });
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('PayPal order creation failed:', error);
      alert('Order creation failed. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 'shipping', name: 'Shipping', icon: TruckIcon },
    { id: 'payment', name: 'Payment', icon: CreditCardIcon },
    { id: 'review', name: 'Review', icon: CheckCircleIcon }
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
              Checkout
            </h1>
            <Link 
              to="/cart" 
              className="inline-flex items-center text-gold-primary hover:text-gold-neon transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Cart
            </Link>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                const Icon = step.icon;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                      ${isActive 
                        ? 'border-gold-primary bg-gold-primary text-black' 
                        : isCompleted 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-600 text-gray-400'
                      }
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`ml-3 text-sm font-medium ${
                      isActive ? 'text-gold-primary' : isCompleted ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`mx-6 h-0.5 w-16 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-600'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              {/* Shipping Information */}
              {currentStep === 'shipping' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <GlassCard padding="lg">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                      <TruckIcon className="w-6 h-6 mr-3 text-gold-primary" />
                      Shipping Information
                    </h2>
                    
                    <div className="space-y-6">
                      {/* Personal Info */}
                      <div>
                        <h3 className="text-lg font-medium text-gold-primary mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              First Name *
                            </label>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 ${
                                  errors.firstName ? 'border-red-500' : 'border-white/20'
                                }`}
                                placeholder="John"
                              />
                            </div>
                            {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 ${
                                errors.lastName ? 'border-red-500' : 'border-white/20'
                              }`}
                              placeholder="Doe"
                            />
                            {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Email Address *
                            </label>
                            <div className="relative">
                              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 ${
                                  errors.email ? 'border-red-500' : 'border-white/20'
                                }`}
                                placeholder="john@example.com"
                              />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Phone Number *
                            </label>
                            <div className="relative">
                              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 ${
                                  errors.phone ? 'border-red-500' : 'border-white/20'
                                }`}
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>
                            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div>
                        <h3 className="text-lg font-medium text-gold-primary mb-4">Shipping Address</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Street Address *
                            </label>
                            <div className="relative">
                              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 ${
                                  errors.address ? 'border-red-500' : 'border-white/20'
                                }`}
                                placeholder="123 Main Street"
                              />
                            </div>
                            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                City *
                              </label>
                              <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 ${
                                  errors.city ? 'border-red-500' : 'border-white/20'
                                }`}
                                placeholder="New York"
                              />
                              {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                State *
                              </label>
                              <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 ${
                                  errors.state ? 'border-red-500' : 'border-white/20'
                                }`}
                                placeholder="NY"
                              />
                              {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                ZIP Code *
                              </label>
                              <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 ${
                                  errors.zipCode ? 'border-red-500' : 'border-white/20'
                                }`}
                                placeholder="10001"
                              />
                              {errors.zipCode && <p className="text-red-400 text-xs mt-1">{errors.zipCode}</p>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Shipping Method */}
                      <div>
                        <h3 className="text-lg font-medium text-gold-primary mb-4">Shipping Method</h3>
                        <div className="space-y-3">
                          {shippingOptions.map((option) => (
                            <label key={option.id} className="flex items-center p-4 border border-white/20 rounded-lg cursor-pointer hover:border-gold-primary/50 transition-colors">
                              <input
                                type="radio"
                                name="shippingMethod"
                                value={option.id}
                                checked={formData.shippingMethod === option.id}
                                onChange={handleInputChange}
                                className="text-gold-primary focus:ring-gold-primary"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-white font-medium">{option.name}</span>
                                  <span className="text-gold-primary font-bold">
                                    {option.price === 0 ? 'Free' : `$${option.price}`}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-sm">{option.days}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Payment Information */}
              {currentStep === 'payment' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <GlassCard padding="lg">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                      <CreditCardIcon className="w-6 h-6 mr-3 text-gold-primary" />
                      Payment Information
                    </h2>
                    
                    <div className="space-y-6">
                      {/* Payment Method */}
                      <div>
                        <h3 className="text-lg font-medium text-gold-primary mb-4">Payment Method</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex items-center p-4 border border-white/20 rounded-lg cursor-pointer hover:border-gold-primary/50 transition-colors">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="card"
                              checked={formData.paymentMethod === 'card'}
                              onChange={handleInputChange}
                              className="text-gold-primary focus:ring-gold-primary"
                            />
                            <div className="ml-3">
                              <span className="text-white font-medium">Credit Card</span>
                              <p className="text-gray-400 text-sm">Visa, Mastercard, Amex</p>
                            </div>
                          </label>
                          
                          <label className="flex items-center p-4 border border-white/20 rounded-lg cursor-pointer hover:border-gold-primary/50 transition-colors">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="paypal"
                              checked={formData.paymentMethod === 'paypal'}
                              onChange={handleInputChange}
                              className="text-gold-primary focus:ring-gold-primary"
                            />
                            <div className="ml-3">
                              <span className="text-white font-medium">PayPal</span>
                              <p className="text-gray-400 text-sm">Pay with PayPal</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Stripe Payment */}
                      {formData.paymentMethod === 'card' && (
                        <div>
                          <h3 className="text-lg font-medium text-gold-primary mb-4">Card Details</h3>
                          <StripePayment
                            amount={total}
                            orderData={{
                              orderId: `OB-${Date.now()}`,
                              email: formData.email,
                              customerName: `${formData.firstName} ${formData.lastName}`
                            }}
                            onSuccess={handlePayPalSuccess}
                            onError={handlePaymentError}
                            isProcessing={isProcessing}
                            setIsProcessing={setIsProcessing}
                          />
                        </div>
                      )}

                      {/* PayPal Payment */}
                      {formData.paymentMethod === 'paypal' && (
                        <div>
                          <h3 className="text-lg font-medium text-gold-primary mb-4">PayPal Payment</h3>
                          <PayPalPayment
                            amount={total}
                            orderData={{
                              orderId: `OB-${Date.now()}`,
                              email: formData.email,
                              customerName: `${formData.firstName} ${formData.lastName}`,
                              items,
                              customerInfo: {
                                firstName: formData.firstName,
                                lastName: formData.lastName,
                                email: formData.email,
                                phone: formData.phone
                              },
                              shippingInfo: {
                                address: formData.address,
                                city: formData.city,
                                state: formData.state,
                                zipCode: formData.zipCode,
                                country: formData.country,
                                shippingMethod: formData.shippingMethod
                              }
                            }}
                            onSuccess={handlePayPalSuccess}
                            onError={handlePaymentError}
                            isProcessing={isProcessing}
                            setIsProcessing={setIsProcessing}
                          />
                        </div>
                      )}


                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Order Review */}
              {currentStep === 'review' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <GlassCard padding="lg">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                      <CheckCircleIcon className="w-6 h-6 mr-3 text-gold-primary" />
                      Order Review
                    </h2>
                    
                    <div className="space-y-6">
                      {/* Order Items */}
                      <div>
                        <h3 className="text-lg font-medium text-gold-primary mb-4">Order Items</h3>
                        <div className="space-y-3">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-16 h-16 object-contain rounded-lg bg-gold-primary/20"
                              />
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{item.name}</h4>
                                <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-gold-primary font-bold">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Info */}
                      <div>
                        <h3 className="text-lg font-medium text-gold-primary mb-4">Shipping Information</h3>
                        <div className="p-4 bg-white/5 rounded-lg">
                          <p className="text-white">
                            {formData.firstName} {formData.lastName}
                          </p>
                          <p className="text-gray-300">{formData.address}</p>
                          <p className="text-gray-300">
                            {formData.city}, {formData.state} {formData.zipCode}
                          </p>
                          <p className="text-gray-300">{formData.email}</p>
                          <p className="text-gray-300">{formData.phone}</p>
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <p className="text-gold-primary">
                              {shippingOptions.find(option => option.id === formData.shippingMethod)?.name}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <h3 className="text-lg font-medium text-gold-primary mb-4">Payment Method</h3>
                        <div className="p-4 bg-white/5 rounded-lg">
                          <p className="text-white capitalize">{formData.paymentMethod}</p>
                          {formData.paymentMethod === 'card' && formData.cardNumber && (
                            <p className="text-gray-300">
                              **** **** **** {formData.cardNumber.slice(-4)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {currentStep !== 'shipping' && (
                  <GradientButton 
                    variant="outline" 
                    onClick={handlePreviousStep}
                    className="flex items-center"
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Previous
                  </GradientButton>
                )}
                
                <div className="ml-auto">
                  {currentStep !== 'review' ? (
                    <GradientButton 
                      variant="gradient" 
                      onClick={handleNextStep}
                    >
                      Continue
                    </GradientButton>
                  ) : (
                    <GradientButton
                      variant="gradient"
                      onClick={handleStripeCheckout}
                      disabled={isProcessing}
                      className="min-w-[200px]"
                    >
                      {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                    </GradientButton>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <GlassCard padding="lg">
                  <h3 className="text-xl font-semibold text-white mb-6">Order Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal ({totalItems} items):</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-300">
                      <span>Shipping:</span>
                      <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-300">
                      <span>Tax:</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold text-white">Total:</span>
                        <span className="text-2xl font-bold text-gold-primary">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gold-primary/10 border border-gold-primary/30 rounded-lg">
                    <div className="flex items-center mb-2">
                      <ShieldCheckIcon className="w-5 h-5 text-gold-primary mr-2" />
                      <span className="text-gold-primary font-medium">Secure Checkout</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
