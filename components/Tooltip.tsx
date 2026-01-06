import React, { useState } from 'react';

interface TooltipProps {
    title: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ title, children, position = 'bottom', className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
        left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
        right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
    };

    return (
        <div 
            className={`relative flex items-center ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <div
                className={`absolute px-2 py-1 bg-gray-900 text-gray-200 text-xs font-medium whitespace-nowrap rounded shadow-xl z-[100] pointer-events-none transition-opacity duration-200 ${positionClasses[position]} ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                role="tooltip"
            >
                {title}
            </div>
        </div>
    );
};

export default Tooltip;