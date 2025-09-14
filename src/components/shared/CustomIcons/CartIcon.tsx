import React from 'react';
import { motion } from 'framer-motion';

interface CartIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
  itemCount?: number;
}

const CartIcon: React.FC<CartIconProps> = ({ 
  size = 'md', 
  className = '', 
  animate = false,
  itemCount = 0
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const IconComponent = animate ? motion.svg : 'svg';

  return (
    <div className="relative">
      <IconComponent
        className={`${sizeClasses[size]} ${className}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...(animate && {
          initial: { scale: 1 },
          whileHover: { 
            scale: 1.1,
            filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))'
          },
          transition: { duration: 0.2 }
        })}
      >
        {/* Beautiful Cart Icon */}
        <motion.path
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="text-yellow-400"
          {...(animate && {
            initial: { pathLength: 0 },
            animate: { pathLength: 1 },
            transition: { duration: 1, delay: 0.5 }
          })}
        />
        <motion.circle
          cx="9"
          cy="20"
          r="1.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="text-yellow-400"
        />
        <motion.circle
          cx="17"
          cy="20"
          r="1.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="text-yellow-400"
        />
        
        {/* Товары в корзине */}
        {itemCount > 0 && (
          <>
            <motion.rect
              x="8"
              y="8"
              width="3"
              height="3"
              rx="0.5"
              fill="currentColor"
              className="text-gold-neon"
              {...(animate && {
                initial: { scale: 0, y: -10 },
                animate: { scale: 1, y: 0 },
                transition: { duration: 0.3, delay: 1.5 }
              })}
            />
            {itemCount > 1 && (
              <motion.rect
                x="12"
                y="9"
                width="2.5"
                height="2.5"
                rx="0.5"
                fill="currentColor"
                className="text-gold-neon opacity-80"
                {...(animate && {
                  initial: { scale: 0, y: -10 },
                  animate: { scale: 1, y: 0 },
                  transition: { duration: 0.3, delay: 1.7 }
                })}
              />
            )}
            {itemCount > 2 && (
              <motion.circle
                cx="16"
                cy="10"
                r="1"
                fill="currentColor"
                className="text-gold-neon opacity-60"
                {...(animate && {
                  initial: { scale: 0, y: -10 },
                  animate: { scale: 1, y: 0 },
                  transition: { duration: 0.3, delay: 1.9 }
                })}
              />
            )}
          </>
        )}
        
        {/* Сияние при анимации */}
        {animate && (
          <motion.circle
            cx="12"
            cy="12"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gold-neon opacity-30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.2, 0.8], 
              opacity: [0, 0.3, 0] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </IconComponent>
      
      {/* Счетчик товаров */}
      {itemCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-gold-primary text-black text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
          style={{
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)'
          }}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </motion.div>
      )}
    </div>
  );
};

export default CartIcon;
