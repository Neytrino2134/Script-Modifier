
import React from 'react';
import type { NodeContentProps } from '../../types';

const ErrorAnalyzerNode: React.FC<NodeContentProps> = ({ node, onValueChange, onFixErrors, isFixingErrors, isStopping, onStopGeneration, connectedInputs, t, deselectAllNodes }) => {
    const isInputConnected = connectedInputs?.has(undefined);
    const isLoading = isFixingErrors === node.id;

    return (
        <div className="flex flex-col h-full">
            <textarea
                value={node.value}
                onChange={(e) => onValueChange(node.id, e.target.value)}
                placeholder={isInputConnected ? t('node.content.connectedPlaceholder') : t('node.content.notePlaceholder')}
                className="w-full flex-grow p-2 bg-gray-700 border border-transparent rounded-md resize-none focus:border-emerald-500 focus:ring-0 focus:outline-none disabled:bg-gray-800 disabled:text-gray-500 mb-2 custom-scrollbar overflow-y-scroll"
                onWheel={e => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={deselectAllNodes}
                disabled={isInputConnected || isLoading}
            />
            <button
                onClick={isLoading ? onStopGeneration : () => onFixErrors(node.id)}
                disabled={isStopping || (!isLoading && (!isInputConnected && !node.value.trim()))}
                className={`w-full px-4 py-2 font-bold text-white rounded-md transition-colors duration-200 ${isStopping ? 'bg-yellow-600' : (isLoading ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500 disabled:cursor-not-allowed')}`}
            >
                {isStopping ? t('node.action.stopping') : (isLoading ? t('node.action.stop') : t('node.content.fixErrors'))}
            </button>
        </div>
    );
};

export default ErrorAnalyzerNode;
