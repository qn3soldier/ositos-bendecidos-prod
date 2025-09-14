import React from 'react';
import { motion } from 'framer-motion';

interface LiquidLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gold' | 'dark' | 'gradient';
  text?: string;
  className?: string;
}

const LiquidLoader: React.FC<LiquidLoaderProps> = ({
  size = 'md',
  variant = 'gradient',
  text,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colorClasses = {
    gold: 'border-yellow-500',
    dark: 'border-gray-600',
    gradient: 'border-yellow-500',
  };

  const waveVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1] as const
      }
    }
  };

  const liquidVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1] as const
      }
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Liquid Animation Container */}
      <div className={`${sizeClasses[size]} relative`}>
        {/* Main circle */}
        <motion.div
          className={`
            w-full h-full rounded-full border-4 
            ${colorClasses[variant]} 
            border-t-transparent
            ${variant === 'gradient' ? 'animate-spin' : ''}
          `}
          animate={variant !== 'gradient' ? { rotate: 360 } : {}}
          transition={variant !== 'gradient' ? {
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          } : {}}
        />
        
        {/* Liquid drops inside */}
        <div className="absolute inset-2 flex items-center justify-center">
          <motion.div
            variants={liquidVariants}
            animate="animate"
            className={`
              w-2 h-2 rounded-full 
              ${variant === 'gold' ? 'bg-yellow-500' : 
                variant === 'dark' ? 'bg-gray-600' : 
                'bg-gradient-to-r from-gold-primary to-gold-neon'}
            `}
          />
        </div>
        
        {/* Wave effect */}
        <motion.div
          variants={waveVariants}
          animate="animate"
          className={`
            absolute -inset-1 rounded-full border-2 border-opacity-30
            ${colorClasses[variant]}
          `}
        />
        <motion.div
          variants={waveVariants}
          animate="animate"
          style={{ animationDelay: '0.5s' }}
          className={`
            absolute -inset-2 rounded-full border-2 border-opacity-20
            ${colorClasses[variant]}
          `}
        />
      </div>

      {/* Loading text */}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          {text}
        </motion.p>
      )}

      {/* Floating blessing particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-500 rounded-full opacity-50"
            animate={{
              y: [100, -20],
              x: [Math.random() * 50, Math.random() * 50],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.8,
              ease: [0.25, 0.46, 0.45, 0.94] as const
            }}
            style={{
              left: `${20 + i * 20}%`,
              top: '100%'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LiquidLoader;