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
    totalUsers: 247,
    totalPrayers: 1893,
    totalDonations: 45600,
    totalProducts: 8,
    totalRevenue: 128500,
    activeRequests: 12,
    testimonialCount: 34,
    investmentTotal: 250000
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
    { name: 'Dashboard', path: '/admin/dashboard', icon: ChartBarIcon, active: true },
    { name: 'Users', path: '/admin/users', icon: UsersIcon },
    { name: 'Prayers', path: '/admin/prayers', icon: HeartIcon },
    { name: 'Products', path: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Donations', path: '/admin/donations', icon: CurrencyDollarIcon },
    { name: 'Community', path: '/admin/community', icon: ChatBubbleLeftIcon },
    { name: 'Settings', path: '/admin/settings', icon: Cog6ToothIcon }
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
              Admin Panel
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
                  Dashboard Overview
                </h1>
                <p className="text-zinc-400 mt-1">Welcome back to admin panel</p>
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

          {/* Stats Grid */}
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-zinc-800/50 hover:border-yellow-500/30 transition-all duration-500 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                            <stat.icon className="w-6 h-6 text-black" />
                          </div>
                          <span className="text-green-400 text-sm font-semibold">
                            {stat.change}
                          </span>
                        </div>
                        <h3 className="text-zinc-400 text-sm mb-1">{stat.title}</h3>
                        <p className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                          {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Recent Activity Section */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Prayers */}
              <Card className="border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-xl font-black bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                    Recent Prayers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full flex items-center justify-center">
                          <HeartIcon className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-zinc-300 text-sm">Prayer Request #{i}</p>
                          <p className="text-xs text-zinc-500">2 minutes ago</p>
                        </div>
                      </div>
                      <button className="text-yellow-400 text-sm hover:underline">
                        View
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Donations */}
              <Card className="border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-xl font-black bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                    Recent Donations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full flex items-center justify-center">
                          <CurrencyDollarIcon className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-zinc-300 text-sm">$100 Donation</p>
                          <p className="text-xs text-zinc-500">5 minutes ago</p>
                        </div>
                      </div>
                      <span className="text-green-400 text-sm font-semibold">
                        Completed
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-8 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-xl font-black bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="glass"
                    className="font-semibold"
                    onClick={() => navigate('/admin/products')}
                  >
                    Add Product
                  </Button>
                  <Button variant="glass" className="font-semibold">
                    View Reports
                  </Button>
                  <Button variant="glass" className="font-semibold">
                    Send Newsletter
                  </Button>
                  <Button variant="glass" className="font-semibold">
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;