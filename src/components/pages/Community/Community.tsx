import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HandRaisedIcon, CurrencyDollarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../shared/GlassCard';
import GradientButton from '../../shared/GradientButton';
import DonationModal from '../../shared/DonationModal';
import { useAuth } from '../../../contexts/AuthContext';

interface CommunityRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  amountNeeded: number;
  amountRaised: number;
  daysLeft: number;
  submitter: string;
}

const Community: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'browse' | 'submit'>('browse');
  const [filter, setFilter] = useState('all');
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Donation modal state
  const [selectedRequest, setSelectedRequest] = useState<CommunityRequest | null>(null);

  // Form state for submit request
  const [requestForm, setRequestForm] = useState({
    name: '',
    location: '',
    title: '',
    category: '',
    amount: '',
    description: '',
    age: '',
    story: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);
  
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/.netlify/functions/community/requests');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();

      // Transform API data to match component interface
      const transformedRequests = (Array.isArray(data) ? data : data.requests || []).map((request: any) => ({
        id: request.id,
        title: request.title,
        description: request.description,
        location: request.location || 'Not specified',
        category: request.category,
        amountNeeded: request.target_amount || 0,
        amountRaised: request.raised_amount || 0,
        daysLeft: Math.max(0, Math.ceil((new Date(request.deadline || Date.now() + 30*24*60*60*1000).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
        submitter: request.user_name || 'Anonymous',
        // Remove growthPlan - not in our form anymore
      }));

      setRequests(transformedRequests);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load community requests.');
    } finally {
      setLoading(false);
    }
  };
  
  // Old mock data removed - now using real API

  const categories = [
    { value: 'all', label: 'All Requests' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'medical', label: 'Health' },
    { value: 'housing', label: 'Housing' }
  ];

  const filteredRequests = requests.filter(request => 
    filter === 'all' || request.category === filter
  );

  const handleDonate = (requestId: string) => {
    if (!user) {
      alert('Please log in to make a donation.');
      return;
    }
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
    }
  };
  
  const closeDonationModal = () => {
    setSelectedRequest(null);
    // Refresh to show updated amounts
    fetchRequests();
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitLoading(true);

    try {
      const response = await fetch('/.netlify/functions/community/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } : {})
        },
        body: JSON.stringify({
          user_id: user?.id || null,
          title: requestForm.title,
          description: requestForm.description,
          category: requestForm.category,
          target_amount: parseFloat(requestForm.amount),
          // Don't send location as separate field - causes Supabase error
          user_name: requestForm.name || user?.firstName + ' ' + user?.lastName || 'Anonymous',
          age: requestForm.age,
          story: requestForm.story,
          user_location: requestForm.location, // Send as user_location instead
          status: 'active',
          raised_amount: 0,
          deadline: new Date(Date.now() + 30*24*60*60*1000).toISOString() // 30 days from now
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }

      await response.json();

      // Show success message
      alert('Your request has been submitted successfully! It will be reviewed by our team.');

      // Reset form
      setRequestForm({
        name: '',
        location: '',
        title: '',
        category: '',
        amount: '',
        description: '',
        age: '',
        story: ''
      });

      // Switch to browse tab and refresh
      setActiveTab('browse');
      await fetchRequests();

    } catch (err) {
      console.error('Submit error:', err);
      alert(`Error submitting request: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-hope/5 to-gold-primary/5"></div>
      
      <div className="container relative py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-hope to-gold-primary bg-clip-text text-transparent">
            Community Help
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Empowering growth through mutual support. No handouts, only hand-ups.
          </p>
          
          {/* Tab Navigation */}
          <div className="flex justify-center">
            <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                  activeTab === 'browse'
                    ? 'bg-gold-primary/20 text-gold-primary'
                    : 'text-gray-300 hover:text-gold-primary'
                }`}
              >
                Browse Requests
              </button>
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                  activeTab === 'submit'
                    ? 'bg-gold-primary/20 text-gold-primary'
                    : 'text-gray-300 hover:text-gold-primary'
                }`}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'browse' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <GlassCard padding="md">
                <h3 className="font-semibold text-white mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setFilter(category.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 ${
                        filter === category.value
                          ? 'bg-green-hope/20 text-green-hope border border-green-hope/30'
                          : 'text-gray-300 hover:bg-white/5 hover:text-green-hope'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </GlassCard>

              <GlassCard padding="md" className="mt-6">
                <h3 className="font-semibold text-white mb-4">Community Support</h3>
                <p className="text-sm text-gray-300">
                  Our community comes together to support those in need through prayer, 
                  practical assistance, and mutual encouragement.
                </p>
              </GlassCard>
            </div>

            {/* Request Cards */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-primary mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading community requests...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-400">{error}</p>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No community requests found. Be the first to submit one!</p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <GlassCard padding="lg" hover>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-serif text-xl font-semibold text-white mb-2">
                                {request.title}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span className="flex items-center">
                                  <MapPinIcon className="w-4 h-4 mr-1" />
                                  {request.location}
                                </span>
                                <span className="px-2 py-1 bg-green-hope/20 text-green-hope rounded-full border border-green-hope/30">
                                  {request.category}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center text-sm text-orange-400">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {request.daysLeft} days left
                            </div>
                          </div>

                          <p className="text-gray-300 mb-4 leading-relaxed">
                            {request.description}
                          </p>


                          <p className="text-sm text-gray-400">
                            Submitted by: <span className="text-white">{request.submitter}</span>
                          </p>
                        </div>

                        <div className="lg:col-span-1">
                          <div className="bg-gradient-to-br from-gold-primary/10 to-green-hope/10 rounded-lg p-6 border border-gold-primary/20">
                            <div className="text-center mb-4">
                              <p className="text-2xl font-bold text-gold-primary">
                                ${request.amountRaised.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-400">
                                of ${request.amountNeeded.toLocaleString()} goal
                              </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
                              <div
                                className="bg-gradient-to-r from-gold-primary to-green-hope h-2 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${Math.min(100, (request.amountRaised / request.amountNeeded) * 100)}%` 
                                }}
                              ></div>
                            </div>

                            <div className="space-y-3">
                              <GradientButton 
                                size="sm" 
                                variant="gradient" 
                                className="w-full"
                                onClick={() => handleDonate(request.id)}
                              >
                                <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                                Donate
                              </GradientButton>
                              <GradientButton size="sm" variant="outline" className="w-full">
                                <HandRaisedIcon className="w-4 h-4 mr-2" />
                                Partner
                              </GradientButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))
              )}
              </div>
            </div>
          </div>
        ) : (
          /* Submit Request Form */
          <div className="max-w-3xl mx-auto">
            <GlassCard padding="lg">
              <h2 className="font-serif text-2xl font-semibold text-white mb-6">
                Submit a Request for Help
              </h2>

              {/* User Status */}
              <div className="mb-6 p-3 bg-green-hope/10 border border-green-hope/20 rounded-lg">
                {user ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-gold-primary to-gold-neon rounded-full flex items-center justify-center text-black font-semibold text-sm">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-hope">
                        Logged in as {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Your request will be linked to your account
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-gray-300 text-sm">
                      ?
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        Anonymous Submission
                      </p>
                      <p className="text-xs text-gray-400">
                        Consider creating an account to track your request
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <form className="space-y-6" onSubmit={handleSubmitRequest}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={requestForm.name}
                      onChange={(e) => setRequestForm({...requestForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-hope/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="City, State"
                      value={requestForm.location}
                      onChange={(e) => setRequestForm({...requestForm, location: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-hope/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Request Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief, clear description of your need"
                    value={requestForm.title}
                    onChange={(e) => setRequestForm({...requestForm, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-hope/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    required
                    value={requestForm.category}
                    onChange={(e) => setRequestForm({...requestForm, category: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-hope/50"
                  >
                    <option value="">Select a category</option>
                    <option value="business">Business</option>
                    <option value="education">Education</option>
                    <option value="medical">Health</option>
                    <option value="housing">Housing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount Needed
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="5000"
                    value={requestForm.amount}
                    onChange={(e) => setRequestForm({...requestForm, amount: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-hope/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Explain your situation, background, and specific needs..."
                    value={requestForm.description}
                    onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-hope/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Age (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Age of beneficiary"
                      value={requestForm.age}
                      onChange={(e) => setRequestForm({...requestForm, age: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-hope/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Personal Story (Optional)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Share your personal story or background..."
                      value={requestForm.story}
                      onChange={(e) => setRequestForm({...requestForm, story: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-hope/50 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-center">
                  <GradientButton type="submit" size="lg" variant="gradient" disabled={submitLoading}>
                    {submitLoading ? 'Submitting...' : 'Submit Request for Review'}
                  </GradientButton>
                </div>
              </form>
            </GlassCard>
          </div>
        )}
        
        {/* Donation Modal */}
        {selectedRequest && (
          <DonationModal
            isOpen={true}
            onClose={closeDonationModal}
            requestId={selectedRequest.id}
            requestTitle={selectedRequest.title}
            requestAmount={selectedRequest.amountNeeded}
            currentRaised={selectedRequest.amountRaised}
          />
        )}
      </div>
    </div>
  );
};

export default Community;
