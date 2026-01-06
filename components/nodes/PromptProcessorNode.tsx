
import React from 'react';
import type { NodeContentProps } from '../../types';

const PromptProcessorNode: React.FC<NodeContentProps> = ({ node, onEnhance, isEnhancing, onProcessChainForward, isExecutingChain, isStopping, onStopGeneration, t, deselectAllNodes }) => (
    <div className="flex flex-col h-full">
        <textarea
            readOnly
            value={node.value}
            placeholder={t('node.content.enhancedPromptHere')}
            className="w-full flex-grow p-2 bg-gray-700 border border-transparent rounded-md resize-none focus:outline-none mb-2 custom-scrollbar overflow-y-scroll"
            onWheel={e => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onFocus={deselectAllNodes}
        />
        <div className="flex space-x-2">
            <button
                onClick={isEnhancing ? onStopGeneration : () => onEnhance(node.id)}
                disabled={isExecutingChain || isStopping}
                className={`w-1/2 px-4 py-2 font-bold text-white rounded-md transition-colors duration-200 ${isStopping && isEnhancing ? 'bg-yellow-600' : (isEnhancing ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500')}`}
            >
                {isStopping && isEnhancing ? t('node.action.stopping') : (isEnhancing ? t('node.action.stop') : t('node.content.enhancePrompt'))}
            </button>
            <button
                onClick={isExecutingChain ? onStopGeneration : () => onProcessChainForward(node.id)}
                disabled={isEnhancing || isStopping}
                className={`w-1/2 px-4 py-2 font-bold text-white rounded-md transition-colors duration-200 flex items-center justify-center space-x-2 ${isStopping && isExecutingChain ? 'bg-yellow-600' : (isExecutingChain ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500')}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                <span>{isStopping && isExecutingChain ? t('node.action.stopping') : (isExecutingChain ? t('node.action.stop') : t('node.action.processChainForward'))}</span>
            </button>
        </div>
    </div>
);

export default PromptProcessorNode;
