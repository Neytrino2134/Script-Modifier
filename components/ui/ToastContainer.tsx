
import React from 'react';
import ToastNotification from './ToastNotification';
import type { Point } from '../../types';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info';
  position?: Point;
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  const positionedToasts = toasts.filter(t => t.position);
  const centeredToasts = toasts.filter(t => !t.position);

  return (
    <>
      {/* Container for old, centered toasts */}
      {centeredToasts.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[101] flex flex-col items-center space-y-2 pointer-events-none">
          {centeredToasts.map((toast) => (
            <ToastNotification
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
              isPositioned={false}
            />
          ))}
        </div>
      )}
      {/* Direct rendering for new, positioned toasts */}
      {positionedToasts.map((toast) => (
        <div 
          key={toast.id}
          className="fixed z-[101] pointer-events-none"
          style={{
            left: `${toast.position?.x}px`,
            top: `${toast.position?.y}px`,
          }}
        >
          <ToastNotification
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            isPositioned={true}
          />
        </div>
      ))}
    </>
  );
};

export default ToastContainer;
