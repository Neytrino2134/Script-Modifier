import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'info';
  onClose: () => void;
  isPositioned: boolean;
}

const ToastNotification: React.FC<ToastProps> = ({ message, type, onClose, isPositioned }) => {
  const handleAnimationEnd = () => {
    onClose();
  };

  const animationClass = isPositioned ? 'toast-animate-positioned' : 'toast-animate-centered';

  const isSuccess = type === 'success';

  const styleClasses = isSuccess
    ? 'bg-emerald-600/90 text-white'
    : 'bg-gray-700/90 text-gray-100';
  
  const icon = isSuccess ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : null;

  return (
    <div
      onAnimationEnd={handleAnimationEnd}
      className={`flex items-center space-x-3 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm pointer-events-auto ${styleClasses} ${animationClass}`}
      role="alert"
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <p className="text-sm font-semibold whitespace-pre-wrap">{message}</p>
    </div>
  );
};

export default ToastNotification;