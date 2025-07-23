import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import { 
  checkIcon, 
  infoIcon, 
  warningIcon, 
  closeIcon, 
  exclamationCircleIcon 
} from '../../utils/icons';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  duration = 3000,
  onClose,
  isVisible,
}) => {
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShown(true);
      
      // Auto close after duration
      const timer = setTimeout(() => {
        setIsShown(false);
        setTimeout(() => onClose && onClose(), 300); // Wait for animation to complete
      }, duration);
      
      return () => clearTimeout(timer);
    } else {
      setIsShown(false);
    }
  }, [isVisible, duration, onClose]);

  // Get variant-specific styles and icon
  const getVariantConfig = () => {
    switch (variant) {
      case 'success':
        return {
          icon: checkIcon,
          bgColor: 'bg-green-500',
          textColor: 'text-white',
        };
      case 'warning':
        return {
          icon: warningIcon,
          bgColor: 'bg-amber-500',
          textColor: 'text-white',
        };
      case 'error':
        return {
          icon: exclamationCircleIcon,
          bgColor: 'bg-red-500',
          textColor: 'text-white',
        };
      case 'info':
      default:
        return {
          icon: infoIcon,
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
        };
    }
  };

  const variantConfig = getVariantConfig();

  if (!isVisible && !isShown) return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 flex items-center min-w-[250px] max-w-md p-4 ${variantConfig.bgColor} ${variantConfig.textColor} rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${isShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <Icon icon={variantConfig.icon} className="mr-2" />
      <div className="flex-1">{message}</div>
      <button 
        className="ml-4 hover:opacity-80 focus:outline-none" 
        onClick={() => {
          setIsShown(false);
          setTimeout(() => onClose && onClose(), 300);
        }}
      >
        <Icon icon={closeIcon} />
      </button>
    </div>
  );
};

export default Toast; 