
import React from 'react';
import type { NodeContentProps } from '../../types';
import { PromptLibraryToolbar } from '../PromptLibraryToolbar';

const TextInputNode: React.FC<NodeContentProps> = ({ node, onValueChange, libraryItems, t, deselectAllNodes }) => (
    <div className="flex flex-col h-full">
        <PromptLibraryToolbar
            libraryItems={libraryItems}
            onPromptInsert={(promptText: string) => {
                const newText = node.value ? `${node.value}, ${promptText}` : promptText;
                onValueChange(node.id, newText);
            }}
        />
        <textarea
            value={node.value}
            onChange={(e) => onValueChange(node.id, e.target.value)}
            placeholder={t('node.content.notePlaceholder')}
            className="w-full flex-grow p-2 bg-gray-700 border border-transparent rounded-md resize-none focus:border-emerald-500 focus:ring-0 focus:outline-none custom-scrollbar overflow-y-scroll"
            onWheel={e => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onFocus={deselectAllNodes}
        />
    </div>
);

export default TextInputNode;
