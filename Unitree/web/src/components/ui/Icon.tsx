import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

// Add all icons to the library so you can use them anywhere
library.add(fas, far, fab);

export interface IconProps {
  icon: IconDefinition;
  className?: string;
  size?: 'xs' | 'sm' | 'lg' | '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x';
  color?: string;
  spin?: boolean;
  pulse?: boolean;
  border?: boolean;
  fixedWidth?: boolean;
  inverse?: boolean;
  listItem?: boolean;
  flip?: 'horizontal' | 'vertical' | 'both';
  rotation?: 90 | 180 | 270;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({ 
  icon, 
  className = '', 
  size,
  color,
  ...props 
}) => {
  return (
    <FontAwesomeIcon
      icon={icon}
      className={className}
      size={size}
      style={color ? { color } : undefined}
      {...props}
    />
  );
};

export default Icon; 