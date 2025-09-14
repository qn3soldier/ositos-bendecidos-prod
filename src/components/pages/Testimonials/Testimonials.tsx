import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftIcon as QuoteIcon, PlusIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../shared/GlassCard';
import GradientButton from '../../shared/GradientButton';
import { useAuth } from '../../../contexts/AuthContext';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  story: string;
  category: string;
  date: string;
  beforeAmount?: number;
  afterAmount?: number;
  impact: string;
}

const Testimonials: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Testimonial | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchTestimonials();
  }, []);
  
  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/testimonials');
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      const data = await response.json();
      
      // Transform API data to match component interface
      const transformedTestimonials = data.testimonials.map((t: any) => ({
        id: t.id,
        name: t.users?.name || 'Anonymous',
        location: t.location || 'Location not specified',
        story: t.content,
        category: t.category || 'General',
        date: new Date(t.created_at).toLocaleDateString(),
        beforeAmount: t.impact_metrics?.before_amount || 0,
        afterAmount: t.impact_metrics?.after_amount || 0,
        impact: t.impact_metrics?.description || t.after_situation || 'Impact details to be provided'
      }));
      
      setTestimonials(transformedTestimonials);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Failed to load testimonials.');
    } finally {
      setLoading(false);
    }
  };
  
  
  /*
  const oldTestimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Maria Santos',
      location: 'Phoenix, AZ',
      story: 'Thanks to the community support, I was able to start my bakery business. From struggling to feed my children to employing 3 other mothers in my neighborhood.',
      category: 'Business Success',
      date: '3 months ago',
      beforeAmount: 0,
      afterAmount: 2500,
      impact: 'Now providing income for 4 families and serving 200+ customers weekly'
    },
    {
      id: '2',
      name: 'David Rodriguez',
      location: 'Austin, TX',
      story: 'The coding bootcamp sponsorship changed my entire life trajectory. From being unemployed veteran to landing a $75K software developer job.',
      category: 'Career Change',
      date: '6 months ago',
      beforeAmount: 0,
      afterAmount: 75000,
      impact: 'Career transition led to financial stability and serving as mentor for other veterans'
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      location: 'Denver, CO',
      story: 'The nursing school childcare support made it possible for me to complete my RN degree while raising two kids as a single mother.',
      category: 'Education',
      date: '1 year ago',
      beforeAmount: 25000,
      afterAmount: 65000,
      impact: 'Now working in pediatric ICU, helping children like my own'
    }
  ];
  */

  const categories = [
    { value: 'all', label: 'All Stories' },
    { value: 'Business Success', label: 'Business Success' },
    { value: 'Career Change', label: 'Career Change' },
    { value: 'Education', label: 'Education' }
  ];

  const filteredTestimonials = testimonials.filter(testimonial => 
    filter === 'all' || testimonial.category === filter
  );

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0" style={{background: 'linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)'}}></div>
      
      <div className="container relative py-8">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
            Stories of Transformation
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Real stories from real people whose lives have been touched by our community support and faith
          </p>
          <GradientButton
            size="lg"
            variant="gradient"
            onClick={() => setIsSubmitModalOpen(true)}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Share Your Story
          </GradientButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <GlassCard padding="md" className="mb-6">
              <h3 className="font-semibold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setFilter(category.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 ${
                      filter === category.value
                        ? 'bg-gold-primary/20 text-gold-primary border border-gold-primary/30'
                        : 'text-gray-300 hover:bg-white/5 hover:text-gold-primary'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-primary mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading testimonials...</p>
                </div>
              ) : error ? (
                <div className="col-span-2 text-center py-12">
                  <p className="text-red-400">{error}</p>
                </div>
              ) : filteredTestimonials.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <p className="text-gray-400">No testimonials found. Be the first to share your story!</p>
                </div>
              ) : (
                filteredTestimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <GlassCard padding="lg" hover className="h-full">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-gold-primary to-gold-neon rounded-full flex items-center justify-center mr-3">
                          <span className="text-lg font-bold text-black">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{testimonial.name}</h3>
                          <p className="text-sm text-gray-400">{testimonial.location}</p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-gold-neon/20 text-gold-neon rounded-full border border-gold-neon/30">
                          {testimonial.category}
                        </span>
                      </div>

                      <div className="relative mb-4">
                        <QuoteIcon className="absolute -top-2 -left-2 w-6 h-6 text-gold-primary/50" />
                        <p className="text-gray-300 leading-relaxed pl-4 flex-1">
                          "{testimonial.story}"
                        </p>
                      </div>

                      {testimonial.beforeAmount !== undefined && testimonial.afterAmount !== undefined && (
                        <div className="bg-gradient-to-r from-gold-primary/10 to-gold-neon/10 rounded-lg p-4 mb-4 border border-gold-primary/20">
                          <h4 className="font-medium text-gold-primary mb-2">Financial Impact:</h4>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">
                              Before: ${testimonial.beforeAmount.toLocaleString()}/year
                            </span>
                            <span className="text-gold-neon font-semibold">
                              After: ${testimonial.afterAmount.toLocaleString()}/year
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="bg-gold-primary/10 border border-gold-primary/20 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gold-primary font-medium mb-1">Community Impact:</p>
                        <p className="text-xs text-gray-300">{testimonial.impact}</p>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm text-gray-400">{testimonial.date}</span>
                        <GradientButton
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStory(testimonial)}
                        >
                          Read Full Story
                        </GradientButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
            </div>
          </div>
        </div>

        <section className="mt-16">
          <GlassCard padding="lg">
            <div className="text-center">
              <img src="/golden-bear.png" alt="Ositos Bendecidos" className="w-20 h-20 mx-auto mb-6 object-contain" />
              <h2 className="font-serif text-3xl font-semibold mb-6 bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
                From Our Community
              </h2>
              <blockquote className="text-lg text-gray-300 max-w-3xl mx-auto italic leading-relaxed mb-6">
                "Every story shared here represents a life transformed through the power of community and faith. 
                These testimonials inspire the next generation of success stories."
              </blockquote>
              <p className="text-gold-primary font-semibold">— Ositos Bendecidos Community</p>
            </div>
          </GlassCard>
        </section>
      </div>

      <AnimatePresence>
        {isSubmitModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsSubmitModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard padding="lg">
                <h3 className="font-serif text-2xl font-semibold text-white mb-6">
                  Share Your Transformation Story
                </h3>

                {/* User Status */}
                <div className="mb-6 p-3 bg-blue-heaven/10 border border-blue-heaven/20 rounded-lg">
                  {user ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-gold-primary to-gold-neon rounded-full flex items-center justify-center text-black font-semibold text-sm">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-heaven">
                          Logged in as {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          Your story will be linked to your account
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
                          Anonymous Story
                        </p>
                        <p className="text-xs text-gray-400">
                          Create an account to get credit for your success story
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <form className="space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const testimonialData = {
                    name: formData.get('name') as string,
                    location: formData.get('location') as string,
                    story: formData.get('story') as string,
                    category: formData.get('category') as string,
                    beforeSituation: formData.get('beforeSituation') as string,
                    afterSituation: formData.get('afterSituation') as string,
                    beforeAmount: parseFloat(formData.get('beforeAmount') as string) || 0,
                    afterAmount: parseFloat(formData.get('afterAmount') as string) || 0,
                    impact: formData.get('impact') as string
                  };
                  
                  try {
                    const response = await fetch('/api/testimonials', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_id: user?.id || 'anonymous',
                        title: `${testimonialData.name}'s Story`,
                        content: testimonialData.story,
                        category: testimonialData.category,
                        location: testimonialData.location,
                        before_situation: testimonialData.beforeSituation,
                        after_situation: testimonialData.afterSituation,
                        impact_metrics: {
                          before_amount: testimonialData.beforeAmount,
                          after_amount: testimonialData.afterAmount,
                          description: testimonialData.impact
                        }
                      })
                    });
                    
                    if (!response.ok) throw new Error('Failed to submit testimonial');
                    
                    await fetchTestimonials();
                    setIsSubmitModalOpen(false);
                    alert('Your story has been submitted successfully!');
                  } catch (err) {
                    console.error('Error submitting testimonial:', err);
                    alert('Failed to submit testimonial. Please try again.');
                  }
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={user ? `${user.firstName} ${user.lastName}` : ''}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        required
                        placeholder="City, State"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                    >
                      <option value="">Select a category</option>
                      <option value="Business Success">Business Success</option>
                      <option value="Career Change">Career Change</option>
                      <option value="Education">Education</option>
                      <option value="Health & Recovery">Health & Recovery</option>
                      <option value="Family Support">Family Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Story
                    </label>
                    <textarea
                      name="story"
                      rows={4}
                      required
                      placeholder="Share your transformation journey..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Before Situation
                      </label>
                      <input
                        type="text"
                        name="beforeSituation"
                        placeholder="Describe your situation before"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        After Situation
                      </label>
                      <input
                        type="text"
                        name="afterSituation"
                        placeholder="Describe your situation now"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Income Before (Annual)
                      </label>
                      <input
                        type="number"
                        name="beforeAmount"
                        placeholder="0"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Income After (Annual)
                      </label>
                      <input
                        type="number"
                        name="afterAmount"
                        placeholder="0"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Community Impact
                    </label>
                    <textarea
                      name="impact"
                      rows={2}
                      placeholder="How has your transformation impacted others?"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 resize-none"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <GradientButton
                      type="button"
                      size="md"
                      variant="outline"
                      onClick={() => setIsSubmitModalOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </GradientButton>
                    <GradientButton
                      type="submit"
                      size="md"
                      variant="gradient"
                      className="flex-1"
                    >
                      Submit Story
                    </GradientButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStory(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard padding="lg">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-gold-primary to-gold-neon rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold text-black">
                      {selectedStory.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-white">{selectedStory.name}</h2>
                    <p className="text-gray-400">{selectedStory.location} • {selectedStory.date}</p>
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg text-gray-300 leading-relaxed mb-6">
                    "{selectedStory.story}"
                  </p>
                  
                  <div className="bg-gradient-to-r from-gold-primary/10 to-gold-neon/10 rounded-lg p-6 border border-gold-primary/20 mb-6">
                    <h3 className="font-semibold text-gold-primary mb-3">Impact & Growth</h3>
                    <p className="text-gray-300 mb-4">{selectedStory.impact}</p>
                    
                    {selectedStory.beforeAmount !== undefined && selectedStory.afterAmount !== undefined && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-400">Before</p>
                          <p className="text-xl font-bold text-gray-300">
                            ${selectedStory.beforeAmount.toLocaleString()}/year
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-400">After</p>
                          <p className="text-xl font-bold text-gold-neon">
                            ${selectedStory.afterAmount.toLocaleString()}/year
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <GradientButton
                    size="md"
                    variant="outline"
                    onClick={() => setSelectedStory(null)}
                  >
                    Close
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Testimonials;
