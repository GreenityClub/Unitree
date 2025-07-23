import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import Toast, { ToastVariant } from '../components/ui/Toast';

interface ToastContextProps {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = (): ToastContextProps => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState({
    message: '',
    variant: 'info' as ToastVariant,
    isVisible: false,
    duration: 3000,
  });

  const showToast = useCallback((message: string, variant: ToastVariant = 'info', duration: number = 3000) => {
    setToast({
      message,
      variant,
      isVisible: true,
      duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        message={toast.message}
        variant={toast.variant}
        isVisible={toast.isVisible}
        duration={toast.duration}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
};

export default ToastProvider; 