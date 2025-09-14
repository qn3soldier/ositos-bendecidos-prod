import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BuildingStorefrontIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../shared/GlassCard';
import GradientButton from '../../shared/GradientButton';

interface InvestmentOpportunity {
  id: string;
  title: string;
  description: string;
  long_description?: string;
  location?: string;
  target_amount: number;
  current_funded: number;
  expected_jobs?: number;
  category: string;
  timeline_months?: number;
  community_impact?: string;
  expected_roi_percentage?: number;
  beneficiaries_count?: number;
  funding_progress: number;
  investor_count: number;
  days_left?: number;
  status: string;
}

interface InvestmentFormData {
  fullName: string;
  email: string;
  investmentAmount: string;
  interestArea: string;
  message: string;
  receiveUpdates: boolean;
}

const Investment: React.FC = () => {
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null); // TODO: Will be used for investment flow
  const [investmentAmount] = useState<number>(100); // TODO: Will be made interactive in investment modal
  
  // Fetch opportunities from API
  useEffect(() => {
    fetchOpportunities();
  }, []);
  
  const fetchOpportunities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/investment-platform/opportunities`);
      const data = await response.json();
      
      if (data.opportunities) {
        setOpportunities(data.opportunities);
      }
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      setError('Failed to load investment opportunities');
      // Fallback to demo data if API fails
      setOpportunities([
        {
          id: 'demo-1',
          title: 'Community Support Center',
          description: 'Local community center providing resources, guidance, and support for families in need.',
          location: 'Phoenix, AZ',
          target_amount: 15000,
          current_funded: 7500,
          expected_jobs: 12,
          category: 'community',
          timeline_months: 6,
          community_impact: 'Supporting local families with resources and guidance during difficult times.',
          funding_progress: 50,
          investor_count: 0,
          days_left: 60,
          status: 'active'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInvest = async (opportunityId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/investment-platform/opportunities/${opportunityId}/invest`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: investmentAmount,
            investment_type: 'donation',
            payment_method: 'paypal',
            investor_name: formData.fullName || 'Anonymous',
            investor_email: formData.email
          })
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: `Thank you for your investment of $${investmentAmount}!`
        });
        fetchOpportunities(); // Refresh data
      } else {
        throw new Error(data.message || 'Investment failed');
      }
    } catch (err) {
      console.error('Investment error:', err);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to process investment. Please try again.'
      });
    }
  };

  const [formData, setFormData] = useState<InvestmentFormData>({
    fullName: '',
    email: '',
    investmentAmount: '',
    interestArea: '',
    message: '',
    receiveUpdates: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Отправляем запрос на backend API
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/investments/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit inquiry');
      }
      
      setSubmitStatus({
        type: 'success',
        message: 'Thank you for your interest! We will contact you within 24-48 hours.'
      });
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        investmentAmount: '',
        interestArea: '',
        message: '',
        receiveUpdates: false
      });
      
      // Scroll to message
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit your inquiry. Please try again or contact us directly.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="absolute inset-0" style={{background: 'linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)'}}></div>
      
      <div className="container relative py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
            Invest & Build
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
            Partner with us to create lasting change through strategic investments in 
            sustainable community development projects that generate both social and financial returns.
          </p>
        </div>

        {/* Vision Statement */}
        <section className="mb-16">
          <GlassCard padding="lg" animated>
            <div className="text-center">
              <h2 className="font-serif text-3xl font-semibold mb-6 bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
                Our Investment Vision
              </h2>
              <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
                We believe in empowerment through opportunity. Our investments focus on creating 
                sustainable businesses and educational programs that provide long-term employment 
                and skill development for communities in need. Every dollar invested multiplies 
                into lasting change.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-gold-primary to-gold-neon rounded-full flex items-center justify-center mx-auto mb-3">
                    <BuildingStorefrontIcon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Business Development</h3>
                  <p className="text-sm text-gray-400">Creating sustainable employment through strategic business investments</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-gold-primary to-gold-neon rounded-full flex items-center justify-center mx-auto mb-3">
                    <ChartBarIcon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Skill Development</h3>
                  <p className="text-sm text-gray-400">Training programs that prepare people for high-value careers</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-gold-neon to-gold-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <UsersIcon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Community Impact</h3>
                  <p className="text-sm text-gray-400">Building strong, self-sufficient communities that thrive</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Investment Opportunities */}
        <section className="mb-16">
          <h2 className="font-serif text-3xl font-semibold text-center mb-8 text-white">
            Current Investment Opportunities
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold-primary"></div>
              <p className="text-gray-400 mt-4">Loading opportunities...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No investment opportunities available at the moment.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {opportunities.map((opportunity) => (
              <motion.div
                key={opportunity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <GlassCard padding="lg" hover className="h-full">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-3 py-1 text-xs bg-gold-primary/20 text-gold-primary rounded-full border border-gold-primary/30">
                        {opportunity.category}
                      </span>
                      <span className="text-sm text-gray-400">{opportunity.timeline_months ? `${opportunity.timeline_months} months` : 'Ongoing'}</span>
                    </div>
                    
                    <h3 className="font-serif text-xl font-semibold text-white mb-2">
                      {opportunity.title}
                    </h3>
                    
                    <p className="text-sm text-gray-400 mb-3">{opportunity.location || 'Multiple Locations'}</p>
                    
                    <p className="text-gray-300 mb-4 leading-relaxed flex-1">
                      {opportunity.description}
                    </p>
                    
                    <div className="bg-gradient-to-r from-gold-primary/10 to-gold-neon/10 rounded-lg p-4 mb-4 border border-gold-primary/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300">Progress</span>
                        <span className="text-sm font-medium text-white">
                          ${(opportunity.current_funded || 0).toLocaleString()} / ${(opportunity.target_amount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                        <div
                          className="bg-gradient-to-r from-gold-primary to-gold-neon h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, opportunity.funding_progress || 0)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gold-primary">Expected Jobs: {opportunity.expected_jobs || 'N/A'}</span>
                        <span className="text-gold-primary">
                          {Math.round(opportunity.funding_progress || 0)}% funded
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <GradientButton
                        size="sm"
                        variant="gradient"
                        className="w-full"
                        onClick={() => window.location.href = `/investment/${opportunity.id}`}
                      >
                        View Details
                      </GradientButton>
                      <GradientButton
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          // setSelectedOpportunity(opportunity.id); // TODO: Will be used when investment modal is implemented
                          handleInvest(opportunity.id);
                        }}
                      >
                        Invest Now
                      </GradientButton>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
          )}
        </section>

        {/* Partnership Form */}
        <section>
          <div className="max-w-3xl mx-auto">
            <GlassCard padding="lg">
              <div className="text-center mb-8">
                <h2 className="font-serif text-3xl font-semibold mb-4 bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
                  Become an Investment Partner
                </h2>
                <p className="text-lg text-gray-300">
                  Join our mission to create sustainable change through strategic investments
                </p>
              </div>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Investment Amount
                    </label>
                    <select 
                      name="investmentAmount"
                      value={formData.investmentAmount}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                    >
                      <option value="">Select amount range</option>
                      <option value="1000-5000">$1,000 - $5,000</option>
                      <option value="5000-10000">$5,000 - $10,000</option>
                      <option value="10000-25000">$10,000 - $25,000</option>
                      <option value="25000+">$25,000+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Interest Area
                    </label>
                    <select 
                      name="interestArea"
                      value={formData.interestArea}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                    >
                      <option value="">Select focus area</option>
                      <option value="retail">Retail Development</option>
                      <option value="education">Education & Training</option>
                      <option value="crafts">Traditional Crafts</option>
                      <option value="technology">Technology</option>
                      <option value="any">Open to All Projects</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message / Investment Goals
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    placeholder="Tell us about your investment goals and interests..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 resize-none"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="updates"
                    name="receiveUpdates"
                    checked={formData.receiveUpdates}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-heaven bg-white/10 border-white/20 rounded focus:ring-gold-primary/50"
                  />
                  <label htmlFor="updates" className="text-sm text-gray-300">
                    I would like to receive updates on investment opportunities and impact reports
                  </label>
                </div>

                {/* Success/Error Message */}
                {submitStatus.type && (
                  <div className={`p-4 rounded-lg ${
                    submitStatus.type === 'success' 
                      ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
                      : 'bg-red-500/20 border border-red-500/50 text-red-300'
                  }`}>
                    {submitStatus.message}
                  </div>
                )}

                <div className="flex justify-center">
                  <GradientButton 
                    type="submit" 
                    size="lg" 
                    variant="gradient"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Partnership Inquiry'}
                  </GradientButton>
                </div>
              </form>
            </GlassCard>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Investment;
