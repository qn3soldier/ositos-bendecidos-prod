import React, { useState } from 'react';
import BearLogo from '../BearLogo';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  src?: string; // path to image in public, e.g. '/user-logo.png'
  size?: LogoSize;
  className?: string;
  showHalo?: boolean;
  alt?: string;
  dimension?: number; // explicit px size to override preset
}

const sizeToPx: Record<LogoSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

const Logo: React.FC<LogoProps> = ({ src = '/golden-bear.png', size = 'md', className = '', showHalo = false, alt = 'Ositos Bendecidos', dimension }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <BearLogo size={size === 'xl' ? 'lg' : size} className={className} showHalo={showHalo} />;
  }

  return (
    <div className={`relative ${sizeToPx[size]} ${className}`} style={dimension ? { width: dimension, height: dimension } : undefined}>
      {/* Сохраняем очень деликатное свечение без радиального градиента */}
      {showHalo && (
        <div className="absolute inset-0 rounded-full" style={{ filter: 'drop-shadow(0 0 32px rgba(255, 215, 0, 0.25))' }} />
      )}
      <img
        src={src}
        alt={alt}
        className={`relative z-10 ${sizeToPx[size]} object-contain`}
        style={dimension ? { width: dimension, height: dimension, filter: 'drop-shadow(0 0 24px rgba(255, 215, 0, 0.2))' } : { filter: 'drop-shadow(0 0 24px rgba(255, 215, 0, 0.2))' }}
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export default Logo;


