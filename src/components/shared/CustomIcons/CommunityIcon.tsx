import React from 'react';
import { motion } from 'framer-motion';

interface CommunityIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const CommunityIcon: React.FC<CommunityIconProps> = ({ 
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
          filter: 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.5))'
        },
        transition: { duration: 0.2 }
      })}
    >
      {/* Центральная фигура */}
      <motion.circle
        cx="12"
        cy="8"
        r="2.5"
        fill="currentColor"
        className="text-gold-primary"
        {...(animate && {
          initial: { scale: 1 },
          animate: { scale: [1, 1.1, 1] },
          transition: { duration: 2, repeat: Infinity }
        })}
      />
      <motion.path
        d="M12 11 C8.5 11 8.5 13 8.5 16 L15.5 16 C15.5 13 15.5 11 12 11 Z"
        fill="currentColor"
        className="text-gold-primary"
        {...(animate && {
          initial: { scaleY: 1 },
          animate: { scaleY: [1, 1.05, 1] },
          transition: { duration: 2, repeat: Infinity, delay: 0.2 }
        })}
      />
      
      {/* Левая фигура */}
      <motion.circle
        cx="6"
        cy="9"
        r="2"
        fill="currentColor"
        className="text-gold-neon"
        {...(animate && {
          initial: { scale: 1, x: 0 },
          animate: { 
            scale: [1, 1.05, 1],
            x: [0, -2, 0]
          },
          transition: { duration: 2.5, repeat: Infinity, delay: 1 }
        })}
      />
      <motion.path
        d="M6 11.5 C3.5 11.5 3.5 13 3.5 15.5 L8.5 15.5 C8.5 13.5 8.5 11.5 6 11.5 Z"
        fill="currentColor"
        className="text-gold-neon opacity-80"
        {...(animate && {
          initial: { scaleY: 1, x: 0 },
          animate: { 
            scaleY: [1, 1.03, 1],
            x: [0, -2, 0]
          },
          transition: { duration: 2.5, repeat: Infinity, delay: 1.2 }
        })}
      />
      
      {/* Правая фигура */}
      <motion.circle
        cx="18"
        cy="9"
        r="2"
        fill="currentColor"
        className="text-gold-neon"
        {...(animate && {
          initial: { scale: 1, x: 0 },
          animate: { 
            scale: [1, 1.05, 1],
            x: [0, 2, 0]
          },
          transition: { duration: 2.5, repeat: Infinity, delay: 1.5 }
        })}
      />
      <motion.path
        d="M18 11.5 C20.5 11.5 20.5 13 20.5 15.5 L15.5 15.5 C15.5 13.5 15.5 11.5 18 11.5 Z"
        fill="currentColor"
        className="text-gold-neon opacity-80"
        {...(animate && {
          initial: { scaleY: 1, x: 0 },
          animate: { 
            scaleY: [1, 1.03, 1],
            x: [0, 2, 0]
          },
          transition: { duration: 2.5, repeat: Infinity, delay: 1.7 }
        })}
      />
      
      {/* Задние фигуры */}
      <motion.circle
        cx="4"
        cy="7"
        r="1.5"
        fill="currentColor"
        className="text-gold-primary opacity-60"
        {...(animate && {
          initial: { opacity: 0.6 },
          animate: { opacity: [0.6, 0.8, 0.6] },
          transition: { duration: 3, repeat: Infinity }
        })}
      />
      <motion.circle
        cx="20"
        cy="7"
        r="1.5"
        fill="currentColor"
        className="text-gold-primary opacity-60"
        {...(animate && {
          initial: { opacity: 0.6 },
          animate: { opacity: [0.6, 0.8, 0.6] },
          transition: { duration: 3, repeat: Infinity, delay: 0.5 }
        })}
      />
      
      {/* Соединительные линии (представляют связь) */}
      {animate && (
        <>
          <motion.path
            d="M8.5 9 L9.5 8.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-gold-neon opacity-50"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0], 
              opacity: [0, 0.5, 0] 
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 2 }}
          />
          <motion.path
            d="M15.5 9 L14.5 8.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-gold-neon opacity-50"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0], 
              opacity: [0, 0.5, 0] 
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 2.2 }}
          />
        </>
      )}
      
      {/* Сердце над группой */}
      <motion.path
        d="M12 4 C12 4 10.5 2.5 9 2.5 C7.5 2.5 6.5 3.5 6.5 4.5 C6.5 6 8 7 9.5 7 L12 4 L14.5 7 C16 7 17.5 6 17.5 4.5 C17.5 3.5 16.5 2.5 15 2.5 C13.5 2.5 12 4 12 4 Z"
        fill="currentColor"
        className="text-gold-primary"
        {...(animate && {
          initial: { scale: 0.8, y: 0 },
          animate: { 
            scale: [0.8, 1, 0.8],
            y: [0, -2, 0]
          },
          transition: { duration: 2, repeat: Infinity, delay: 0.5 }
        })}
      />
      
      {/* Аура сообщества */}
      {animate && (
        <motion.circle
          cx="12"
          cy="11"
          r="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gold-neon opacity-30"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ 
            scale: [0.7, 1.1, 0.7], 
            opacity: [0, 0.3, 0] 
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}
    </IconComponent>
  );
};

export default CommunityIcon;
