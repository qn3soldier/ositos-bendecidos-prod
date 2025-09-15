import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { XMarkIcon, HeartIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestTitle: string;
  requestAmount: number;
  currentRaised: number;
}

const CheckoutForm: React.FC<{
  amount: number;
  requestId: string;
  requestTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ amount, requestId, onSuccess, onCancel }) => {
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
          return_url: `${window.location.origin}/donation-success?requestId=${requestId}`,
        },
      });

      if (error) {
        setError(error.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          type="submit"
          variant="gold"
          size="lg"
          className="flex-1"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Donate $${amount}`}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  requestId,
  requestTitle,
  requestAmount,
  currentRaised
}) => {
  const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount');
  const [donationAmount, setDonationAmount] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [donorInfo, setDonorInfo] = useState({ name: '', email: '' });

  const suggestedAmounts = [25, 50, 100, 250];
  const remainingAmount = requestAmount - currentRaised;

  const handleAmountSubmit = async () => {
    const amount = parseFloat(donationAmount);
    if (!amount || amount <= 0) return;

    try {
      const response = await fetch('/.netlify/functions/create-donation-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          requestId,
          requestTitle,
          donorEmail: donorInfo.email,
          donorName: donorInfo.name
        })
      });

      if (!response.ok) throw new Error('Failed to create payment intent');

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
      setStep('payment');
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Failed to initialize payment. Please try again.');
    }
  };

  const handleSuccess = () => {
    setStep('success');
    setTimeout(() => {
      onClose();
      window.location.reload(); // Reload to show updated amounts
    }, 3000);
  };

  const resetModal = () => {
    setStep('amount');
    setDonationAmount('');
    setClientSecret('');
    setDonorInfo({ name: '', email: '' });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Make a Donation</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {step === 'amount' && (
              <>
                {/* Request Info */}
                <div className="mb-6 p-4 bg-gold-primary/10 border border-gold-primary/20 rounded-lg">
                  <h4 className="font-medium text-gold-primary mb-2">{requestTitle}</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress:</span>
                    <span className="text-white">
                      ${currentRaised.toLocaleString()} of ${requestAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-gold-primary to-green-hope h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (currentRaised / requestAmount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Donor Info */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Your Name (Optional)</label>
                    <input
                      type="text"
                      value={donorInfo.name}
                      onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })}
                      placeholder="Anonymous"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email (Optional)</label>
                    <input
                      type="email"
                      value={donorInfo.email}
                      onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                      placeholder="For receipt only"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                    />
                  </div>
                </div>

                {/* Amount Selection */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-3">Donation Amount</label>

                  {/* Suggested Amounts */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {suggestedAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setDonationAmount(amount.toString())}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          donationAmount === amount.toString()
                            ? 'bg-gold-primary text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Enter custom amount"
                      min="1"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                    />
                  </div>

                  {remainingAmount > 0 && parseFloat(donationAmount) >= remainingAmount && (
                    <p className="mt-2 text-sm text-green-hope">
                      Your donation will complete this fundraising goal! 🎉
                    </p>
                  )}
                </div>

                <Button
                  variant="gold"
                  size="lg"
                  className="w-full"
                  onClick={handleAmountSubmit}
                  disabled={!donationAmount || parseFloat(donationAmount) <= 0}
                >
                  Continue to Payment
                </Button>
              </>
            )}

            {step === 'payment' && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#FFD700',
                      colorBackground: '#1a1a1a',
                      colorText: '#ffffff',
                      colorDanger: '#df1b41',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      borderRadius: '8px',
                    }
                  }
                }}
              >
                <CheckoutForm
                  amount={parseFloat(donationAmount)}
                  requestId={requestId}
                  requestTitle={requestTitle}
                  onSuccess={handleSuccess}
                  onCancel={() => setStep('amount')}
                />
              </Elements>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <HeartIcon className="w-20 h-20 text-green-hope mx-auto mb-4" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-gray-400">
                  Your donation of ${donationAmount} has been received.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Redirecting to updated page...
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DonationModal;