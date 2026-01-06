import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    title: React.ReactNode;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    contentClassName?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ title, children, position = 'bottom', className = '', contentClassName = '' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (triggerRef.current && isVisible) {
            const rect = triggerRef.current.getBoundingClientRect();
            const gap = 6;
            let top = 0;
            let left = 0;

            switch (position) {
                case 'top':
                    top = rect.top - gap;
                    left = rect.left + rect.width / 2;
                    break;
                case 'bottom':
                    top = rect.bottom + gap;
                    left = rect.left + rect.width / 2;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2;
                    left = rect.left - gap;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2;
                    left = rect.right + gap;
                    break;
            }
            setCoords({ top, left });
        }
    };

    useLayoutEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isVisible, position]);

    const transformClasses = {
        top: '-translate-x-1/2 -translate-y-full',
        bottom: '-translate-x-1/2',
        left: '-translate-x-full -translate-y-1/2',
        right: '-translate-y-1/2',
    };

    // If no title, render children directly without wrapper logic to save resources, 
    // but keep wrapper for consistency in styling if className is provided.
    if (!title) {
        return <div className={`relative flex items-center justify-center ${className}`}>{children}</div>;
    }

    return (
        <div 
            ref={triggerRef}
            className={`relative flex items-center justify-center ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onMouseDown={() => setIsVisible(false)}
        >
            {children}
            {isVisible && createPortal(
                <div
                    className={`fixed z-[9999] px-2 py-1 bg-gray-900 text-gray-200 text-xs font-medium rounded shadow-xl pointer-events-none transition-opacity duration-200 ${transformClasses[position]} ${contentClassName || 'whitespace-nowrap'}`}
                    style={{ 
                        top: coords.top, 
                        left: coords.left,
                        // Ensure it's on top of everything
                        isolation: 'isolate'
                    }}
                    role="tooltip"
                >
                    {title}
                </div>,
                document.body
            )}
        </div>
    );
};

export default Tooltip;