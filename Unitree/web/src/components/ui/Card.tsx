import React from 'react';
import { CardProps } from '../../types';

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  onClick,
  rounded = 'lg', // Default to rounded-lg if not specified
  variant = 'default', // Default, primary, secondary, tertiary, accent
}) => {
  // Map rounded prop values to actual pixel values
  const getBorderRadiusValue = () => {
    const radiusMap = {
      'none': '0px',
      'sm': '0.125rem',    // 2px
      'md': '0.375rem',    // 6px
      'lg': '0.5rem',      // 8px
      'xl': '0.75rem',     // 12px
      '2xl': '1rem',       // 16px
      '3xl': '1.5rem',     // 24px
      '4xl': '2rem',       // 32px
      'full': '9999px'     // fully rounded
    };
    
    return radiusMap[rounded] || '0.5rem'; // Default to 0.5rem (lg) if invalid value
  };
  
  // Card variant classes
  const variantClasses = {
    default: 'bg-white shadow-sm border border-gray-200',
    primary: 'card-primary shadow-sm',
    secondary: 'card-secondary shadow-sm',
    tertiary: 'card-tertiary shadow-sm',
    accent: 'card-accent shadow-sm',
  };
  
  const baseClasses = 'overflow-hidden';
  const clickableClasses = onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '';
  const classes = `${baseClasses} ${variantClasses[variant]} ${clickableClasses} ${className}`;
  
  const style = {
    borderRadius: getBorderRadiusValue()
  };
  
  // Title style based on variant
  const getTitleClasses = () => {
    const titleClasses = {
      default: 'text-gray-900',
      primary: 'text-text',
      secondary: 'text-text',
      tertiary: 'text-text',
      accent: 'text-text',
    };
    
    return `text-lg font-medium ${titleClasses[variant]}`;
  };
  
  // Border style based on variant
  const getTitleBorderClasses = () => {
    const borderClasses = {
      default: 'border-gray-200',
      primary: 'border-primary',
      secondary: 'border-secondary',
      tertiary: 'border-tertiary',
      accent: 'border-accent',
    };
    
    return `border-b ${borderClasses[variant]}`;
  };
  
  return (
    <div className={classes} onClick={onClick} style={style}>
      {title && (
        <div className={`px-6 py-4 ${getTitleBorderClasses()}`}>
          <h3 className={getTitleClasses()}>{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
};

export default Card; 