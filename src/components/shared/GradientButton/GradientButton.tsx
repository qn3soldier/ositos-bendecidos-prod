import React from 'react';
import { motion } from 'framer-motion';

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'gold' | 'dark' | 'gradient' | 'outline' | 'ghost' | 'silver' | 'blackGloss';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  ripple?: boolean;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'gradient',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ripple = true,
}) => {
  const sizeClasses = {
    sm: 'px-6 py-2.5 text-sm',
    md: 'px-8 py-3 text-base',
    lg: 'px-10 py-4 text-lg',
  };

  const variantClasses = {
    gold: 'glass-button btn-gold-static text-black',
    silver: 'glass-button btn-silver-static text-black',
    blackGloss: 'glass-button btn-black-gloss',
    dark: 'glass-button text-gold-primary hover:text-gold-neon',
    gradient: 'glass-button btn-gold-static text-black',
    outline: 'glass-button text-gold-primary hover:text-gold-neon',
    ghost: 'glass-button bg-transparent border-gold-primary/20 text-gold-primary hover:text-gold-neon',
  } as const;

  const baseClasses = `
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${ripple ? 'liquid-ripple' : ''}
    rounded-lg
    font-semibold
    hover:shadow-[0_0_35px_rgba(249,209,58,0.35)]
    transition-all
    duration-300
    transform
    hover:scale-105
    active:scale-95
    focus:outline-none
    focus:ring-2
    focus:ring-yellow-400
    focus:ring-opacity-40
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:scale-100
    relative
    overflow-hidden
    ${className}
  `;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={baseClasses}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
          Loading...
        </div>
      ) : (
        <span className="relative z-10 font-semibold">{children}</span>
      )}
      
      {/* Animated light sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-300" />
    </motion.button>
  );
};

export default GradientButton;