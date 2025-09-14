import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  HeartIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// import Logo from '../../shared/Logo';
import GradientButton from '../../shared/GradientButton';
import { Button } from '../../ui/Button';
import AuthModals from '../AuthModals';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { CartIcon } from '../../shared/CustomIcons';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onDonate?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  onDonate,
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigationItems = [
    { label: 'Home', href: '/' },
    { label: 'Prayer Board', href: '/prayers' },
    { label: 'Shop', href: '/shop' },
    { label: 'Community Help', href: '/community' },
    { label: 'Invest & Build', href: '/invest' },
    { label: 'Stories', href: '/testimonials' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl"
      style={{
        background: `
          linear-gradient(180deg, 
            rgba(0, 0, 0, 0.95) 0%, 
            rgba(10, 10, 10, 0.90) 50%, 
            rgba(0, 0, 0, 0.85) 100%
          )
        `,
        borderBottom: '2px solid rgba(255, 215, 0, 0.3)',
        boxShadow: `
          0 0 20px rgba(255, 215, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `
      }}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-32 relative">
          
          {/* Left: New Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img 
              src="/ositos-logo-new.PNG" 
              alt="Ositos Bendecidos" 
              className="h-16 sm:h-32 w-auto object-contain"
            />
          </Link>

          {/* Center: Navigation (Desktop) */}
          <div className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => {
              const base = 'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300';
              const state = 'text-gray-300 hover:text-gold-primary hover:bg-gold-primary/10 hover:shadow-[0_0_24px_rgba(249,209,58,0.15)]';
              return (
                <Link key={item.label} to={item.href} className={`${base} ${state}`}>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Cart */}
            <Link 
              to="/cart" 
              className="relative p-2 rounded-xl transition-all duration-200 bg-white/5 hover:bg-gold-primary/10 border border-white/10"
            >
              <CartIcon 
                size="md" 
                itemCount={totalItems}
                className="text-gold-primary hover:text-gold-neon transition-colors" 
              />
            </Link>

            {/* User Actions */}
            <GradientButton
              size="sm"
              variant="outline"
              onClick={onDonate}
              className="hidden sm:flex items-center justify-center h-10"
            >
              Donate
            </GradientButton>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-10 flex items-center space-x-2 px-3 rounded-lg hover:bg-gold-primary/10 transition-all duration-200 border border-transparent hover:border-gold-primary/30"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold-primary to-gold-neon flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-black">
                      {user.firstName?.charAt(0) || 'U'}{user.lastName?.charAt(0) || ''}
                    </span>
                  </div>
                  <span className="hidden lg:block text-sm text-gold-primary font-medium">
                    {user.firstName}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 top-12 w-56 bg-black border-2 border-gold-primary/30 rounded-xl shadow-2xl z-[9999]"
                      style={{ 
                        background: 'linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 100%)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 215, 0, 0.2)'
                      }}
                    >
                      <div className="p-4 border-b border-gold-primary/20">
                        <p className="text-sm font-semibold text-gold-primary">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="inline-block mt-2 px-2 py-1 bg-gold-primary text-black text-xs rounded-full font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-gray-300 hover:text-gold-primary hover:bg-gold-primary/10 rounded-lg transition-all duration-200"
                        >
                          <Cog6ToothIcon className="w-4 h-4" />
                          <span>Profile Settings</span>
                        </button>
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-gray-300 hover:text-gold-primary hover:bg-gold-primary/10 rounded-lg transition-all duration-200"
                          >
                            <Cog6ToothIcon className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-gray-300 hover:text-gold-primary hover:bg-gold-primary/10 rounded-lg transition-all duration-200"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleLogin}
                  className="h-10 px-6 flex items-center justify-center text-sm font-medium text-gray-300 hover:text-gold-primary transition-all duration-200 border-2 border-gray-700 hover:border-gold-primary/60 rounded-lg bg-black/60 hover:bg-gold-primary/10"
                >
                  Sign In
                </button>
                <GradientButton
                  size="sm"
                  variant="gold"
                  onClick={handleRegister}
                  className="h-10"
                >
                  Sign Up
                </GradientButton>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-gold-primary transition-colors"
            >
              {isMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-black/60 backdrop-blur-xl border-t border-white/10 rounded-b-2xl mt-2"
            >
              <div className="p-4 space-y-4">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="md:hidden">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </form>

                {/* Mobile Navigation */}
                <div className="flex flex-col space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <motion.div key={item.label} whileTap={{ scale: 0.98 }}>
                        <Link
                          to={item.href}
                          className={`
                            block px-3 py-2 text-sm font-medium transition-colors duration-300 rounded-lg
                            ${isActive
                              ? 'text-gold-primary bg-gold-primary/10'
                              : 'text-gray-300 hover:text-gold-primary hover:bg-gold-primary/5'
                            }
                          `}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* User Actions in Mobile */}
                <div className="flex flex-col space-y-3 pt-4 border-t border-white/10">
                  <Button
                    size="lg"
                    variant="glass"
                    onClick={onDonate}
                    className="w-full h-12 rounded-2xl text-base font-semibold flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(249,209,58,0.15)]"
                  >
                    <HeartIcon className="w-5 h-5" />
                    Donate
                  </Button>
                  
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold-primary to-gold-neon flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.firstName} className="w-8 h-8 rounded-full" />
                          ) : (
                            <span className="text-sm font-bold text-black">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-white">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleLogin}
                        className="w-full h-12 rounded-2xl text-base font-medium border-gray-600 hover:border-gold-primary/60"
                      >
                        Sign In
                      </Button>
                      <Button
                        size="lg"
                        variant="gold"
                        onClick={handleRegister}
                        className="w-full h-12 rounded-2xl text-base font-semibold flex items-center justify-center gap-2"
                      >
                        <UserIcon className="w-5 h-5" />
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Auth Modals */}
      <AuthModals
        isOpen={showAuthModal}
        mode={authMode}
        onClose={() => setShowAuthModal(false)}
        onSwitchMode={switchAuthMode}
      />
    </motion.header>
  );
};

export default Header;