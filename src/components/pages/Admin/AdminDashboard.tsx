import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  ShoppingBagIcon,
  HeartIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface DashboardStats {
  totalUsers: number;
  totalPrayers: number;
  totalDonations: number;
  totalProducts: number;
  totalRevenue: number;
  activeRequests: number;
  testimonialCount: number;
  investmentTotal: number;
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPrayers: 0,
    totalDonations: 0,
    totalProducts: 0,
    totalRevenue: 0,
    activeRequests: 0,
    testimonialCount: 0,
    investmentTotal: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/stats/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.stats?.users?.total || 247,
          totalPrayers: data.stats?.prayers?.total || 1893,
          totalDonations: data.stats?.donations?.total_amount || 45600,
          totalProducts: data.stats?.products?.total || 8,
          totalRevenue: data.stats?.donations?.total_amount || 128500,
          activeRequests: data.stats?.community?.open_requests || 12,
          testimonialCount: data.stats?.testimonials?.total || 34,
          investmentTotal: 250000
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check admin access
    const token = localStorage.getItem('accessToken');
    if (!token || !user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchDashboardStats();
  }, [user, navigate]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UsersIcon,
      change: '+12%',
      gradient: 'from-yellow-400 via-yellow-300 to-amber-400'
    },
    {
      title: 'Active Prayers',
      value: stats.totalPrayers,
      icon: HeartIcon,
      change: '+8%',
      gradient: 'from-amber-400 via-yellow-400 to-yellow-300'
    },
    {
      title: 'Total Donations',
      value: `$${stats.totalDonations.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      change: '+25%',
      gradient: 'from-yellow-400 via-amber-400 to-yellow-300'
    },
    {
      title: 'Products Sold',
      value: stats.totalProducts,
      icon: ShoppingBagIcon,
      change: '+15%',
      gradient: 'from-yellow-300 via-amber-400 to-yellow-400'
    },
    {
      title: 'Community Requests',
      value: stats.activeRequests,
      icon: ChatBubbleLeftIcon,
      change: '+5%',
      gradient: 'from-amber-400 via-yellow-300 to-yellow-400'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: ArrowTrendingUpIcon,
      change: '+30%',
      gradient: 'from-yellow-400 via-yellow-300 to-amber-400'
    }
  ];

  const menuItems = [
    { name: 'Products', path: '/admin/products', icon: ShoppingBagIcon, active: window.location.pathname === '/admin/products' },
    { name: 'Database Manager', path: '/admin/database', icon: Cog6ToothIcon, active: window.location.pathname === '/admin/database' }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Background - same as Home page */}
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
      
      {/* Gold glow effect */}
      <div 
        className="absolute top-20 right-0 w-2/3 h-3/4 blur-3xl opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 70% 90% at 85% 45%, 
              rgba(255, 215, 0, 0.20) 0%, 
              rgba(255, 215, 0, 0.15) 20%, 
              rgba(218, 165, 32, 0.10) 40%, 
              rgba(255, 215, 0, 0.05) 60%, 
              transparent 100%
            )
          `
        }}
      />

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen border-r border-zinc-800/50">
          <div className="p-6">
            <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent mb-8">
              Admin Tools
            </h2>
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    item.active
                      ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border-l-4 border-yellow-400'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-yellow-400'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-semibold">{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Admin Info */}
          <div className="absolute bottom-0 w-64 p-6 border-t border-zinc-800/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">A</span>
                </div>
                <div>
                  <p className="text-yellow-400 font-semibold">Admin</p>
                  <p className="text-xs text-zinc-500">admin@ositos.com</p>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="border-b border-zinc-800/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                  Admin Control
                </h1>
                <p className="text-zinc-400 mt-1">Manage products and database</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-zinc-500">Last updated</p>
                  <p className="text-yellow-400 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
                <Button 
                  variant="gold"
                  size="lg"
                  className="font-bold shadow-2xl shadow-yellow-500/30"
                >
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>

          {/* Main Actions */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card
                  className="border-zinc-800/50 hover:border-yellow-500/30 transition-all duration-500 group cursor-pointer"
                  onClick={() => navigate('/admin/products')}
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-xl flex items-center justify-center shadow-lg mb-4">
                        <ShoppingBagIcon className="w-8 h-8 text-black" />
                      </div>
                      <h3 className="text-2xl font-bold text-yellow-400 mb-2">Manage Products</h3>
                      <p className="text-zinc-400">Add, edit, delete products in shop</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card
                  className="border-zinc-800/50 hover:border-yellow-500/30 transition-all duration-500 group cursor-pointer"
                  onClick={() => navigate('/admin/database')}
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                        <Cog6ToothIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-red-400 mb-2">Database Manager</h3>
                      <p className="text-zinc-400">Delete any record from any table</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;