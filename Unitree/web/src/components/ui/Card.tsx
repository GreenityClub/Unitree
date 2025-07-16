import React from 'react';
import { CardProps } from '../../types';

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  onClick,
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden';
  const clickableClasses = onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '';
  const classes = `${baseClasses} ${clickableClasses} ${className}`;
  
  return (
    <div className={classes} onClick={onClick}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
};

export default Card; 