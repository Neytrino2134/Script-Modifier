import React from 'react';
import type { NodeContentProps } from '../../types';

const DataReaderNode: React.FC<NodeContentProps> = ({ node, onReadData, isReadingData, isStopping, onStopGeneration, t, deselectAllNodes }) => {
    const isLoading = isReadingData === node.id;
    return (
        <div className="flex flex-col h-full">
            <textarea
                readOnly
                value={node.value}
                placeholder={t('node.content.dataPlaceholder')}
                className="w-full flex-grow p-2 bg-gray-700 border-none rounded-md resize-none focus:outline-none custom-scrollbar overflow-y-scroll"
                onWheel={e => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={deselectAllNodes}
            />
            <button
                onClick={isLoading ? onStopGeneration : () => onReadData(node.id)}
                disabled={isStopping}
                title={t('node.action.readData')}
                className={`w-full mt-2 px-4 py-2 font-bold text-white rounded-md transition-colors duration-200 ${isStopping ? 'bg-yellow-600' : (isLoading ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500')}`}
            >
                {isStopping ? t('node.action.stopping') : (isLoading ? t('node.content.reading') : t('node.content.readData'))}
            </button>
        </div>
    );
};


export default DataReaderNode;