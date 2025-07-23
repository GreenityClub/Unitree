import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Icon from './Icon';
import { closeIcon, checkIcon, infoIcon, warningIcon, exclamationIcon } from '../../utils/icons';

export type ModalVariant = 'info' | 'success' | 'warning' | 'error';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: ModalVariant;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  variant = 'info',
  showCloseButton = true,
  closeOnBackdropClick = true,
  footer,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle animation timing when opening/closing modal
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Small delay to ensure DOM is ready for animation
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before removing from DOM
      setTimeout(() => setIsRendered(false), 300);
    }
  }, [isOpen]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  // Get variant-specific styles and icon
  const getVariantConfig = () => {
    switch (variant) {
      case 'success':
        return {
          icon: checkIcon,
          iconColor: 'text-green-500',
          borderColor: 'border-green-500',
          bgColor: 'bg-green-50',
          headerBg: 'bg-green-500',
        };
      case 'warning':
        return {
          icon: warningIcon,
          iconColor: 'text-amber-500',
          borderColor: 'border-amber-500',
          bgColor: 'bg-amber-50',
          headerBg: 'bg-amber-500',
        };
      case 'error':
        return {
          icon: exclamationIcon || closeIcon, // Fallback to closeIcon if exclamationIcon isn't available
          iconColor: 'text-red-500',
          borderColor: 'border-red-500',
          bgColor: 'bg-red-50',
          headerBg: 'bg-red-500',
        };
      case 'info':
      default:
        return {
          icon: infoIcon,
          iconColor: 'text-blue-500',
          borderColor: 'border-blue-500',
          bgColor: 'bg-blue-50',
          headerBg: 'bg-blue-500',
        };
    }
  };

  const variantConfig = getVariantConfig();

  // Don't render anything if modal is closed and animation has completed
  if (!isRendered) return null;

  // Create portal to render modal at root level
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-md transform rounded-lg shadow-xl transition-all duration-300 ease-in-out ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${variantConfig.bgColor} ${variantConfig.borderColor} border`}
      >
        {/* Header */}
        {title && (
          <div className={`px-6 py-4 rounded-t-lg text-white ${variantConfig.headerBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Icon icon={variantConfig.icon} className="mr-2" />
                <h3 className="text-lg font-medium">{title}</h3>
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  className="text-white hover:text-gray-200 focus:outline-none"
                  onClick={onClose}
                >
                  <Icon icon={closeIcon} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal; 