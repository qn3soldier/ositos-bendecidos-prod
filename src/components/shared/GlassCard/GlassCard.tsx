import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  animated = true,
  onClick,
  padding = 'md',
  hover = false,
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const cardContent = (
    <div
      className={`
        glass-card 
        ${paddingClasses[padding]}
        ${hover ? 'transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[0_0_35px_rgba(249,209,58,0.25)]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export default GlassCard;