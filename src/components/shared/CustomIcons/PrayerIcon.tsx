import React from 'react';
import { motion } from 'framer-motion';

interface PrayerIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const PrayerIcon: React.FC<PrayerIconProps> = ({ 
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
          filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))'
        },
        transition: { duration: 0.2 }
      })}
    >
      {/* Руки в молитве */}
      <motion.path
        d="M12 2C11.5 2 11 2.2 10.7 2.6L8.3 6.5C8 7 8 7.6 8.3 8.1L10.7 12C11 12.4 11.5 12.6 12 12.6C12.5 12.6 13 12.4 13.3 12L15.7 8.1C16 7.6 16 7 15.7 6.5L13.3 2.6C13 2.2 12.5 2 12 2Z"
        fill="currentColor"
        className="text-gold-primary"
        {...(animate && {
          initial: { opacity: 0.7 },
          animate: { opacity: [0.7, 1, 0.7] },
          transition: { duration: 2, repeat: Infinity }
        })}
      />
      
      {/* Левая рука */}
      <motion.path
        d="M8 8L6 10C5.5 10.5 5.5 11.5 6 12L8 14C8.5 14.5 9.5 14.5 10 14L12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className="text-gold-neon"
      />
      
      {/* Правая рука */}
      <motion.path
        d="M16 8L18 10C18.5 10.5 18.5 11.5 18 12L16 14C15.5 14.5 14.5 14.5 14 14L12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className="text-gold-neon"
      />
      
      {/* Сердце в центре */}
      <motion.path
        d="M12 16C12 16 9 14 9 11.5C9 10.5 9.8 9.7 10.8 9.7C11.3 9.7 11.7 10 12 10.3C12.3 10 12.7 9.7 13.2 9.7C14.2 9.7 15 10.5 15 11.5C15 14 12 16 12 16Z"
        fill="currentColor"
        className="text-gold-primary"
        {...(animate && {
          initial: { scale: 0.8 },
          animate: { scale: [0.8, 1.1, 0.8] },
          transition: { duration: 1.5, repeat: Infinity }
        })}
      />
      
      {/* Сияние */}
      {animate && (
        <>
          <motion.circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gold-neon opacity-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 0], opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <motion.circle
            cx="12"
            cy="12"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
            className="text-gold-primary opacity-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 0.2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </>
      )}
    </IconComponent>
  );
};

export default PrayerIcon;
