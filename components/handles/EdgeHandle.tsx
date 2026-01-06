import React, { useState } from 'react';

interface EdgeHandleProps {
  id: string;
  title: string;
  color: string;
  handleCursor: string;
  position: 'left' | 'right';
  style: React.CSSProperties;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
}

const EdgeHandle: React.FC<EdgeHandleProps> = ({ id, title, color, handleCursor, position, style, onMouseDown, onTouchStart }) => {
    const [isHovered, setIsHovered] = useState(false);

    const tooltipPositionClass = position === 'left' 
        ? 'left-full ml-1.5' 
        : 'right-full mr-1.5';
    
    const containerStyle: React.CSSProperties = {
      ...style,
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      zIndex: 16,
    };
    if (position === 'left') {
        containerStyle.left = '-10px';
    } else {
        containerStyle.right = '-10px';
    }

    return (
        <div
            style={containerStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                id={id}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                className={`w-5 h-5 ${color} rounded-full border-2 border-gray-900 flex-shrink-0`}
                style={{ cursor: handleCursor }}
            />
            <div
                className={`absolute px-2 py-1 bg-gray-900 text-gray-200 text-xs font-medium whitespace-nowrap rounded shadow-xl z-[100] transition-opacity duration-200 pointer-events-none ${tooltipPositionClass} ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                role="tooltip"
            >
                {title}
            </div>
        </div>
    );
};

export default EdgeHandle;