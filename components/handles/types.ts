import React from 'react';
import type { Node, Point } from '../../types';

export interface HandleProps {
  node: Node;
  getHandleColor: (type: 'text' | 'image' | null, handleId?: string) => string;
  handleCursor: string;
  t: (key: string) => string;
  isHovered: boolean;
  isCollapsed?: boolean;
}

export interface OutputHandleProps extends HandleProps {
  onOutputHandleMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string, handleId?: string, isSubNode?: boolean, subNodePosition?: Point) => void;
  onOutputHandleTouchStart: (e: React.TouchEvent<HTMLDivElement>, nodeId: string, handleId?: string, isSubNode?: boolean, subNodePosition?: Point) => void;
}