import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  MinusIcon, 
  TrashIcon, 
  ShoppingBagIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import GlassCard from '../../shared/GlassCard';
import GradientButton from '../../shared/GradientButton';
import { useCart } from '../../../contexts/CartContext';
const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0" style={{background: 'linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)'}}></div>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="mb-8">
              <ShoppingBagIcon className="w-24 h-24 text-gold-primary mx-auto mb-6 opacity-50" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent mb-4">
                Your Cart is Empty
              </h1>
              <p className="text-gray-300 text-lg mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
            </div>
            
            <div className="space-y-4">
              <Link to="/shop">
                <GradientButton size="lg" variant="gradient" className="w-full sm:w-auto">
                  Continue Shopping
                </GradientButton>
              </Link>
              <div>
                <Link 
                  to="/" 
                  className="inline-flex items-center text-gold-primary hover:text-gold-neon transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0" style={{background: 'linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)'}}></div>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
              Shopping Cart
            </h1>
            <Link 
              to="/shop" 
              className="inline-flex items-center text-gold-primary hover:text-gold-neon transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard padding="lg">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gradient-to-br from-gold-primary/20 to-gold-neon/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-contain p-2"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1 truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          {item.category}
                        </p>
                        <p className="text-lg font-bold text-gold-primary">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gold-primary/20 hover:bg-gold-primary/30 flex items-center justify-center transition-colors"
                        >
                          <MinusIcon className="w-4 h-4 text-gold-primary" />
                        </button>
                        
                        <span className="w-8 text-center text-white font-medium">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gold-primary/20 hover:bg-gold-primary/30 flex items-center justify-center transition-colors"
                        >
                          <PlusIcon className="w-4 h-4 text-gold-primary" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gold-primary">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="mt-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}

              {/* Clear Cart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: items.length * 0.1 + 0.2 }}
                className="pt-4"
              >
                <button
                  onClick={clearCart}
                  className="text-red-400 hover:text-red-300 transition-colors text-sm"
                >
                  Clear entire cart
                </button>
              </motion.div>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-1"
            >
              <GlassCard padding="lg" className="sticky top-24">
                <h2 className="text-2xl font-semibold text-white mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Items ({totalItems}):</span>
                    <span className="text-white">${totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Shipping:</span>
                    <span className="text-green-400">Free</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Tax:</span>
                    <span className="text-white">${(totalPrice * 0.08).toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold text-white">Total:</span>
                      <span className="text-2xl font-bold text-gold-primary">
                        ${(totalPrice + (totalPrice * 0.08)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <GradientButton 
                    size="lg" 
                    variant="gradient" 
                    className="w-full"
                    onClick={() => navigate('/checkout')}
                  >
                    Proceed to Checkout
                  </GradientButton>
                  
                  <p className="text-xs text-gray-400 text-center">
                    Secure checkout powered by Stripe
                  </p>
                </div>

                {/* Support Info */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h3 className="text-sm font-semibold text-gold-primary mb-3">
                    🤝 Community Support
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Every purchase helps support our community programs and brings 
                    hope to families in need. Thank you for being part of our mission!
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Cart;
