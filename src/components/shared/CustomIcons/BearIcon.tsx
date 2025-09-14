import React from 'react';
import { motion } from 'framer-motion';

interface BearIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const BearIcon: React.FC<BearIconProps> = ({ 
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
      {/* Левое ухо */}
      <motion.circle
        cx="8"
        cy="7"
        r="2.5"
        fill="currentColor"
        className="text-gold-primary"
        {...(animate && {
          initial: { rotate: 0 },
          animate: { rotate: [-5, 5, -5] },
          transition: { duration: 3, repeat: Infinity }
        })}
      />
      
      {/* Правое ухо */}
      <motion.circle
        cx="16"
        cy="7"
        r="2.5"
        fill="currentColor"
        className="text-gold-primary"
        {...(animate && {
          initial: { rotate: 0 },
          animate: { rotate: [5, -5, 5] },
          transition: { duration: 3, repeat: Infinity }
        })}
      />
      
      {/* Внутренность левого уха */}
      <circle
        cx="8"
        cy="7"
        r="1.2"
        fill="currentColor"
        className="text-gold-neon"
      />
      
      {/* Внутренность правого уха */}
      <circle
        cx="16"
        cy="7"
        r="1.2"
        fill="currentColor"
        className="text-gold-neon"
      />
      
      {/* Голова мишки */}
      <motion.circle
        cx="12"
        cy="13"
        r="7"
        fill="currentColor"
        className="text-gold-primary"
        {...(animate && {
          initial: { scale: 1 },
          animate: { scale: [1, 1.02, 1] },
          transition: { duration: 2, repeat: Infinity }
        })}
      />
      
      {/* Левый глаз */}
      <motion.circle
        cx="10"
        cy="11"
        r="1"
        fill="currentColor"
        className="text-black"
        {...(animate && {
          initial: { scaleY: 1 },
          animate: { scaleY: [1, 0.2, 1] },
          transition: { duration: 3, repeat: Infinity, delay: 1 }
        })}
      />
      
      {/* Правый глаз */}
      <motion.circle
        cx="14"
        cy="11"
        r="1"
        fill="currentColor"
        className="text-black"
        {...(animate && {
          initial: { scaleY: 1 },
          animate: { scaleY: [1, 0.2, 1] },
          transition: { duration: 3, repeat: Infinity, delay: 1 }
        })}
      />
      
      {/* Нос */}
      <motion.ellipse
        cx="12"
        cy="13.5"
        rx="0.8"
        ry="0.5"
        fill="currentColor"
        className="text-black"
        {...(animate && {
          initial: { scale: 1 },
          animate: { scale: [1, 1.2, 1] },
          transition: { duration: 2, repeat: Infinity, delay: 0.5 }
        })}
      />
      
      {/* Рот */}
      <motion.path
        d="M12 14.5 C10.5 16 10.5 16 12 16 C13.5 16 13.5 16 12 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        className="text-black"
        {...(animate && {
          initial: { pathLength: 0 },
          animate: { pathLength: [0, 1, 0] },
          transition: { duration: 4, repeat: Infinity, delay: 2 }
        })}
      />
      
      {/* Блики в глазах */}
      <circle
        cx="10.3"
        cy="10.7"
        r="0.3"
        fill="currentColor"
        className="text-white"
      />
      <circle
        cx="14.3"
        cy="10.7"
        r="0.3"
        fill="currentColor"
        className="text-white"
      />
      
      {/* Сияние (если анимированный) */}
      {animate && (
        <motion.circle
          cx="12"
          cy="13"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gold-neon opacity-30"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.2, 0.8], 
            opacity: [0, 0.3, 0] 
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      )}
    </IconComponent>
  );
};

export default BearIcon;
