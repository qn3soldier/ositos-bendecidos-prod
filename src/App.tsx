import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Layout Components
import Header from './components/global/Header';
import Footer from './components/global/Footer';

// Pages
import Home from './components/pages/Home';
import PrayerBoard from './components/pages/PrayerBoard';
import Shop from './components/pages/Shop';
import Community from './components/pages/Community';
import Investment from './components/pages/Investment';
import Testimonials from './components/pages/Testimonials';
import Donate from './components/pages/Donate';
import AdminPanel from './components/pages/Admin';
import AdminDashboard from './components/pages/Admin/AdminDashboard';
import AdminLogin from './components/pages/Admin/AdminLogin';
import ProductsManager from './components/pages/Admin/ProductsManager';
import DatabaseManager from './components/pages/Admin/DatabaseManager';
import IconDemo from './components/pages/IconDemo';
import Cart from './components/pages/Cart';
import Checkout from './components/pages/Checkout';
import OrderSuccess from './components/pages/OrderSuccess';
import Privacy from './components/pages/Privacy';
import DonationSuccess from './components/pages/DonationSuccess';

const AppContent: React.FC = () => {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    // Простая реализация поиска - переход на Prayer Board
    if (query.toLowerCase().includes('prayer') || query.toLowerCase().includes('молитва')) {
      navigate('/prayers');
    } else if (query.toLowerCase().includes('shop') || query.toLowerCase().includes('магазин')) {
      navigate('/shop');
    } else if (query.toLowerCase().includes('community') || query.toLowerCase().includes('сообщество')) {
      navigate('/community');
    } else {
      // По умолчанию идем на главную
      navigate('/');
    }
  };



  const handleDonate = () => {
    navigate('/donate');
  };

  const handleSubscribe = (email: string) => {
    // Простая реализация подписки
    if (email.trim()) {
      alert(`Thank you for subscribing with email: ${email}. You'll receive our community updates!`);
    }
  };

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
              <Header
          onSearch={handleSearch}
          onDonate={handleDonate}
        />

        {/* Main Content */}
        <main className="pt-24 pb-24 relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/prayers" element={<PrayerBoard />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/community" element={<Community />} />
              <Route path="/invest" element={<Investment />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/admin-old" element={<AdminPanel />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<ProductsManager />} />
              <Route path="/admin/database" element={<DatabaseManager />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/icons" element={<IconDemo />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/donation-success" element={<DonationSuccess />} />
              
              {/* Fallback route */}
              <Route path="*" element={
                <div className="container text-center py-20">
                  <div className="max-w-md mx-auto">
                    <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                    <p className="text-gray-300 mb-8">Page not found</p>
                    <motion.a
                      href="/"
                      className="inline-block px-6 py-3 bg-gradient-to-r from-gold-primary to-gold-neon text-black rounded-full font-medium hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Go Home
                    </motion.a>
                  </div>
                </div>
              } />
            </Routes>
          </motion.div>
        </main>

        <Footer onSubscribe={handleSubscribe} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppContent />
    </Router>
  );
};

export default App;