import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  PhotoIcon,
  ShoppingBagIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../shared/GlassCard';
import GradientButton from '../../shared/GradientButton';
import { useAuth } from '../../../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  inStock: boolean;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'analytics' | 'investments' | 'settings'>('products');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Blessed Bear T-Shirt',
      price: 29.99,
      image: '/golden-bear.png',
      description: 'Comfortable 100% cotton t-shirt featuring our beloved Ositos Bendecidos bear design',
      category: 'clothing',
      inStock: true
    },
    {
      id: '2',
      name: 'Faith & Hope Coffee Mug',
      price: 19.99,
      image: '/golden-bear.png',
      description: 'Ceramic mug with "God\'s blessing is the best value—it\'s free" quote',
      category: 'accessories',
      inStock: true
    }
  ]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    description: '',
    category: 'clothing',
    image: ''
  });

  // Защита: только админы могут видеть админ панель
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard padding="lg" className="text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Access Denied</h2>
          <p className="text-gray-300">
            You need admin privileges to access this page.
          </p>
        </GlassCard>
      </div>
    );
  }

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;

    const product: Product = {
      id: String(products.length + 1),
      name: newProduct.name,
      price: newProduct.price,
      image: newProduct.image || '/golden-bear.png',
      description: newProduct.description,
      category: newProduct.category,
      inStock: true
    };

    setProducts([...products, product]);
    setNewProduct({ name: '', price: 0, description: '', category: 'clothing', image: '' });
    setShowAddProductModal(false);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // В реальном приложении здесь была бы загрузка на сервер
      const imageUrl = URL.createObjectURL(file);
      setNewProduct(prev => ({ ...prev, image: imageUrl }));
    }
  };

  const tabs = [
    { id: 'products', label: 'Products', icon: ShoppingBagIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'investments', label: 'Investments', icon: BuildingOfficeIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
  ] as const;

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/5 to-gold-neon/5"></div>
      
      <div className="container relative py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <img src="/golden-bear.png" alt="Ositos Bendecidos" className="w-20 h-20 object-contain" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Manage your community platform
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 p-1 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gold-primary/20 text-gold-primary border border-gold-primary/30'
                    : 'text-gray-300 hover:text-gold-primary hover:bg-gold-primary/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            {/* Add Product Button */}
            <div className="flex justify-end">
              <GradientButton
                size="md"
                variant="gradient"
                onClick={() => setShowAddProductModal(true)}
                className="inline-flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Product
              </GradientButton>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <GlassCard padding="md" hover className="h-full">
                    <div className="relative mb-4">
                      <div className="aspect-square bg-gradient-to-br from-gold-primary/20 to-gold-neon/20 rounded-lg flex items-center justify-center p-4">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/golden-bear.png';
                          }}
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button 
                          className="p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                          title="Edit Product"
                        >
                          <PencilIcon className="w-4 h-4 text-white" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1 bg-red-500/60 rounded-full hover:bg-red-500/80 transition-colors"
                          title="Delete Product"
                        >
                          <TrashIcon className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-white mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gold-primary">${product.price}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.inStock 
                          ? 'bg-gold-primary/20 text-gold-primary' 
                          : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <GlassCard padding="lg">
            <h2 className="text-xl font-semibold text-white mb-4">User Management</h2>
            <p className="text-gray-300">User management features coming soon...</p>
          </GlassCard>
        )}

        {activeTab === 'analytics' && (
          <GlassCard padding="lg">
            <h2 className="text-xl font-semibold text-white mb-4">Analytics Dashboard</h2>
            <p className="text-gray-300">Analytics and reporting features coming soon...</p>
          </GlassCard>
        )}

        {activeTab === 'settings' && (
          <GlassCard padding="lg">
            <h2 className="text-xl font-semibold text-white mb-4">System Settings</h2>
            <p className="text-gray-300">System configuration options coming soon...</p>
          </GlassCard>
        )}

        {/* Add Product Modal */}
        {showAddProductModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-md"
            >
              <GlassCard padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Add New Product</h2>
                  <button
                    onClick={() => setShowAddProductModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20"
                    >
                      <option value="clothing">Clothing</option>
                      <option value="accessories">Accessories</option>
                      <option value="books">Books</option>
                      <option value="home">Home & Garden</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-primary/50 focus:ring-2 focus:ring-gold-primary/20 resize-none"
                      rows={3}
                      placeholder="Product description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Image
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                        <PhotoIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {newProduct.image && (
                        <img 
                          src={newProduct.image} 
                          alt="Preview" 
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowAddProductModal(false)}
                      className="flex-1 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <GradientButton
                      onClick={handleAddProduct}
                      size="md"
                      variant="gradient"
                      className="flex-1"
                    >
                      Add Product
                    </GradientButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
