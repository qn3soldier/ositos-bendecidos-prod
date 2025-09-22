import React, { useState } from 'react';
import { HeartIcon, CurrencyDollarIcon, GiftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import GlassCard from '../../shared/GlassCard';
import GradientButton from '../../shared/GradientButton';
import { motion, AnimatePresence } from 'framer-motion';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Checkout form component
const DonationCheckoutForm: React.FC<{
  amount: number;
  donorInfo: { name: string; email: string; message: string; isAnonymous: boolean };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ amount, donorInfo, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/donation-success?type=general&amount=${amount}`,
        },
      });

      if (error) {
        setError(error.message || 'Payment failed');
        setIsProcessing(false);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-gold-primary/10 border border-gold-primary/30 rounded-lg">
        <h3 className="text-lg font-semibold text-gold-primary mb-2">Donation Summary</h3>
        <div className="space-y-1 text-sm">
          <p className="text-gray-300">Amount: <span className="text-white font-bold">${amount}</span></p>
          {!donorInfo.isAnonymous && donorInfo.name && (
            <p className="text-gray-300">Donor: <span className="text-white">{donorInfo.name}</span></p>
          )}
          {donorInfo.isAnonymous && (
            <p className="text-gray-300">Donor: <span className="text-white">Anonymous</span></p>
          )}
        </div>
      </div>

      <PaymentElement />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      <div className="flex space-x-3">
        <GradientButton
          type="submit"
          variant="gradient"
          size="lg"
          className="flex-1"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Donate $${amount}`}
        </GradientButton>
        <GradientButton
          type="button"
          variant="outline"
          size="lg"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Back
        </GradientButton>
      </div>
    </form>
  );
};

const Donate: React.FC = () => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donationType, setDonationType] = useState<'one-time' | 'monthly'>('one-time');
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Donor information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [wantsUpdates, setWantsUpdates] = useState(true);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  const presetAmounts = [25, 50, 100, 250, 500];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleProceedToPayment = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || amount <= 0) {
      alert('Please select or enter a valid donation amount.');
      return;
    }

    // Validate email if not anonymous
    if (!isAnonymous && donorEmail && !donorEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsCreatingIntent(true);

    try {
      const response = await fetch('/.netlify/functions/create-general-donation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          donorName: isAnonymous ? 'Anonymous' : `${firstName} ${lastName}`.trim() || 'Anonymous',
          donorEmail: isAnonymous ? '' : donorEmail,
          message,
          isAnonymous,
          purpose: 'general_fund'
        }),
      });

      const data = await response.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPayment(true);
      } else {
        throw new Error('Failed to create donation intent');
      }
    } catch (error) {
      console.error('Error creating donation:', error);
      alert('Failed to initialize donation. Please try again.');
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Payment successful, Stripe will redirect to success page
    console.log('Payment initiated successfully');
  };

  const handleCancelPayment = () => {
    setShowPayment(false);
    setClientSecret(null);
  };

  const currentAmount = selectedAmount || parseFloat(customAmount) || 0;

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/5 to-gold-neon/5"></div>

      <div className="container relative py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center space-x-4 mb-4"
          >
            <img src="/ositos-logo-gold.png" alt="Ositos Bendecidos" className="w-20 h-20 object-contain" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
              Support Our Mission
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Your donation helps us build communities through faith, empowerment, and mutual support
          </motion.p>
        </div>

        <div className="max-w-2xl mx-auto">
          <GlassCard padding="lg">
            <AnimatePresence mode="wait">
              {!showPayment ? (
                <motion.div
                  key="donation-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Donation Type Selector */}
                  <div className="flex space-x-4 mb-8">
                    <button
                      onClick={() => setDonationType('one-time')}
                      className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                        donationType === 'one-time'
                          ? 'bg-gold-primary/20 text-gold-primary border-gold-primary/30'
                          : 'bg-white/5 text-gray-300 border-white/20 hover:border-gold-primary/30'
                      }`}
                    >
                      <GiftIcon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">One-time</span>
                    </button>
                    <button
                      onClick={() => setDonationType('monthly')}
                      disabled
                      className={`flex-1 py-3 px-4 rounded-lg border transition-all opacity-50 cursor-not-allowed ${
                        donationType === 'monthly'
                          ? 'bg-gold-primary/20 text-gold-primary border-gold-primary/30'
                          : 'bg-white/5 text-gray-300 border-white/20'
                      }`}
                    >
                      <HeartIcon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">Monthly</span>
                      <span className="text-xs block text-gray-400">(Coming Soon)</span>
                    </button>
                  </div>

                  {/* Amount Selection */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Choose Amount</h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                      {presetAmounts.map((amount) => (
                        <motion.button
                          key={amount}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAmountSelect(amount)}
                          className={`py-3 px-4 rounded-lg border transition-all ${
                            selectedAmount === amount
                              ? 'bg-gold-primary/20 text-gold-primary border-gold-primary/30'
                              : 'bg-white/5 text-gray-300 border-white/20 hover:border-gold-primary/30'
                          }`}
                        >
                          ${amount}
                        </motion.button>
                      ))}
                    </div>

                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        placeholder="Enter custom amount"
                        value={customAmount}
                        onChange={(e) => handleCustomAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                        min="1"
                        step="1"
                      />
                    </div>
                  </div>

                  {/* Impact Information */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Your Impact</h3>
                    <div className="space-y-3">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <span className="text-gray-300">$25</span>
                        <span className="text-sm text-gray-400">Provides a family meal</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <span className="text-gray-300">$50</span>
                        <span className="text-sm text-gray-400">Supports community programs</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <span className="text-gray-300">$100</span>
                        <span className="text-sm text-gray-400">Helps fund prayer support services</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <span className="text-gray-300">$250+</span>
                        <span className="text-sm text-gray-400">Enables community investment projects</span>
                      </motion.div>
                    </div>
                  </div>

                  {/* Donor Information */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Your Information (Optional)</h3>

                    <div className="mb-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="w-4 h-4 text-gold-primary bg-white/10 border-white/20 rounded focus:ring-gold-primary/20"
                        />
                        <span className="text-sm text-gray-300">Make my donation anonymous</span>
                      </label>
                    </div>

                    {!isAnonymous && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                          />
                          <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                          />
                        </div>
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={donorEmail}
                          onChange={(e) => setDonorEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                        />
                      </motion.div>
                    )}

                    <textarea
                      placeholder="Message or dedication (optional)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full mt-4 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                    />

                    {!isAnonymous && (
                      <div className="mt-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={wantsUpdates}
                            onChange={(e) => setWantsUpdates(e.target.checked)}
                            className="w-4 h-4 text-gold-primary bg-white/10 border-white/20 rounded focus:ring-gold-primary/20"
                          />
                          <span className="text-sm text-gray-300">
                            I would like to receive updates about how my donation is making an impact
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Donate Button */}
                  <div className="text-center">
                    <GradientButton
                      size="lg"
                      variant="gradient"
                      onClick={handleProceedToPayment}
                      disabled={!currentAmount || isCreatingIntent}
                      className="w-full md:w-auto min-w-[250px]"
                    >
                      {isCreatingIntent ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <HeartIcon className="w-5 h-5 mr-2" />
                          {currentAmount > 0 ? `Continue to Donate $${currentAmount}` : 'Select Amount'}
                        </>
                      )}
                    </GradientButton>

                    <p className="text-xs text-gray-400 mt-4">
                      <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                      Secure payment processing powered by Stripe
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="payment-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-6">Complete Your Donation</h2>

                  {clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <DonationCheckoutForm
                        amount={currentAmount}
                        donorInfo={{
                          name: `${firstName} ${lastName}`.trim(),
                          email: donorEmail,
                          message,
                          isAnonymous
                        }}
                        onSuccess={handlePaymentSuccess}
                        onCancel={handleCancelPayment}
                      />
                    </Elements>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Additional Information */}
          {!showPayment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
            >
              <GlassCard padding="md">
                <h3 className="font-semibold text-white mb-3">100% Transparency</h3>
                <p className="text-sm text-gray-300">
                  Every donation goes directly to supporting our community mission.
                  You'll receive regular updates on how your contribution is making a difference.
                </p>
              </GlassCard>

              <GlassCard padding="md">
                <h3 className="font-semibold text-white mb-3">Tax Deductible</h3>
                <p className="text-sm text-gray-300">
                  Ositos Bendecidos is a registered 501(c)(3) organization.
                  Your donation is tax-deductible to the full extent allowed by law.
                </p>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Donate;