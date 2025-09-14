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

import Logo from '../../shared/Logo';
import GradientButton from '../../shared/GradientButton';
import AuthModals from '../AuthModals';
import { useAuth } from '../../../contexts/AuthContext';

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
      className="fixed top-0 left-0 right-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10"
    >
      <nav className="container">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <Logo src="/golden-bear.png" size="md" showHalo />
              <div className="hidden sm:block">
                <h1 className="font-serif text-xl font-semibold bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(249,209,58,0.35)] cursor-pointer">
                  Ositos Bendecidos
                </h1>
                <p className="text-xs text-gray-400 cursor-pointer">Building Community Through Faith</p>
              </div>
            </motion.div>
          </Link>

          {/* Center: Navigation (Desktop) */}
          <div className="hidden lg:flex space-x-2 p-1 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <motion.div key={item.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to={item.href}
                    className={`
                      block px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg
                      ${isActive
                        ? 'text-yellow-300 bg-yellow-300/10 shadow-sm border border-yellow-300/20'
                        : 'text-gray-300 hover:text-yellow-300 hover:bg-yellow-300/10'
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-48 pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20 transition-all duration-300"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </form>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <GradientButton
                size="sm"
                variant="outline"
                onClick={onDonate}
                className="hidden sm:flex items-center"
              >
                <HeartIcon className="w-4 h-4 mr-2" />
                Donate
              </GradientButton>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold-primary to-gold-neon flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.firstName} className="w-8 h-8 rounded-full" />
                      ) : (
                        <span className="text-sm font-bold text-black">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="hidden lg:block text-sm text-white">
                      {user.firstName} {user.lastName}
                    </span>
                  </button>

                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl z-50"
                      >
                        <div className="p-3 border-b border-white/10">
                          <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                          {user.role === 'admin' && (
                            <span className="inline-block mt-1 px-2 py-1 bg-gold-primary/20 text-gold-primary text-xs rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              // Navigate to profile page when implemented
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Cog6ToothIcon className="w-4 h-4" />
                            <span>Profile Settings</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLogin}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                  <GradientButton
                    size="sm"
                    variant="gradient"
                    onClick={handleRegister}
                    className="flex items-center"
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Sign Up
                  </GradientButton>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
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
                  <GradientButton
                    size="sm"
                    variant="outline"
                    onClick={onDonate}
                    className="w-full flex items-center justify-center"
                  >
                    <HeartIcon className="w-4 h-4 mr-2" />
                    Donate
                  </GradientButton>
                  
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
                    <div className="space-y-2">
                      <button
                        onClick={handleLogin}
                        className="w-full py-2 text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        Sign In
                      </button>
                      <GradientButton
                        size="sm"
                        variant="gradient"
                        onClick={handleRegister}
                        className="w-full flex items-center justify-center"
                      >
                        <UserIcon className="w-4 h-4 mr-2" />
                        Sign Up
                      </GradientButton>
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
