import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ChartBarIcon,
  UsersIcon,
  ShoppingBagIcon,
  HeartIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { Card, CardContent } from '../../ui/Card';
import { supabase } from '../../../services/supabase';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  status: 'active' | 'inactive';
  image_url: string;
}

const ProductsManager: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    status: 'active',
    image_url: ''
  });

  const categories = ['Clothing', 'Accessories', 'Home Decor', 'Books', 'Jewelry', 'Other'];

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: ChartBarIcon },
    { name: 'Users', path: '/admin/users', icon: UsersIcon },
    { name: 'Prayers', path: '/admin/prayers', icon: HeartIcon },
    { name: 'Products', path: '/admin/products', icon: ShoppingBagIcon, active: true },
    { name: 'Donations', path: '/admin/donations', icon: CurrencyDollarIcon },
    { name: 'Community', path: '/admin/community', icon: ChatBubbleLeftIcon },
    { name: 'Settings', path: '/admin/settings', icon: Cog6ToothIcon }
  ];

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchProducts();
  }, [user, navigate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/.netlify/functions/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('accessToken');
      const method = editingProduct ? 'PATCH' : 'POST';
      const url = editingProduct
        ? `/.netlify/functions/products/${editingProduct.id}`
        : '/.netlify/functions/products';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          stock: parseInt(formData.stock),
          status: formData.status,
          image_url: formData.image_url
        })
      });

      if (response.ok) {
        setSuccessMessage(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowForm(false);
        setEditingProduct(null);
        resetForm();
        fetchProducts();
      } else {
        throw new Error('Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/.netlify/functions/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccessMessage('Product deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      status: product.status,
      image_url: product.image_url
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      status: 'active',
      image_url: ''
    });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen relative">
      {/* Background - same as Admin Dashboard */}
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
                  Products Management
                </h1>
                <p className="text-zinc-400 mt-1">Manage your shop inventory</p>
              </div>
              <Button
                variant="gold"
                size="lg"
                onClick={() => {
                  setEditingProduct(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="font-bold shadow-2xl shadow-yellow-500/30"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-green-500/20 border border-green-500/50 backdrop-blur-sm px-6 py-3 rounded-lg flex items-center space-x-2"
        >
          <CheckCircleIcon className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-semibold">{successMessage}</span>
        </motion.div>
      )}

          {/* Main Content */}
          <div className="p-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-zinc-800/50 hover:border-yellow-500/30 transition-all duration-300 overflow-hidden group">
                  <div className="relative h-48 bg-zinc-900">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="w-16 h-16 text-zinc-700" />
                      </div>
                    )}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      product.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {product.status}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-white mb-1">{product.name}</h3>
                    <p className="text-sm text-zinc-400 mb-2">{product.category}</p>
                    <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-yellow-400">${product.price}</span>
                      <span className="text-sm text-zinc-500">Stock: {product.stock}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="flex-1"
                      >
                        <PencilSquareIcon className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 hover:bg-red-500/20 hover:text-red-400"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Price ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Product Image</label>
                <div className="space-y-3">
                  {formData.image_url && (
                    <div className="relative h-48 bg-zinc-800 rounded-lg overflow-hidden">
                      <img
                        src={formData.image_url}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <div className="flex items-center justify-center px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
                        {uploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-400 mr-2"></div>
                            <span className="text-zinc-400">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <PhotoIcon className="w-5 h-5 text-zinc-400 mr-2" />
                            <span className="text-zinc-400">Upload Image</span>
                          </>
                        )}
                      </div>
                    </label>
                    {formData.image_url && (
                      <Button
                        type="button"
                        variant="glass"
                        size="sm"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="flex-1 font-bold"
                  disabled={uploadingImage}
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
                <Button
                  type="button"
                  variant="glass"
                  size="lg"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ProductsManager;