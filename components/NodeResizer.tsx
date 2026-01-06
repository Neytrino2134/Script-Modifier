import React from 'react';

interface NodeResizerProps {
    onResizeMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    onResizeTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
}

const NodeResizer: React.FC<NodeResizerProps> = ({ onResizeMouseDown, onResizeTouchStart }) => (
    <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group" 
        onMouseDown={onResizeMouseDown} 
        onTouchStart={onResizeTouchStart} 
        style={{ zIndex: 13 }}
    >
        <div className="w-full h-full border-r-2 border-b-2 border-gray-600 group-hover:border-emerald-400 transition-colors rounded-br-lg"></div>
    </div>
);

export default NodeResizer;
