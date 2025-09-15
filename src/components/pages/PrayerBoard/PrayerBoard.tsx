import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, HeartIcon, ChatBubbleLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../shared/GlassCard';
import GradientButton from '../../shared/GradientButton';
import { useAuth } from '../../../contexts/AuthContext';

interface Prayer {
  id: string;
  user: string;
  content: string;
  date: string;
  prayers: number;
  isAnonymous: boolean;
  tags: string[];
  comments: number;
  createdAt: string;
  prayedByUsers?: string[];
}

const PrayerBoard: React.FC = () => {
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch prayers from API
  useEffect(() => {
    fetchPrayers();
  }, []);
  
  const fetchPrayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prayers');
      if (!response.ok) throw new Error('Failed to fetch prayers');
      const data = await response.json();

      // Transform API data to match component interface
      const transformedPrayers = (Array.isArray(data) ? data : data.prayers || []).map((prayer: any) => ({
        id: prayer.id,
        user: prayer.user_name || 'Anonymous',
        content: prayer.content,
        date: new Date(prayer.created_at).toLocaleString(),
        prayers: prayer.pray_count || 0,
        isAnonymous: prayer.is_anonymous || false,
        tags: prayer.tags || [],
        comments: 0, // Will need to implement comments count in API
        createdAt: prayer.created_at,
        prayedByUsers: prayer.prayed_by_users || []
      }));
      
      setPrayers(transformedPrayers);
    } catch (err) {
      console.error('Error fetching prayers:', err);
      setError('Failed to load prayers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Old mock data removed - now using real API data
  // const oldMockData = [...]  // Kept as reference for development
  
  /* Keeping old mock data as comment for reference:
    {
      id: '2',
      user: 'Anonymous',
      content: 'Lost my job last week and struggling to provide for my family. Praying for guidance and new opportunities.',
      date: '5 hours ago',
      prayers: 23,
      isAnonymous: true,
      tags: ['Employment', 'Family'],
      comments: 8,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      user: 'David K.',
      content: 'My elderly father was diagnosed with dementia. Please pray for strength for our family and peace for him.',
      date: '1 day ago',
      prayers: 38,
      isAnonymous: false,
      tags: ['Health', 'Family', 'Elderly'],
      comments: 15,
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      user: 'Anonymous',
      content: 'Struggling with depression and anxiety. Looking for hope and healing through faith.',
      date: '1 day ago',
      prayers: 56,
      isAnonymous: true,
      tags: ['Mental Health', 'Healing'],
      comments: 23,
      createdAt: new Date().toISOString()
    },
    {
      id: '5',
      user: 'Jennifer M.',
      content: 'Our community center needs funding to continue serving meals to those in need. Praying for provision.',
      date: '2 days ago',
      prayers: 31,
      isAnonymous: false,
      tags: ['Community', 'Provision'],
      comments: 9,
      createdAt: new Date().toISOString()
    },
    {
      id: '6',
      user: 'Michael R.',
      content: 'Celebrating 5 years sober today! Grateful for this community and asking for continued strength.',
      date: '2 days ago',
      prayers: 89,
      isAnonymous: false,
      tags: ['Recovery', 'Gratitude'],
      comments: 34,
      createdAt: new Date().toISOString()
    }
  */

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags] = useState<string[]>([]);
  const [showRequestForm, setShowRequestForm] = useState<boolean>(false);
  const [newPrayer, setNewPrayer] = useState({
    content: '',
    isAnonymous: false,
    tags: [] as string[]
  });
  
  // Comments state
  const [showCommentsModal, setShowCommentsModal] = useState<string | null>(null);
  const [prayerComments, setPrayerComments] = useState<{[key: string]: any[]}>({});
  const [newComment, setNewComment] = useState('');

  const categories = ['all', 'Health', 'Family', 'Employment', 'Recovery', 'Community'];
  const availableTags = ['Health', 'Children', 'Employment', 'Family', 'Elderly', 'Mental Health', 'Healing', 'Community', 'Provision', 'Recovery', 'Gratitude'];

  const filteredPrayers = prayers.filter(prayer => {
    const matchesCategory = selectedCategory === 'all' || prayer.tags.some(tag => 
      tag.toLowerCase() === selectedCategory.toLowerCase()
    );
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => 
      prayer.tags.some(prayerTag => prayerTag.toLowerCase() === tag.toLowerCase())
    );
    return matchesCategory && matchesTags;
  });

  const handleSubmitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayer.content.trim()) return;

    try {
      const response = await fetch('/api/prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || null, // Real user ID or null for anonymous
          user_name: newPrayer.isAnonymous ? null : (user?.firstName + ' ' + user?.lastName || 'Anonymous'),
          content: newPrayer.content,
          is_anonymous: newPrayer.isAnonymous,
          tags: newPrayer.tags.length > 0 ? newPrayer.tags : ['General']
        })
      });

      if (!response.ok) throw new Error('Failed to submit prayer');
      
      await fetchPrayers(); // Reload prayers list
      setNewPrayer({ content: '', isAnonymous: false, tags: [] });
      setShowRequestForm(false);
    } catch (err) {
      console.error('Error submitting prayer:', err);
      alert('Failed to submit prayer. Please try again.');
    }
  };

  const handleTagToggle = (tag: string) => {
    setNewPrayer(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handlePrayerLike = async (prayerId: string) => {
    // Check if user needs to log in for this action
    if (!user) {
      alert('Please log in to pray for someone. Anonymous prayer support coming soon!');
      return;
    }

    try {
      const response = await fetch(`/api/prayers/${prayerId}/pray`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id // Real user ID
        })
      });

      if (!response.ok) throw new Error('Failed to pray');
      
      // Optimistically update UI
      setPrayers(prev => prev.map(prayer => 
        prayer.id === prayerId 
          ? { ...prayer, prayers: prayer.prayers + 1 }
          : prayer
      ));
    } catch (err) {
      console.error('Error praying:', err);
    }
  };

  // Handle showing comments
  const handleShowComments = async (prayerId: string) => {
    setShowCommentsModal(prayerId);
    
    // Fetch comments if not already loaded
    if (!prayerComments[prayerId]) {
      try {
        const response = await fetch(`/api/prayers/${prayerId}/interactions?type=comment`);
        if (response.ok) {
          const data = await response.json();
          setPrayerComments(prev => ({
            ...prev,
            [prayerId]: data.interactions || []
          }));
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    }
  };

  // Handle adding new comment
  const handleAddComment = async (prayerId: string) => {
    if (!user) {
      alert('Please log in to comment');
      return;
    }
    
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/prayers/${prayerId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_text: newComment,
          user_id: user.id
        })
      });

      if (response.ok) {
        // Add comment optimistically to UI
        const newCommentObj = {
          id: Date.now().toString(),
          text: newComment,
          created_at: new Date().toISOString(),
          user: { name: `${user.firstName} ${user.lastName}` }
        };

        setPrayerComments(prev => ({
          ...prev,
          [prayerId]: [...(prev[prayerId] || []), newCommentObj]
        }));

        // Update comment count in prayers list
        setPrayers(prev => prev.map(prayer => 
          prayer.id === prayerId 
            ? { ...prayer, comments: prayer.comments + 1 }
            : prayer
        ));

        setNewComment('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
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
            Prayer Board
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Share your prayers with our community and lift each other up in faith
          </p>
          <GradientButton
            size="lg"
            variant="gradient"
            onClick={() => setShowRequestForm(true)}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Request a Prayer
          </GradientButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <GlassCard padding="md">
              <h3 className="font-semibold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 capitalize ${
                      selectedCategory === category
                        ? 'bg-gold-primary/20 text-gold-primary border border-gold-primary/30'
                        : 'text-gray-300 hover:bg-white/5 hover:text-gold-primary'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Prayer Warriors */}
            <GlassCard padding="md" className="mt-6">
              <h3 className="font-semibold text-white mb-4">Prayer Warriors</h3>
              <p className="text-sm text-gray-300">
                Our community comes together to support each other through prayer and faith.
              </p>
            </GlassCard>
          </div>

          {/* Prayer Cards */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-primary mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading prayers...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-400">{error}</p>
                </div>
              ) : filteredPrayers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No prayers found. Be the first to share a prayer!</p>
                </div>
              ) : (
                filteredPrayers.map((prayer) => (
                <motion.div
                  key={prayer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <GlassCard padding="lg" hover>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gold-primary to-gold-neon flex items-center justify-center">
                          <span className="text-sm font-bold text-black">
                            {prayer.isAnonymous ? '?' : prayer.user.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {prayer.isAnonymous ? 'Anonymous' : prayer.user}
                          </p>
                          <p className="text-sm text-gray-400">{prayer.date}</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4 leading-relaxed">
                      {prayer.content}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {prayer.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gold-primary/20 text-gold-primary text-xs rounded-full border border-gold-primary/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handlePrayerLike(prayer.id)}
                          className="flex items-center space-x-2 text-gray-400 hover:text-gold-primary transition-colors"
                        >
                          <HeartIcon className="w-5 h-5" />
                          <span className="text-sm">{prayer.prayers} prayers</span>
                        </button>
                        <button 
                          onClick={() => handleShowComments(prayer.id)}
                          className="flex items-center space-x-2 text-gray-400 hover:text-gold-primary transition-colors"
                        >
                          <ChatBubbleLeftIcon className="w-5 h-5" />
                          <span className="text-sm">{prayer.comments} comments</span>
                        </button>
                      </div>
                      <button className="text-gold-primary hover:text-gold-neon transition-colors text-sm font-medium">
                        Join Prayer
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
            </div>
          </div>
        </div>

        {/* Request Prayer Modal */}
        <AnimatePresence>
          {showRequestForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowRequestForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <GlassCard padding="lg">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Request a Prayer</h2>
                    <button
                      onClick={() => setShowRequestForm(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

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
                            You can post anonymously or with your name
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
                            Anonymous User
                          </p>
                          <p className="text-xs text-gray-400">
                            Your prayer will be posted anonymously
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmitPrayer} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your prayer request
                      </label>
                      <textarea
                        value={newPrayer.content}
                        onChange={(e) => setNewPrayer(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Share what's on your heart..."
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20 resize-none"
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tags (select relevant categories)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleTagToggle(tag)}
                            className={`px-3 py-1 text-xs rounded-full border transition-all ${
                              newPrayer.tags.includes(tag)
                                ? 'bg-gold-primary/20 text-gold-primary border-gold-primary/30'
                                : 'bg-white/5 text-gray-400 border-white/20 hover:border-gold-primary/30 hover:text-gold-primary'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {user && (
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="anonymous"
                          checked={newPrayer.isAnonymous}
                          onChange={(e) => setNewPrayer(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                          className="w-4 h-4 text-gold-primary bg-white/10 border-white/20 rounded focus:ring-gold-primary/20"
                        />
                        <label htmlFor="anonymous" className="text-sm text-gray-300">
                          Submit anonymously (hide your name)
                        </label>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowRequestForm(false)}
                        className="flex-1 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        Cancel
                      </button>
                      <GradientButton
                        type="submit"
                        size="md"
                        variant="gradient"
                        className="flex-1"
                      >
                        Submit Prayer
                      </GradientButton>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments Modal */}
        <AnimatePresence>
          {showCommentsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCommentsModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg max-h-[80vh] overflow-hidden"
              >
                <GlassCard padding="lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Prayer Comments</h3>
                    <button
                      onClick={() => setShowCommentsModal(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Comments List */}
                  <div className="max-h-60 overflow-y-auto mb-4 space-y-3">
                    {prayerComments[showCommentsModal]?.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">
                        No comments yet. Be the first to share encouragement!
                      </p>
                    ) : (
                      prayerComments[showCommentsModal]?.map((comment: any) => (
                        <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-gold-primary to-gold-neon rounded-full flex items-center justify-center text-black font-semibold text-sm">
                              {comment.user?.name?.[0] || 'A'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="text-sm font-medium text-white">
                                  {comment.user?.name || 'Anonymous'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="text-sm text-gray-300">{comment.text}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Form */}
                  {user ? (
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-gold-primary to-gold-neon rounded-full flex items-center justify-center text-black font-semibold text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Share words of encouragement..."
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50 resize-none"
                            rows={2}
                            maxLength={500}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {newComment.length}/500
                            </span>
                            <GradientButton
                              size="sm"
                              variant="gradient"
                              onClick={() => handleAddComment(showCommentsModal!)}
                              disabled={!newComment.trim()}
                            >
                              Comment
                            </GradientButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-white/10 pt-4 text-center">
                      <p className="text-gray-400">Please log in to add comments</p>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PrayerBoard;
