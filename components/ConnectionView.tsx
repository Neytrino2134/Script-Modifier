import React, { useState } from 'react';
import type { Point, Connection, Tool, Node, LineStyle } from '../types';
import { getOutputHandleType } from '../utils/nodeUtils';

interface ConnectionViewProps {
  connection: Connection;
  fromNode: Node;
  start: Point;
  end: Point;
  isNodeHovered: boolean;
  activeTool: Tool;
  onDelete: (connectionId: string) => void;
  onSplit: (connectionId: string, e: React.MouseEvent) => void;
  lineStyle: LineStyle;
}

const ConnectionView: React.FC<ConnectionViewProps> = ({ 
    connection,
    fromNode,
    start, 
    end, 
    isNodeHovered,
    activeTool,
    onDelete,
    onSplit,
    lineStyle,
}) => {
  const [isLineHovered, setIsLineHovered] = useState(false);
  
  const pathData = lineStyle === 'orthogonal'
    ? `M ${start.x} ${start.y} L ${(start.x + end.x) / 2} ${start.y} L ${(start.x + end.x) / 2} ${end.y} L ${end.x} ${end.y}`
    : `M ${start.x} ${start.y} C ${start.x + 80} ${start.y}, ${end.x - 80} ${end.y}, ${end.x} ${end.y}`;

  const fromType = getOutputHandleType(fromNode, connection.fromHandleId);
  
  let lineColor: string;
  if (fromType === 'text') {
    lineColor = '#34d399'; // emerald-400
  } else if (fromType === 'image') {
    lineColor = '#22d3ee'; // cyan-400
  } else {
    lineColor = '#6b7280'; // gray-500
  }

  const isCutterActive = activeTool === 'cutter';
  const isRerouteActive = activeTool === 'reroute';
  const isHighlighted = (isCutterActive || isRerouteActive) && (isLineHovered || isNodeHovered);

  const strokeColor = isCutterActive && isHighlighted ? '#ef4444' : (isRerouteActive && isHighlighted ? '#10b981' : lineColor);
  const strokeWidth = isHighlighted ? 5 : 3;
  
  let cursorStyle = 'default';
  if (isCutterActive && (isLineHovered || isNodeHovered)) {
    cursorStyle = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="%23ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>') 12 12, auto`;
  } else if (isRerouteActive && isLineHovered) {
    cursorStyle = 'crosshair';
  } else if (isCutterActive || isRerouteActive) {
    cursorStyle = 'pointer';
  }


  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent canvas mousedown from firing
    if (isCutterActive) {
      onDelete(connection.id);
    } else if (isRerouteActive) {
      onSplit(connection.id, e);
    }
  };

  return (
    <g 
      onMouseEnter={() => setIsLineHovered(true)}
      onMouseLeave={() => setIsLineHovered(false)}
      onClick={handleClick}
      onContextMenu={(e) => e.stopPropagation()}
      style={{ cursor: cursorStyle, pointerEvents: 'auto' }}
    >
      {/* Hit area for easy selection */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        style={{ pointerEvents: 'stroke' }}
      />
      {/* Visible static line */}
      <path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        style={{ pointerEvents: 'none', transition: 'stroke 0.2s ease-in-out, stroke-width 0.2s ease-in-out' }} 
      />
      {/* Animated data flow layer */}
      <path
        d={pathData}
        stroke="white"
        strokeWidth="2"
        fill="none"
        className="connection-flow"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
};

export default React.memo(ConnectionView);