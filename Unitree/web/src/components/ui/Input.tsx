import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary' | 'accent';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', variant = 'default', ...props }, ref) => {
    // Colors based on variant
    const getColorClasses = () => {
      const variantClasses = {
        default: 'border-gray-300 focus:ring-primary focus:border-primary',
        primary: 'border-primary-light focus:ring-primary focus:border-primary',
        secondary: 'border-secondary-light focus:ring-secondary focus:border-secondary',
        tertiary: 'border-tertiary-light focus:ring-tertiary focus:border-tertiary',
        accent: 'border-accent-light focus:ring-accent focus:border-accent',
      };
      
      return variantClasses[variant];
    };
    
    const baseClasses = `block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm ${getColorClasses()}`;
    const errorClasses = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '';
    const classes = `${baseClasses} ${errorClasses} ${className}`;
    
    // Label colors based on variant
    const getLabelClass = () => {
      if (error) return 'text-red-600';
      
      const labelClasses = {
        default: 'text-gray-700',
        primary: 'text-primary-dark',
        secondary: 'text-secondary-dark',
        tertiary: 'text-tertiary-dark',
        accent: 'text-accent-dark',
      };
      
      return labelClasses[variant];
    };
    
    return (
      <div>
        {label && (
          <label className={`block text-sm font-medium mb-1 ${getLabelClass()}`}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={classes}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 