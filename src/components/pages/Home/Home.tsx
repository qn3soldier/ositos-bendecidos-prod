import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// heroicons not needed here; using ModernIcon wrapper
import { Button } from '../../ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/Card';
// Logo is not used here anymore
import ModernIcon from '../../shared/Icon';
import AuthModals from '../../global/AuthModals';
import { useAuth } from '../../../contexts/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleJoinCommunity = () => {
    if (user) {
      navigate('/community');
    } else {
      setAuthMode('register');
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen relative smooth-gradient">
      {/* Unified background flowing from header */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, 
              rgba(0, 0, 0, 0.85) 0%, 
              rgba(10, 10, 10, 0.90) 3%, 
              rgba(0, 0, 0, 0.95) 6%, 
              #000000 10%, 
              #0a0a0a 20%, 
              #1a1a1a 35%, 
              #0a0a0a 55%, 
              #000000 75%, 
              #000000 100%
            )
          `
        }}
      />
      
      {/* Beautiful flowing gold elements */}
      <div 
        className="absolute top-20 right-0 w-2/3 h-3/4 blur-3xl opacity-50"
        style={{
          background: `
            radial-gradient(ellipse 70% 90% at 85% 45%, 
              rgba(255, 215, 0, 0.30) 0%, 
              rgba(255, 215, 0, 0.20) 20%, 
              rgba(218, 165, 32, 0.15) 40%, 
              rgba(255, 215, 0, 0.08) 60%, 
              rgba(212, 175, 55, 0.04) 80%, 
              transparent 100%
            )
          `
        }}
      />
      
      {/* Beautiful bottom accent wave */}
      <div 
        className="absolute bottom-0 left-0 w-full h-1/2 blur-2xl opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 40% 100%, 
              rgba(218, 165, 32, 0.25) 0%, 
              rgba(255, 215, 0, 0.18) 25%, 
              rgba(212, 175, 55, 0.12) 50%, 
              rgba(255, 215, 0, 0.06) 75%, 
              transparent 100%
            )
          `
        }}
      />
      
      {/* Decorative light beams */}
      <div 
        className="absolute top-1/3 left-1/5 w-1/2 h-1/2 opacity-20"
        style={{
          background: `
            conic-gradient(from 30deg at 50% 50%, 
              transparent 0deg, 
              rgba(255, 215, 0, 0.4) 45deg, 
              transparent 90deg, 
              rgba(255, 215, 0, 0.3) 135deg, 
              transparent 180deg, 
              rgba(255, 215, 0, 0.2) 225deg, 
              transparent 270deg, 
              rgba(255, 215, 0, 0.15) 315deg, 
              transparent 360deg
            )
          `,
          filter: 'blur(60px)',
          transform: 'rotate(15deg)'
        }}
      />
      
      <div className="relative z-10">
        
        {/* Hero Section - Million Dollar Design */}
        <section className="relative min-h-screen flex items-center justify-center" style={{ paddingTop: '5rem' }}>
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Perfect Mobile Layout */}
            <div className="lg:hidden text-center space-y-8">
              {/* Mobile Logo - Perfectly Centered */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="flex justify-center"
              >
                <div className="relative w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/40 to-amber-500/40 rounded-full blur-2xl sm:blur-3xl" />
                  <img 
                    src="/golden-bear.png" 
                    alt="Ositos Bendecidos Golden Bear"
                    className="w-full h-full object-contain drop-shadow-2xl relative z-10" 
                  />
                </div>
              </motion.div>

              {/* Mobile Content - Perfectly Aligned */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="space-y-6"
              >
                <h1 className="text-5xl sm:text-6xl font-black leading-[0.9] tracking-tight">
                  <div className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                    Ositos
                  </div>
                  <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                    Bendecidos
                  </div>
                </h1>
                
                <p className="text-xl text-zinc-300 leading-relaxed max-w-lg mx-auto">
                  Building communities through faith, empowerment, and mutual support across America
                </p>
                
                <p className="text-lg font-serif text-yellow-400/90 italic">
                  "God's blessing is the best value—it's free"
                </p>
              </motion.div>

              {/* Mobile Buttons - Perfect Alignment */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="space-y-4 max-w-sm mx-auto"
              >
                <Button
                  size="xl"
                  variant="gold"
                  onClick={handleJoinCommunity}
                  className="w-full font-bold text-lg py-4 shadow-2xl shadow-yellow-500/30 rounded-2xl"
                >
                  Join Our Community
                </Button>
                <Button 
                  size="xl" 
                  variant="glass"
                  onClick={() => navigate('/prayers')}
                  className="w-full font-semibold text-lg py-4 rounded-2xl"
                >
                  Share a Prayer
                </Button>
              </motion.div>
            </div>

            {/* Desktop Layout - Perfect Grid */}
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-20 lg:items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="space-y-8"
              >
                <h1 className="text-7xl xl:text-8xl font-black leading-[0.9] tracking-tight">
                  <div className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                    Ositos
                  </div>
                  <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                    Bendecidos
                  </div>
                </h1>
                
                <p className="text-2xl text-zinc-300 leading-relaxed max-w-xl">
                  Building communities through faith, empowerment, and mutual support across America
                </p>
                
                <p className="text-xl font-serif text-yellow-400/90 italic">
                  "God's blessing is the best value—it's free"
                </p>

                <div className="flex gap-6">
                  <Button
                    size="xl"
                    variant="gold"
                    onClick={handleJoinCommunity}
                    className="font-bold text-lg px-8 py-4 shadow-2xl shadow-yellow-500/30 rounded-2xl"
                  >
                    Join Our Community
                  </Button>
                  <Button 
                    size="xl" 
                    variant="glass"
                    onClick={() => navigate('/prayers')}
                    className="font-semibold text-lg px-8 py-4 rounded-2xl"
                  >
                    Share a Prayer
                  </Button>
                </div>
              </motion.div>

              {/* Right Logo - ОГРОМНЫЙ МЕДВЕДЬ НА ДЕСКТОПЕ! */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="flex justify-center"
              >
                <div className="relative w-full max-w-[300px] md:max-w-[400px] lg:max-w-[500px] h-[300px] md:h-[400px] lg:h-[500px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/50 to-amber-500/50 rounded-full blur-[30px] md:blur-[35px] lg:blur-[40px] scale-110" />
                  <div className="absolute inset-2 bg-gradient-to-br from-yellow-400/30 to-amber-600/30 rounded-full blur-lg md:blur-xl lg:blur-2xl" />
                  <img 
                    src="/golden-bear.png" 
                    alt="Ositos Bendecidos Golden Bear"
                    className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(249,209,58,0.8)] md:drop-shadow-[0_0_35px_rgba(249,209,58,0.8)] lg:drop-shadow-[0_0_40px_rgba(249,209,58,0.8)] relative z-10" 
                  />
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* Feature Cards Section - Premium Layout */}
        <section className="py-16 sm:py-24 lg:py-32 relative px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
              How We Serve
            </h2>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Three pillars of our community-focused mission to create lasting positive impact
            </p>
          </motion.div>

          <div className="w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              title: 'Prayer Support',
              description: 'Share your prayers with our loving community. Real people, real faith, real support.',
              action: 'Join Prayer Board',
              route: '/prayers',
              icon: () => <ModernIcon name="prayer" size={32} color="#f9d13a" />
            },
            {
              title: 'Community Aid', 
              description: 'Get help when you need it most. We believe in lifting each other up through faith.',
              action: 'Request Help',
              route: '/community',
              icon: () => <ModernIcon name="community" size={32} color="#f9d13a" />
            },
            {
              title: 'Investment in People',
              description: 'Create lasting change by investing in sustainable community projects.',
              action: 'See Opportunities', 
              route: '/invest',
              icon: () => <ModernIcon name="investment" size={32} color="#f9d13a" />
            }
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="h-full group"
            >
              <Card className="h-full flex flex-col p-4 sm:p-6 lg:p-8 relative overflow-hidden border-zinc-800/50 hover:border-yellow-500/30 transition-all duration-500">
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                
                <CardHeader className="text-center relative z-10 pb-8">
                  {/* Premium Icon Design */}
                  <div className="w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 mx-auto mb-4 sm:mb-6 lg:mb-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-amber-500/10 rounded-2xl sm:rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500" />
                    <div className="relative w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-zinc-700 group-hover:border-yellow-500/30 transition-all duration-500 shadow-xl">
                      <card.icon />
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-black mb-3 sm:mb-4 bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-grow relative z-10">
                  <CardDescription className="text-center text-zinc-300 text-base sm:text-lg leading-relaxed px-2 sm:px-0">
                    {card.description}
                  </CardDescription>
                </CardContent>
                
                <CardFooter className="pt-4 sm:pt-6 lg:pt-8 relative z-10">
                  <Button
                    variant="gold"
                    size="default"
                    onClick={() => navigate(card.route)}
                    className="w-full font-bold text-sm sm:text-base py-3 shadow-xl shadow-yellow-500/20 group-hover:shadow-yellow-500/30 transition-all duration-500 min-h-[44px]"
                  >
                    {card.action}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
            </div>
          </div>
        </section>

        {/* Mission Statement - Million Dollar Section */}
        <section className="py-20 sm:py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Perfect Mobile Mission Card */}
              <div className="lg:hidden">
                <Card className="p-8 sm:p-12 text-center relative overflow-hidden border-zinc-800/30 bg-gradient-to-br from-zinc-900/60 to-black/80 backdrop-blur-2xl mx-auto max-w-lg">
                  <div className="relative z-10 space-y-8">
                    <h2 className="text-4xl sm:text-5xl font-black leading-tight bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                      Our Mission
                    </h2>
                    
                    <p className="text-lg sm:text-xl text-zinc-200 leading-relaxed">
                      Building communities through faith, empowerment, and mutual support. 
                      We connect hearts across America, investing in people through prayer, 
                      needs fulfillment, and{' '}
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent font-semibold">
                        sustainable growth opportunities
                      </span>.
                    </p>
                    
                    <Button
                      variant="gold"
                      size="xl"
                      onClick={() => navigate('/testimonials')}
                      className="w-full py-4 text-lg font-bold shadow-2xl shadow-yellow-500/30 rounded-2xl"
                    >
                      Learn Our Story
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Perfect Desktop Mission Card */}
              <div className="hidden lg:block">
                <Card className="p-20 text-center relative overflow-hidden border-zinc-800/20 bg-gradient-to-br from-zinc-900/40 to-black/60 backdrop-blur-3xl">
                  {/* Background Elements */}
                  <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-yellow-500/15 to-amber-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-amber-500/15 to-yellow-500/10 rounded-full blur-3xl" />
                  
                  <div className="relative z-10 space-y-12 max-w-6xl mx-auto">
                    <h2 className="text-7xl font-black leading-tight bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
                      Our Mission
                    </h2>
                    
                    <p className="text-3xl text-zinc-200 leading-relaxed font-light">
                      Building communities through faith, empowerment, and mutual support. 
                      We connect hearts across America, investing in people through prayer, 
                      needs fulfillment, and{' '}
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent font-semibold">
                        sustainable growth opportunities
                      </span>.
                    </p>
                    
                    <Button
                      variant="gold"
                      size="xl"
                      onClick={() => navigate('/testimonials')}
                      className="px-20 py-6 text-xl font-bold shadow-2xl shadow-yellow-500/40 hover:shadow-yellow-500/60 transition-all duration-500 rounded-2xl"
                    >
                      Learn Our Story
                    </Button>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

      </div>

      {/* Auth Modal */}
      <AuthModals
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default Home;