
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationToastProps {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, isVisible, onClose }) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Auto hide after 4s
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!show) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 text-white shadow-lg';
      case 'error':
        return 'bg-maroon-600 text-white shadow-lg';
      case 'info':
        return 'bg-navy-600 text-white shadow-lg';
      default:
        return 'bg-navy-900 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={18} />;
      case 'error': return <AlertCircle size={18} />;
      case 'info': return <Info size={18} />;
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-2 pointer-events-none">
      <div 
        className={`pointer-events-auto flex items-center gap-3 px-6 py-3 rounded-full font-bold text-sm transform transition-all duration-300 animate-slide-down ${getStyles()}`}
      >
        {getIcon()}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
