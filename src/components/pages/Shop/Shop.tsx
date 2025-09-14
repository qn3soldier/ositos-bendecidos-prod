import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, StarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../shared/GlassCard';
import GradientButton from '../../shared/GradientButton';
import { useCart } from '../../../contexts/CartContext';
import { getProducts, getProductCategories, type Product } from '../../../services/api';

// Transform API product to component product interface
interface ComponentProduct extends Omit<Product, 'image_url' | 'in_stock'> {
  image: string;
  inStock: boolean;
}

const Shop: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart, items: cartItems } = useCart();
  
  // Real API state
  const [products, setProducts] = useState<ComponentProduct[]>([]);
  const [categories, setCategories] = useState([
    { value: 'all', label: 'All Products' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'books', label: 'Books & Study' },
    { value: 'care', label: 'Care Packages' }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform API product to component product
  const transformProduct = (apiProduct: Product): ComponentProduct => ({
    ...apiProduct,
    image: apiProduct.image_url,
    inStock: apiProduct.in_stock
  });

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await getProducts({
          category: filter !== 'all' ? filter : undefined,
          search: searchQuery || undefined
        });
        
        const transformedProducts = response.products.map(transformProduct);
        setProducts(transformedProducts);
        setError(null);
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [filter, searchQuery]);

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getProductCategories();
        
        const apiCategories = response.categories.map(cat => ({
          value: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1)
        }));
        
        setCategories([
          { value: 'all', label: 'All Products' },
          ...apiCategories
        ]);
      } catch (err) {
        console.error('Failed to load categories:', err);
        // Keep default categories if API fails
      }
    };

    loadCategories();
  }, []);

  // Products are already filtered by API, no need for client-side filtering
  const filteredProducts = products;



  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="absolute inset-0" style={{background: 'linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)'}}></div>
      
      <div className="container relative py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <img src="/golden-bear.png" alt="Ositos Bendecidos" className="w-20 h-20 object-contain" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
              Bendecidos Gear
            </h1>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Support our community while representing your faith
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Search */}
            <GlassCard padding="md" className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </GlassCard>

            {/* Categories */}
            <GlassCard padding="md" className="mb-6">
              <h3 className="font-semibold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setFilter(category.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 ${
                      filter === category.value
                        ? 'bg-gold-primary/20 text-gold-primary border border-gold-primary/30'
                        : 'text-gray-300 hover:bg-white/5 hover:text-gold-primary'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Cart Summary */}
            <GlassCard padding="md">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <ShoppingCartIcon className="w-5 h-5 mr-2" />
                Cart ({cartItems.length} items)
              </h3>
              {cartItems.length > 0 ? (
                <div>
                  <div className="space-y-2 mb-4">
                    {cartItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300 truncate">{item.name}</span>
                        <span className="text-gold-primary">{item.quantity}x</span>
                      </div>
                    ))}
                    {cartItems.length > 3 && (
                      <p className="text-xs text-gray-400">+{cartItems.length - 3} more items</p>
                    )}
                  </div>
                  <div className="border-t border-gray-700 pt-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Total:</span>
                      <span className="text-lg font-bold text-gold-primary">
                        ${cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Link to="/cart">
                    <GradientButton size="sm" variant="gradient" className="w-full">
                      View Cart
                    </GradientButton>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Your cart is empty</p>
              )}
            </GlassCard>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {error && (
              <GlassCard padding="lg" className="text-center mb-6">
                <div className="text-red-400 mb-4">⚠️ {error}</div>
                <GradientButton 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </GradientButton>
              </GlassCard>
            )}
            
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-primary mx-auto mb-4"></div>
                <p className="text-gray-400">Loading products...</p>
              </div>
            )}
            
            {!loading && !error && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <GlassCard padding="md" hover className="h-full">
                        <div className="relative mb-4">
                          <div className="aspect-square bg-gradient-to-br from-gold-primary/20 to-gold-neon/10 rounded-lg flex items-center justify-center p-4" style={{backgroundImage: 'linear-gradient(to bottom right, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.15) 20%, rgba(255,215,0,0.1) 40%, rgba(255,215,0,0.08) 60%, rgba(255,215,0,0.05) 80%, rgba(255,215,0,0.02) 100%)'}}>
                            <img src="/golden-bear.png" alt={product.name} className="w-full h-full object-contain" />
                          </div>
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                              <span className="text-white font-medium">Out of Stock</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col">
                          <h3 className="font-semibold text-white mb-2">{product.name}</h3>
                          <p className="text-sm text-gray-300 mb-3 flex-1">{product.description}</p>
                          
                          <div className="flex items-center mb-3">
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(product.rating)
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-400'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-400 ml-2">
                              ({product.rating})
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-gold-primary">
                              ${product.price}
                            </span>
                            <GradientButton
                              size="sm"
                              variant={product.inStock ? "gradient" : "outline"}
                              disabled={!product.inStock}
                              onClick={() => product.inStock && addToCart({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                                category: product.category
                              })}
                            >
                              {!product.inStock 
                                ? 'Out of Stock'
                                : cartItems.find(item => item.id === product.id)
                                ? `In Cart (${cartItems.find(item => item.id === product.id)?.quantity})`
                                : 'Add to Cart'
                              }
                            </GradientButton>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>

                {filteredProducts.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <img src="/golden-bear.png" alt="No products" className="w-20 h-20 mx-auto mb-4 opacity-50 object-contain" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">
                      No products found
                    </h3>
                    <p className="text-gray-500">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Featured Section */}
        <section className="mt-16">
          <GlassCard padding="lg">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-semibold mb-4 bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
                Every Purchase Makes a Difference
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-6">
                100% of profits from our shop go directly to supporting community members in need. 
                When you purchase Bendecidos gear, you're investing in real people and real change.
              </p>
              <div className="text-center mt-8">
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Every purchase directly supports our community mission. 
                  Proceeds help fund community programs and support families in need.
                </p>
              </div>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
};

export default Shop;
