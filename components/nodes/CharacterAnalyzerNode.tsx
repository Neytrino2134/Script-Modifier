
import React, { useMemo } from 'react';
import type { NodeContentProps } from '../../types';

const CharacterAnalyzerNode: React.FC<NodeContentProps> = ({ node, onValueChange, onAnalyzeCharacter, isAnalyzingCharacter, isStopping, onStopGeneration, t, deselectAllNodes }) => {
    const parsedValue = useMemo(() => {
        try {
            const parsed = JSON.parse(node.value || '{}');
            return { character: parsed.character || '', clothing: parsed.clothing || '' };
        } catch {
            return { character: '', clothing: '' };
        }
    }, [node.value]);

    const { character = '', clothing = '' } = parsedValue;

    const handleFieldChange = (field: 'character' | 'clothing', value: string) => {
        onValueChange(node.id, JSON.stringify({ ...parsedValue, [field]: value }));
    };

    return (
        <div className="flex flex-col h-full space-y-2">
            <div className="flex-grow flex flex-col space-y-2 min-h-0" onWheel={e => e.stopPropagation()}>
                <div className="flex flex-col flex-1 min-h-0">
                    <label className="text-xs font-medium text-gray-400 mb-1">{t('node.content.character')}</label>
                    <textarea
                        value={character}
                        onChange={e => handleFieldChange('character', e.target.value)}
                        placeholder={t('node.content.characterPlaceholder')}
                        className="w-full flex-grow p-2 bg-gray-700 border border-transparent rounded-md resize-y focus:border-emerald-500 focus:ring-0 focus:outline-none custom-scrollbar overflow-y-scroll"
                        onMouseDown={e => e.stopPropagation()}
                        onFocus={deselectAllNodes}
                    />
                </div>
                <div className="flex flex-col flex-1 min-h-0">
                    <label className="text-xs font-medium text-gray-400 mb-1">{t('node.content.clothing')}</label>
                    <textarea
                        value={clothing}
                        onChange={e => handleFieldChange('clothing', e.target.value)}
                        placeholder={t('node.content.clothingPlaceholder')}
                        className="w-full flex-grow p-2 bg-gray-700 border border-transparent rounded-md resize-y focus:border-emerald-500 focus:ring-0 focus:outline-none custom-scrollbar overflow-y-scroll"
                        onMouseDown={e => e.stopPropagation()}
                        onFocus={deselectAllNodes}
                    />
                </div>
            </div>
            <button
                onClick={isAnalyzingCharacter ? onStopGeneration : () => onAnalyzeCharacter(node.id)}
                disabled={isStopping}
                className={`w-full px-4 py-2 font-bold text-white rounded-md transition-colors duration-200 flex-shrink-0 ${isStopping ? 'bg-yellow-600' : (isAnalyzingCharacter ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700')}`}
            >
                {isStopping ? t('node.action.stopping') : (isAnalyzingCharacter ? t('node.action.stop') : t('node.content.analyzePrompt'))}
            </button>
        </div>
    );
};

export default CharacterAnalyzerNode;
