import React from 'react';
import { IconUsers as TbUsers, IconCurrencyDollar as TbDollar } from '@tabler/icons-react';
import { Icon as Ify } from '@iconify/react';

type IconName = 'prayer' | 'community' | 'investment' | 'custom';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  // weight preserved for phosphor compatibility, not used in tabler
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'duotone';
  customIcon?: string; // iconify id e.g. 'solar:hands-praying-linear'
}

export const ModernIcon: React.FC<IconProps> = ({ name, size = 32, color = 'currentColor', customIcon }) => {
  switch (name) {
    case 'prayer':
      // Premium-looking praying hands via Iconify (phosphor set)
      return <Ify icon="ph:hands-praying" width={size} height={size} color={color} />;
    case 'community':
      return <TbUsers size={size} color={color} strokeWidth={1.8} />;
    case 'investment':
      return <TbDollar size={size} color={color} strokeWidth={1.8} />;
    default:
      return <Ify icon={customIcon || 'solar:hands-praying-linear'} width={size} height={size} color={color} />;
  }
};

export default ModernIcon;


