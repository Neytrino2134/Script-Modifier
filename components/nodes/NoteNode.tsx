
import React from 'react';
import type { NodeContentProps } from '../../types';

const NoteNode: React.FC<NodeContentProps> = ({ node, onValueChange, t, deselectAllNodes }) => (
    <textarea
        value={node.value}
        onChange={(e) => onValueChange(node.id, e.target.value)}
        placeholder={t('node.content.notePlaceholder')}
        className="w-full h-full p-2 bg-transparent border border-transparent rounded-md resize-none focus:border-emerald-500 focus:ring-0 focus:outline-none custom-scrollbar overflow-y-scroll"
        onWheel={e => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onFocus={deselectAllNodes}
    />
);

export default NoteNode;
