import React, { useState } from 'react';

interface HandleWithTooltipProps {
  id?: string;
  title: string;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  color: string;
  handleCursor: string;
}

const HandleWithTooltip: React.FC<HandleWithTooltipProps> = ({ id, title, onMouseDown, onTouchStart, color, handleCursor }) => {
    const [isHovered, setIsHovered] = useState(false);

    const tooltipClassName = `px-2 py-1 bg-gray-900 text-gray-200 text-xs font-medium whitespace-nowrap rounded shadow-xl z-[100] transition-opacity duration-200 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`;
    
    const Tooltip = () => (
        <div
            className={`${tooltipClassName} absolute right-full mr-1.5`}
            role="tooltip"
        >
            {title}
        </div>
    );

    return (
        <div 
            className="relative flex items-center justify-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                id={id}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                className={`w-5 h-5 ${color} rounded-full border-2 border-gray-900 flex-shrink-0`}
                style={{ cursor: handleCursor, zIndex: 17 }}
            />
            <Tooltip />
        </div>
    );
};

export default HandleWithTooltip;