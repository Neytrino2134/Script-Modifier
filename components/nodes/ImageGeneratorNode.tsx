
import React, { useMemo } from 'react';
import type { NodeContentProps } from '../../types';

const ImageGeneratorNode: React.FC<NodeContentProps> = ({
    node, onValueChange, onGenerateImage, isGeneratingImage, isStopping, onStopGeneration, t, deselectAllNodes, connectedInputs
}) => {
    const isLoading = isGeneratingImage === node.id;
    const isInputConnected = connectedInputs?.has(undefined);

    const parsedValue = useMemo(() => {
        try {
            return JSON.parse(node.value || '{}');
        } catch {
            return { prompt: '', imageBase64: '' };
        }
    }, [node.value]);

    const { prompt, imageBase64 } = parsedValue;

    const handleValueUpdate = (updates: Partial<typeof parsedValue>) => {
        const newValue = { ...parsedValue, ...updates };
        onValueChange(node.id, JSON.stringify(newValue));
    };

    return (
        <div className="flex flex-col h-full">
            <textarea
                value={prompt}
                onChange={(e) => handleValueUpdate({ prompt: e.target.value })}
                placeholder={isInputConnected ? t('node.content.connectedPlaceholder') : t('node.content.imagePromptPlaceholder')}
                disabled={isInputConnected || isLoading}
                className="w-full p-2 bg-gray-700 border border-transparent rounded-md resize-none focus:border-emerald-500 focus:ring-0 focus:outline-none disabled:bg-gray-800 disabled:text-gray-500 custom-scrollbar overflow-y-scroll"
                rows={4}
                onWheel={e => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={deselectAllNodes}
            />
            <button
                onClick={isLoading ? onStopGeneration : () => onGenerateImage(node.id)}
                disabled={isStopping || (!isLoading && (!isInputConnected && !prompt.trim()))}
                className={`w-full px-4 py-2 mt-2 font-bold text-white rounded-md transition-colors duration-200 ${isStopping ? 'bg-yellow-600' : (isLoading ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500 disabled:cursor-not-allowed')}`}
            >
                {isStopping ? t('node.action.stopping') : (isLoading ? t('node.action.stop') : t('node.content.generateImage'))}
            </button>
            <div className="flex-grow mt-2 bg-gray-900/50 rounded-md flex items-center justify-center overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    </div>
                ) : imageBase64 ? (
                    <img src={`data:image/png;base64,${imageBase64}`} alt="Generated" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center text-gray-500 p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-sm">{t('node.content.imagePromptPlaceholder')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageGeneratorNode;
