import React, { useState } from 'react';
import { HeartIcon, CurrencyDollarIcon, GiftIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../shared/GlassCard';
import GradientButton from '../../shared/GradientButton';

const Donate: React.FC = () => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donationType, setDonationType] = useState<'one-time' | 'monthly'>('one-time');

  const presetAmounts = [25, 50, 100, 250, 500];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleDonate = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (amount && amount > 0) {
      alert(`Thank you for your generous ${donationType} donation of $${amount}! Payment integration coming soon.`);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/5 to-gold-neon/5"></div>
      
      <div className="container relative py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <img src="/golden-bear.png" alt="Ositos Bendecidos" className="w-20 h-20 object-contain" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
              Support Our Mission
            </h1>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Your donation helps us build communities through faith, empowerment, and mutual support
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <GlassCard padding="lg">
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
                className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                  donationType === 'monthly'
                    ? 'bg-gold-primary/20 text-gold-primary border-gold-primary/30'
                    : 'bg-white/5 text-gray-300 border-white/20 hover:border-gold-primary/30'
                }`}
              >
                <HeartIcon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Monthly</span>
              </button>
            </div>

            {/* Amount Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Choose Amount</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleAmountSelect(amount)}
                    className={`py-3 px-4 rounded-lg border transition-all ${
                      selectedAmount === amount
                        ? 'bg-gold-primary/20 text-gold-primary border-gold-primary/30'
                        : 'bg-white/5 text-gray-300 border-white/20 hover:border-gold-primary/30'
                    }`}
                  >
                    ${amount}
                  </button>
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
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300">$25</span>
                  <span className="text-sm text-gray-400">Provides a family meal</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300">$50</span>
                  <span className="text-sm text-gray-400">Supports community programs</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300">$100</span>
                  <span className="text-sm text-gray-400">Helps fund prayer support services</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300">$250+</span>
                  <span className="text-sm text-gray-400">Enables community investment projects</span>
                </div>
              </div>
            </div>

            {/* Donor Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="md:col-span-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                />
              </div>
              
              <div className="mt-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-gold-primary bg-white/10 border-white/20 rounded focus:ring-gold-primary/20"
                  />
                  <span className="text-sm text-gray-300">
                    I would like to receive updates about how my donation is making an impact
                  </span>
                </label>
              </div>
            </div>

            {/* Donate Button */}
            <div className="text-center">
              <GradientButton
                size="lg"
                variant="gradient"
                onClick={handleDonate}
                disabled={!selectedAmount && !parseFloat(customAmount)}
                className="w-full md:w-auto"
              >
                <HeartIcon className="w-5 h-5 mr-2" />
                Donate {selectedAmount || parseFloat(customAmount) ? `$${selectedAmount || parseFloat(customAmount)}` : ''} {donationType === 'monthly' ? 'Monthly' : 'Now'}
              </GradientButton>
              
              <p className="text-xs text-gray-400 mt-4">
                Secure payment processing powered by Stripe (integration coming soon)
              </p>
            </div>
          </GlassCard>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donate;
