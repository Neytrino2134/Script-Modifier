import React from 'react';
import Tooltip from './ui/Tooltip';

export const ActionButton: React.FC<{ 
    title: string; 
    onClick: (e: React.MouseEvent) => void; 
    children: React.ReactNode; 
    tooltipPosition?: 'top' | 'left' | 'right' | 'bottom'; 
    disabled?: boolean;
    className?: string; // Added className prop
}> = ({ title, onClick, children, tooltipPosition = 'top', disabled = false, className = '' }) => {
    return (
        <Tooltip title={disabled ? '' : title} position={tooltipPosition}>
            <button
                onClick={onClick}
                disabled={disabled}
                onMouseDown={(e) => e.stopPropagation()} // Prevent node dragging
                aria-label={title}
                className={`p-1 text-gray-400 rounded hover:bg-gray-600 hover:text-white transition-colors duration-150 focus:outline-none disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed flex items-center justify-center ${className}`}
            >
                {children}
            </button>
        </Tooltip>
    );
};