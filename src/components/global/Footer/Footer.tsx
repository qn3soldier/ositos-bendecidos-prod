import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  EnvelopeIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

import GradientButton from '../../shared/GradientButton';
import GlassCard from '../../shared/GlassCard';

interface FooterProps {
  onSubscribe?: (email: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onSubscribe }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && onSubscribe) {
      onSubscribe(email.trim());
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const navigationLinks = [
    { label: 'Home', href: '/' },
    { label: 'Prayer Board', href: '/prayers' },
    { label: 'Community Shop', href: '/shop' },
    { label: 'Community Help', href: '/community' },
    { label: 'Invest & Build', href: '/invest' },
    { label: 'Stories', href: '/testimonials' },
  ];

  const supportLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'How it Works', href: '/how-it-works' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Admin Portal', href: '/admin' },
  ];

  const socialLinks = [
    { 
      label: 'Instagram', 
      href: '#', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348zm7.718 0c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348z"/>
        </svg>
      )
    },
    { 
      label: 'Twitter', 
      href: '#', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    { 
      label: 'Facebook', 
      href: '#', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
  ];

  return (
    <motion.footer 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      viewport={{ once: true }}
      className="relative mt-20 glass-card border-0 border-t border-white/20"
    >
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img src="/golden-bear.png" alt="Ositos Bendecidos" className="w-12 h-12 object-contain" />
              <div>
                 <h3 className="font-serif text-lg font-semibold bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent drop-shadow-glow">
                  Ositos Bendecidos
                </h3>
                <p className="text-xs text-gray-600">Little Blessed Bears</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Building communities through faith, empowerment, and mutual support. 
              Connecting hearts across America, one prayer at a time.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <MapPinIcon className="w-4 h-4 text-gold-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p>9121 SUNRISE LAKES BLVD UNIT 119</p>
                  <p>SUNRISE, FL 33322</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <PhoneIcon className="w-4 h-4 text-gold-primary" />
                <span>(703)203-1362</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <EnvelopeIcon className="w-4 h-4 text-gold-primary" />
                <span>info@ositosbendecidos.com</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Navigate</h4>
            <ul className="space-y-2">
              {navigationLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-600 hover:text-gold-primary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-600 hover:text-gold-primary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Stay Connected</h4>
            <p className="text-sm text-gray-600 mb-4">
              Get weekly blessings, community updates, and prayer requests.
            </p>
            
            <GlassCard padding="sm" className="mb-4">
              {isSubscribed ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center p-2"
                >
                  <HeartIcon className="w-8 h-8 text-green-hope mx-auto mb-2" />
                  <p className="text-sm text-green-hope font-medium">
                    Thank you! You're now part of our blessed community.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubscribe}>
                  <div className="flex flex-col space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="px-3 py-2 bg-white/50 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-primary/50 placeholder-gray-500"
                      required
                    />
                    <GradientButton
                      type="submit"
                      size="sm"
                      variant="gradient"
                      className="w-full"
                    >
                      Subscribe
                    </GradientButton>
                  </div>
                </form>
              )}
            </GlassCard>

            {/* Social Links */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Follow Us</p>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    className="p-2 text-gray-600 hover:text-gold-primary transition-colors duration-300 rounded-full hover:bg-gold-primary/10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">
                © 2025 Ositos Bendecidos. Made with{' '}
                <HeartIcon className="inline w-4 h-4 text-red-500 mx-1" />
                for community building.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                "God's blessing is the best value—it's free"
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">Blessed & Built in USA</span>
              <div className="w-6 h-4 bg-gradient-to-r from-red-500 via-white to-gray-500 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-gold-primary/10 to-gold-neon/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-gold-neon/10 to-gold-primary/10 rounded-full blur-2xl"></div>
      </div>
    </motion.footer>
  );
};

export default Footer;