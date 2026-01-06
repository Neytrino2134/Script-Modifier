
import React, { useMemo } from 'react';
import type { NodeContentProps } from '../../types';
import { ideaThemesRu, ideaThemesEn } from '../../utils/themes';
import { ActionButton } from '../ActionButton';
import CustomSelect from '../ui/CustomSelect';

const IdeaGeneratorNode: React.FC<NodeContentProps> = ({ 
    node, 
    onValueChange, 
    t, 
    onGenerateIdeaCategories, 
    isGeneratingIdeaCategories, 
    onCombineStoryIdea, 
    isCombiningStoryIdea,
    addToast
}) => {
    const isLoading = isGeneratingIdeaCategories || isCombiningStoryIdea;

    const parsedValue = useMemo(() => {
        try {
            const parsed = JSON.parse(node.value || '{}');
            return {
                stage: parsed.stage || 'initial',
                theme: parsed.theme || '',
                categories: parsed.categories || null,
                selection: parsed.selection || { action: null, place: null, obstacle: null },
                generatedIdea: parsed.generatedIdea || '',
                targetLanguage: parsed.targetLanguage || 'ru',
                format: parsed.format || 'childrens',
            };
        } catch {
            return { stage: 'initial', theme: '', categories: null, selection: { action: null, place: null, obstacle: null }, generatedIdea: '', targetLanguage: 'ru', format: 'childrens' };
        }
    }, [node.value]);

    const { stage, theme, categories, selection, generatedIdea, targetLanguage, format } = parsedValue;

    const formatOptions = useMemo(() => [
        { value: 'childrens', label: t('idea_generator.format.childrens') },
        { value: 'adventure', label: t('idea_generator.format.adventure') },
        { value: 'fantasy', label: t('idea_generator.format.fantasy') },
        { value: 'detective', label: t('idea_generator.format.detective') },
        { value: 'scifi', label: t('idea_generator.format.scifi') },
        { value: 'horror', label: t('idea_generator.format.horror') },
        { value: 'historical', label: t('idea_generator.format.historical') },
        { value: 'general', label: t('idea_generator.format.general') },
    ], [t]);

    const handleValueUpdate = (updates: any) => {
        onValueChange(node.id, JSON.stringify({ ...parsedValue, ...updates }));
    };
    
    const handleSelection = (category: 'action' | 'place' | 'obstacle', value: string) => {
        handleValueUpdate({
            selection: {
                ...selection,
                [category]: selection[category] === value ? null : value,
            }
        });
    };

    const handleRandomTheme = () => {
        const themes = targetLanguage === 'ru' ? ideaThemesRu : ideaThemesEn;
        const randomIndex = Math.floor(Math.random() * themes.length);
        handleValueUpdate({ theme: themes[randomIndex] });
    };

    const handleRandomCombination = () => {
        if (!categories) return;
        const randomAction = categories.action[Math.floor(Math.random() * categories.action.length)];
        const randomPlace = categories.place[Math.floor(Math.random() * categories.place.length)];
        const randomObstacle = categories.obstacle[Math.floor(Math.random() * categories.obstacle.length)];
        handleValueUpdate({
            selection: {
                action: randomAction,
                place: randomPlace,
                obstacle: randomObstacle,
            }
        });
    };

    const canGenerateIdea = selection.action && selection.place && selection.obstacle;

    const renderCategories = () => {
        if (!categories) return null;
        return (
            <div className="flex flex-row space-x-2 h-full">
                {(['action', 'place', 'obstacle'] as const).map(catKey => (
                    <div key={catKey} className="flex flex-col w-1/3 bg-gray-900/50 p-2 rounded-md">
                        <h4 className="font-semibold text-emerald-400 mb-2 capitalize flex-shrink-0">{t(`node.content.category.${catKey}`)}</h4>
                        <div className="overflow-y-auto custom-scrollbar -mr-2 pr-2 p-1">
                            <div className="flex flex-col items-start gap-2">
                                {(categories[catKey] || []).map((item: string, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelection(catKey, item)}
                                        disabled={isLoading}
                                        className={`w-full text-left px-3 py-1 text-sm rounded-md transition-colors ${
                                            selection[catKey] === item
                                                ? 'bg-emerald-600 text-white font-semibold ring-2 ring-emerald-400'
                                                : 'bg-gray-800 hover:bg-gray-600 text-gray-200 disabled:bg-gray-800/50 disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full space-y-2" onWheel={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex items-end space-x-2">
                <div className="flex-grow space-y-1">
                    <label htmlFor={`theme-input-${node.id}`} className="text-xs font-medium text-gray-400 block mb-1">{t('node.content.theme')}</label>
                    <div className="relative">
                        <textarea
                            id={`theme-input-${node.id}`}
                            value={theme}
                            onChange={(e) => handleValueUpdate({ theme: e.target.value })}
                            disabled={isLoading}
                            placeholder={t('idea_generator.themePlaceholder')}
                            rows={1}
                            className="w-full pl-2 pr-8 py-2 text-sm bg-gray-700 border-none rounded-md resize-none focus:ring-1 focus:ring-emerald-500 focus:outline-none custom-scrollbar h-9 leading-tight"
                        />
                        <button
                            onClick={handleRandomTheme}
                            disabled={isLoading}
                            title={t('idea_generator.randomTheme')}
                            className="absolute top-1/2 right-1 -translate-y-1/2 p-1 text-gray-400 rounded-full hover:bg-gray-600 hover:text-white disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m-5.223 2.152A9 9 0 0119.77 8.227M20 20v-5h-5m5.223-2.152A9 9 0 014.23 15.773" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="w-48 flex-shrink-0 space-y-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('node.content.storyFormat')}</label>
                    <CustomSelect 
                        value={format}
                        onChange={(val) => handleValueUpdate({ format: val })}
                        options={formatOptions}
                        disabled={isLoading}
                        id={`format-select-${node.id}`}
                    />
                </div>
            </div>

            <div className="flex-shrink-0 flex items-center space-x-2">
                <div className="flex w-24 flex-shrink-0 bg-gray-700 rounded-md overflow-hidden h-10">
                    <button 
                        onClick={() => handleValueUpdate({ targetLanguage: 'ru' })} 
                        className={`flex-1 py-1.5 text-xs font-bold text-center transition-colors ${targetLanguage === 'ru' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-300 hover:text-white'}`}
                    >
                        RU
                    </button>
                    <div className="w-px bg-gray-600"></div>
                    <button 
                        onClick={() => handleValueUpdate({ targetLanguage: 'en' })} 
                        className={`flex-1 py-1.5 text-xs font-bold text-center transition-colors ${targetLanguage === 'en' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-300 hover:text-white'}`}
                    >
                        EN
                    </button>
                </div>
                <button
                    onClick={() => onGenerateIdeaCategories(node.id)}
                    disabled={isLoading}
                    className="flex-grow h-10 px-4 py-2 font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-gray-500/50 transition-colors"
                >
                    {isGeneratingIdeaCategories ? t('node.content.generating') : (stage === 'initial' ? t('node.content.requestCategories') : t('node.content.requestNewCategories'))}
                </button>
            </div>

            <div className="flex-grow min-h-0">
                {stage === 'initial' ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-center p-4 bg-gray-900/50 rounded-md">
                        <p>{t('idea_generator.initialMessage', { buttonName: t('node.content.requestCategories') })}</p>
                    </div>
                ) : renderCategories()}
            </div>
            
            <div className="flex-shrink-0 space-y-2">
                <div className="bg-gray-900/50 p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-400">{t('node.content.generatedIdea')}</label>
                        <ActionButton title={t('node.action.copy')} onClick={() => {
                            if (generatedIdea) {
                                navigator.clipboard.writeText(generatedIdea);
                                addToast(t('toast.copied'), 'success');
                            }
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </ActionButton>
                    </div>
                    <textarea
                        value={generatedIdea}
                        onChange={(e) => handleValueUpdate({ generatedIdea: e.target.value })}
                        placeholder={t('idea_generator.ideaPlaceholder')}
                        className="w-full text-sm p-2 bg-gray-800 border-none rounded-md resize-none focus:outline-none custom-scrollbar overflow-y-scroll"
                        rows={3}
                        onWheel={e => e.stopPropagation()}
                    />
                </div>
                
                <div className="flex space-x-2">
                    <button
                        onClick={handleRandomCombination}
                        disabled={isLoading || !categories}
                        title={t('idea_generator.randomCombination')}
                        className="h-10 px-4 py-2 font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m-5.223 2.152A9 9 0 0119.77 8.227M20 20v-5h-5m5.223-2.152A9 9 0 014.23 15.773" />
                       </svg>
                    </button>
                    <button
                        onClick={() => onCombineStoryIdea(node.id)}
                        disabled={isLoading || !canGenerateIdea}
                        className="w-full px-4 py-2 font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isCombiningStoryIdea ? t('node.content.generating') : t('node.content.generateIdea')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IdeaGeneratorNode;
