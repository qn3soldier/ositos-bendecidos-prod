import React from 'react';
import { motion } from 'framer-motion';

interface DonateIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const DonateIcon: React.FC<DonateIconProps> = ({ 
  size = 'md', 
  className = '', 
  animate = false 
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const IconComponent = animate ? motion.svg : 'svg';

  return (
    <IconComponent
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...(animate && {
        initial: { scale: 1 },
        whileHover: { 
          scale: 1.1,
          filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.6))'
        },
        transition: { duration: 0.2 }
      })}
    >
      {/* Основной круг монеты */}
      <motion.circle
        cx="12"
        cy="12"
        r="8"
        fill="currentColor"
        className="text-gold-primary"
        {...(animate && {
          initial: { scale: 1 },
          animate: { scale: [1, 1.05, 1] },
          transition: { duration: 2, repeat: Infinity }
        })}
      />
      
      {/* Внутренний круг */}
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-black"
      />
      
      {/* Символ сердца в центре */}
      <motion.path
        d="M12 16C12 16 9.5 14.5 9.5 12.5C9.5 11.7 10.2 11 11 11C11.3 11 11.6 11.1 11.8 11.3L12 11.5L12.2 11.3C12.4 11.1 12.7 11 13 11C13.8 11 14.5 11.7 14.5 12.5C14.5 14.5 12 16 12 16Z"
        fill="currentColor"
        className="text-black"
        {...(animate && {
          initial: { scale: 0.8 },
          animate: { scale: [0.8, 1.1, 0.8] },
          transition: { duration: 1.5, repeat: Infinity, delay: 0.3 }
        })}
      />
      
      {/* Летящие монеты */}
      {animate && (
        <>
          <motion.circle
            cx="6"
            cy="6"
            r="1.5"
            fill="currentColor"
            className="text-gold-neon"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ 
              x: [0, -10, -20], 
              y: [0, -5, -10], 
              opacity: [0, 1, 0] 
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
          <motion.circle
            cx="18"
            cy="6"
            r="1"
            fill="currentColor"
            className="text-gold-neon"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ 
              x: [0, 15, 25], 
              y: [0, -8, -15], 
              opacity: [0, 1, 0] 
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 }}
          />
          <motion.circle
            cx="6"
            cy="18"
            r="1.2"
            fill="currentColor"
            className="text-gold-neon"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ 
              x: [0, -12, -20], 
              y: [0, 8, 15], 
              opacity: [0, 1, 0] 
            }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.7 }}
          />
        </>
      )}
      
      {/* Сияние вокруг */}
      {animate && (
        <motion.circle
          cx="12"
          cy="12"
          r="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gold-neon opacity-40"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.3, 0.8], 
            opacity: [0, 0.4, 0] 
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      )}
    </IconComponent>
  );
};

export default DonateIcon;
