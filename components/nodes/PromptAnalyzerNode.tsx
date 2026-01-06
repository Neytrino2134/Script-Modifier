
import React, { useMemo } from 'react';
import type { NodeContentProps } from '../../types';

const PromptAnalyzerNode: React.FC<NodeContentProps> = ({ node, onValueChange, onAnalyze, isAnalyzing, isStopping, onStopGeneration, t, deselectAllNodes }) => {
    const parsedValue = useMemo(() => {
        try {
            const parsed = JSON.parse(node.value || '{}');
            if (!Array.isArray(parsed.characters)) parsed.characters = [];
            return {
                environment: parsed.environment || '',
                characters: parsed.characters || [],
                action: parsed.action || '',
                style: parsed.style || '',
                targetLanguage: parsed.targetLanguage || 'ru'
            };
        } catch {
            return { environment: '', characters: [], action: '', style: '', targetLanguage: 'ru' };
        }
    }, [node.value]);

    const { environment, characters, action, style, targetLanguage } = parsedValue;
    const characterCount = Math.max(1, characters.length);

    const handleValueUpdate = (updates: Partial<typeof parsedValue>) => {
        const newValue = { ...parsedValue, ...updates };
        onValueChange(node.id, JSON.stringify(newValue));
    };

    const handleCharacterChange = (index: number, value: string) => {
        const newCharacters = [...(characters || [])];
        newCharacters[index] = value;
        handleValueUpdate({ characters: newCharacters });
    };
    
    const handleFieldChange = (field: 'environment' | 'action' | 'style', value: string) => {
        handleValueUpdate({ [field]: value });
    };

    const allFields = [
        { key: 'environment', value: environment, handler: (val: string) => handleFieldChange('environment', val), placeholder: 'node.content.environmentPlaceholder' },
        ...Array.from({ length: characterCount }).map((_, i) => ({
            key: `character-${i}`,
            value: characters[i] || '',
            handler: (val: string) => handleCharacterChange(i, val),
            placeholder: 'node.content.characterPlaceholder'
        })),
        { key: 'action', value: action, handler: (val: string) => handleFieldChange('action', val), placeholder: 'node.content.actionPlaceholder' },
        { key: 'style', value: style, handler: (val: string) => handleFieldChange('style', val), placeholder: 'node.content.stylePlaceholder' },
    ];

    return (
        <div className="flex flex-col h-full space-y-2">
            <div className="flex-grow flex flex-col space-y-2 min-h-0" onWheel={e => e.stopPropagation()}>
                {allFields.map(field => (
                    <div key={field.key} className="flex flex-col flex-1 min-h-0">
                        <label className="text-xs font-medium text-gray-400 mb-1">
                            {field.key.startsWith('character-') ? `${t('node.content.character')} ${parseInt(field.key.split('-')[1], 10) + 1}` : t(`node.content.${field.key}`)}
                        </label>
                        <textarea
                            value={field.value}
                            onChange={e => field.handler(e.target.value)}
                            placeholder={t(field.placeholder)}
                            className="w-full flex-grow p-2 bg-gray-700 border border-transparent rounded-md resize-y focus:border-emerald-500 focus:ring-0 focus:outline-none custom-scrollbar overflow-y-scroll"
                            onMouseDown={e => e.stopPropagation()}
                            onFocus={deselectAllNodes}
                        />
                    </div>
                ))}
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={isAnalyzing ? onStopGeneration : () => onAnalyze(node.id)}
                    disabled={isStopping}
                    className={`flex-grow px-4 py-2 font-bold text-white rounded-md transition-colors duration-200 flex-shrink-0 ${isStopping ? 'bg-yellow-600' : (isAnalyzing ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500')}`}
                >
                    {isStopping ? t('node.action.stopping') : (isAnalyzing ? t('node.action.stop') : t('node.content.analyzePrompt'))}
                </button>
                <div className="flex items-center bg-gray-700 rounded-md p-1 space-x-1">
                    <button onClick={() => handleValueUpdate({ targetLanguage: 'ru' })} className={`px-2 py-1 rounded text-xs font-semibold transition-colors w-10 ${targetLanguage === 'ru' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>RU</button>
                    <button onClick={() => handleValueUpdate({ targetLanguage: 'en' })} className={`px-2 py-1 rounded text-xs font-semibold transition-colors w-10 ${targetLanguage === 'en' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>EN</button>
                </div>
            </div>
        </div>
    );
};

export default PromptAnalyzerNode;
