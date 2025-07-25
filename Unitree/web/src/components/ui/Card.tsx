import React from 'react';

export type CardVariant = 'default' | 'primary' | 'secondary' | 'tertiary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'danger';
export type RoundedSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full' | 'none';

export interface CardProps {
  /**
   * Card content
   */
  children: React.ReactNode;
  
  /**
   * Optional card title
   */
  title?: string;
  
  /**
   * Optional card subtitle
   */
  subtitle?: string;
  
  /**
   * Variant defines the color scheme
   */
  variant?: CardVariant;
  
  /**
   * Border radius size
   */
  rounded?: RoundedSize;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * Whether to include a header section
   */
  withHeader?: boolean;
  
  /**
   * Whether to include a footer section
   */
  withFooter?: boolean;
  
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

/**
 * Card component for displaying content in a contained box
 * with various styles and optional header/footer sections
 */
const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  variant = 'default',
  rounded = 'lg',
  className = '',
  withHeader = false,
  withFooter = false,
  onClick
}) => {
  // Base classes for the card
  let cardClasses = 'shadow-sm overflow-hidden';
  
  // Add rounded classes based on the rounded prop
  switch (rounded) {
    case 'none':
      cardClasses += ' rounded-none';
      break;
    case 'sm':
      cardClasses += ' rounded-sm';
      break;
    case 'md':
      cardClasses += ' rounded-md';
      break;
    case 'lg':
      cardClasses += ' rounded-lg';
      break;
    case 'xl':
      cardClasses += ' rounded-xl';
      break;
    case '2xl':
      cardClasses += ' rounded-2xl';
      break;
    case '3xl':
      cardClasses += ' rounded-3xl';
      break;
    case '4xl':
      cardClasses += ' rounded-4xl';
      break;
    case 'full':
      cardClasses += ' rounded-full';
      break;
    default:
      cardClasses += ' rounded-lg';
  }
  
  // Add variant-specific classes - keep original dashboard style
  switch (variant) {
    case 'primary':
      cardClasses += ' bg-green-50 border border-green-100';
      break;
    case 'secondary':
      cardClasses += ' bg-emerald-50 border border-emerald-100';
      break;
    case 'tertiary':
      cardClasses += ' bg-blue-50 border border-blue-100';
      break;
    case 'accent':
      cardClasses += ' bg-red-50 border border-red-100';
      break;
    case 'info':
      cardClasses += ' bg-blue-50 border border-blue-200';
      break;
    case 'success':
      cardClasses += ' bg-green-50 border border-green-200';
      break;
    case 'warning':
      cardClasses += ' bg-yellow-50 border border-yellow-200';
      break;
    case 'error':
    case 'danger': // Support both names for backward compatibility
      cardClasses += ' bg-red-50 border border-red-200';
      break;
    default:
      cardClasses += ' bg-white border border-gray-200';
  }
  
  // Add cursor pointer if onClick provided
  if (onClick) {
    cardClasses += ' cursor-pointer hover:shadow-md transition-shadow';
  }
  
  // Add custom classes
  cardClasses += ` ${className}`;
  
  // Determine if we need a default header based on title prop
  const needsDefaultHeader = title && !withHeader;
  
  return (
    <div className={cardClasses} onClick={onClick}>
      {/* Default header based on title prop */}
      {needsDefaultHeader && (
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      
      {/* Content */}
      {children}
    </div>
  );
};

export default Card; 