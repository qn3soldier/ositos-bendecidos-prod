import React from 'react';

interface BearLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showHalo?: boolean;
}

const BearLogo: React.FC<BearLogoProps> = ({
  size = 'md',
  className = '',
  showHalo = true,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300`}>
      {showHalo && (
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,209,58,0.18),transparent_60%)]" />
      )}
      <img
        src="/golden-bear.png"
        alt="Ositos Bendecidos Golden Bear"
        className="w-full h-full relative z-10 object-contain rounded-[14%] drop-shadow-[0_0_20px_rgba(249,209,58,0.25)]"
      />
    </div>
  );
};

export default BearLogo;