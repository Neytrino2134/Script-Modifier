
import React, { useMemo } from 'react';
import type { NodeContentProps } from '../../types';
import { supportedLanguages } from '../../localization';

const TranslatorNode: React.FC<NodeContentProps> = ({ node, onValueChange, onTranslate, isTranslating, isStopping, onStopGeneration, connectedInputs, t, deselectAllNodes }) => {
    const isLoading = isTranslating === node.id;

    const parsedValue = useMemo(() => {
        try {
            const parsed = JSON.parse(node.value || '{}');
            return { 
                inputText: parsed.inputText || '', 
                targetLanguage: parsed.targetLanguage || 'ru', 
                translatedText: parsed.translatedText || '' 
            };
        } catch {
            return { inputText: '', targetLanguage: 'ru', translatedText: '' };
        }
    }, [node.value]);

    const { inputText, targetLanguage, translatedText } = parsedValue;
    const isInputConnected = connectedInputs?.has(undefined);

    const handleValueUpdate = (updates: Partial<typeof parsedValue>) => {
        const newValue = { ...parsedValue, ...updates };
        delete (newValue as any).inputHeight;
        onValueChange(node.id, JSON.stringify(newValue));
    };

    return (
        <div className="flex flex-col h-full space-y-2">
             <div className="flex-shrink-0 flex items-end space-x-2">
                <div className="flex-grow">
                    <label htmlFor={`lang-select-${node.id}`} className="block text-xs font-medium text-gray-400 mb-1">
                        {t('node.content.targetLanguage')}
                    </label>
                    <select
                        id={`lang-select-${node.id}`}
                        value={targetLanguage}
                        onChange={(e) => handleValueUpdate({ targetLanguage: e.target.value })}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={isLoading}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50 h-10"
                    >
                        {supportedLanguages.map((lang) => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={isLoading ? onStopGeneration : () => onTranslate(node.id)}
                    disabled={isStopping || (!isLoading && (!isInputConnected && !inputText.trim()))}
                    className={`px-4 py-2 h-10 font-bold text-white rounded-md transition-colors duration-200 flex-shrink-0 ${isStopping ? 'bg-yellow-600' : (isLoading ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500 disabled:cursor-not-allowed')}`}
                >
                    {isStopping ? t('node.action.stopping') : (isLoading ? t('node.action.stop') : t('node.content.translate'))}
                </button>
            </div>

            <textarea
                value={inputText}
                onChange={(e) => handleValueUpdate({ inputText: e.target.value })}
                placeholder={isInputConnected ? t('node.content.connectedPlaceholder') : t('node.content.translatePlaceholder')}
                className="w-full flex-1 p-2 bg-gray-700 border border-transparent rounded-md resize-none focus:border-emerald-500 focus:ring-0 focus:outline-none disabled:bg-gray-800 disabled:text-gray-500 min-h-[60px] custom-scrollbar overflow-y-scroll"
                onWheel={e => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={isInputConnected || isLoading}
                onFocus={deselectAllNodes}
            />
            
            <textarea
                readOnly
                value={translatedText}
                placeholder={t('node.content.translatedTextPlaceholder')}
                className="w-full flex-1 p-2 bg-gray-700 border-none rounded-md resize-none focus:outline-none custom-scrollbar overflow-y-scroll min-h-[60px]"
                onWheel={e => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={deselectAllNodes}
            />
        </div>
    );
};

export default TranslatorNode;
