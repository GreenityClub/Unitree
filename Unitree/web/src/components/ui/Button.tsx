import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'outline' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Button component with various styles and sizes
 */
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  ...rest
}) => {
  // Base classes that apply to all buttons
  let buttonClasses = 
    'inline-flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Add variant specific classes
  switch (variant) {
    case 'primary':
      buttonClasses += ' bg-primary text-white hover:bg-primary-dark focus:ring-primary-dark';
      break;
    case 'secondary':
      buttonClasses += ' bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary-dark';
      break;
    case 'tertiary':
      buttonClasses += ' bg-tertiary text-white hover:bg-tertiary-dark focus:ring-tertiary-dark';
      break;
    case 'accent':
      buttonClasses += ' bg-accent text-white hover:bg-accent-dark focus:ring-accent-dark';
      break;
    case 'outline':
      buttonClasses += ' border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary';
      break;
    case 'danger':
      buttonClasses += ' bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
      break;
    case 'success':
      buttonClasses += ' bg-green-600 text-white hover:bg-green-700 focus:ring-green-500';
      break;
    case 'warning':
      buttonClasses += ' bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500';
      break;
    default:
      buttonClasses += ' bg-primary text-white hover:bg-primary-dark focus:ring-primary-dark';
  }
  
  // Add size specific classes
  switch (size) {
    case 'xs':
      buttonClasses += ' text-xs px-2 py-1';
      break;
    case 'sm':
      buttonClasses += ' text-sm px-3 py-1.5';
      break;
    case 'md':
      buttonClasses += ' text-base px-4 py-2';
      break;
    case 'lg':
      buttonClasses += ' text-lg px-5 py-2.5';
      break;
    case 'xl':
      buttonClasses += ' text-xl px-6 py-3';
      break;
    default:
      buttonClasses += ' text-base px-4 py-2';
  }
  
  // Add fullWidth class
  if (fullWidth) {
    buttonClasses += ' w-full';
  }
  
  // Add disabled styles
  if (disabled || isLoading) {
    buttonClasses += ' opacity-60 cursor-not-allowed';
  }
  
  // Add custom classes
  if (className) {
    buttonClasses += ` ${className}`;
  }

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...rest}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button; 