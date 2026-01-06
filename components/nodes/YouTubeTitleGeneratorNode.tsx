
import React, { useMemo } from 'react';
import type { NodeContentProps } from '../../types'; 
import { ActionButton } from '../ActionButton'; 
import { SettingsPanel } from './youtube-title-generator/SettingsPanel';

const LANGUAGES = [
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'fr', label: 'FR' },
    { code: 'de', label: 'DE' },
    { code: 'it', label: 'IT' },
    { code: 'pt', label: 'PT' },
    { code: 'zh', label: 'ZH' },
    { code: 'ja', label: 'JA' },
    { code: 'ko', label: 'KO' },
];

const LANGUAGE_NAMES: Record<string, string> = {
    ru: 'Русский', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch',
    it: 'Italiano', pt: 'Português', zh: '中文', ja: '日本語', ko: '한국어'
};

const YouTubeTitleGeneratorNode: React.FC<NodeContentProps> = ({ 
    node, 
    onValueChange, 
    t, 
    deselectAllNodes, 
    connectedInputs,
    onGenerateYouTubeTitles,
    isGeneratingYouTubeTitles,
    onGenerateYouTubeChannelInfo,
    isGeneratingYouTubeChannelInfo,
    isStopping,
    onStopGeneration,
    addToast
}) => {
    const isLoading = isGeneratingYouTubeTitles || isGeneratingYouTubeChannelInfo;
    const isInputConnected = connectedInputs?.has(undefined);

    const parsedValue = useMemo(() => {
        try {
            const parsed = JSON.parse(node.value || '{}');
            const targetLanguages = parsed.targetLanguages || { ru: true, en: false };
            const languageSelectionOrder = parsed.languageSelectionOrder || Object.keys(targetLanguages).filter(k => targetLanguages[k]);

            return {
                mode: parsed.mode || 'title',
                idea: parsed.idea || '',
                targetLanguages,
                generatedTitleOutputs: parsed.generatedTitleOutputs || {},
                generatedChannelOutputs: parsed.generatedChannelOutputs || {},
                languageSelectionOrder,
                uiState: parsed.uiState || { isSettingsCollapsed: true }
            };
        } catch {
            return { 
                mode: 'title', 
                idea: '', 
                targetLanguages: { ru: true, en: false }, 
                generatedTitleOutputs: {}, 
                generatedChannelOutputs: {},
                languageSelectionOrder: ['ru'],
                uiState: { isSettingsCollapsed: true }
            };
        }
    }, [node.value]);

    const { mode, idea, targetLanguages, generatedTitleOutputs, generatedChannelOutputs, languageSelectionOrder, uiState } = parsedValue;

    const handleValueUpdate = (updates: Partial<typeof parsedValue>) => {
        onValueChange(node.id, JSON.stringify({ ...parsedValue, ...updates }));
    };
    
    const handleUiStateUpdate = (updates: any) => {
        handleValueUpdate({ uiState: { ...uiState, ...updates } });
    };

    const handleLangChange = (lang: string) => {
        const isSelected = !!targetLanguages[lang];
        let newTargetLanguages = { ...targetLanguages };
        let newOrder = [...(languageSelectionOrder || [])];

        if (isSelected) {
            newTargetLanguages[lang] = false;
            newOrder = newOrder.filter(l => l !== lang);
        } else {
             // If we are adding a new language and hit the limit (2), remove the oldest one
             while (newOrder.length >= 2) {
                const removed = newOrder.shift();
                if (removed) newTargetLanguages[removed] = false;
            }
            newTargetLanguages[lang] = true;
            newOrder.push(lang);
        }

        handleValueUpdate({
            targetLanguages: newTargetLanguages,
            languageSelectionOrder: newOrder
        });
    };
    
    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        addToast(t('toast.copied'), 'success');
    };

    const handleGenerate = () => {
        if (mode === 'title' && onGenerateYouTubeTitles) {
            onGenerateYouTubeTitles(node.id);
        } else if (onGenerateYouTubeChannelInfo) {
            onGenerateYouTubeChannelInfo(node.id);
        }
    };

    const selectedLangs = Object.entries(targetLanguages).filter(([, selected]) => selected).map(([lang]) => lang);

    const renderOutputColumn = (lang: string) => {
        const isTitleMode = mode === 'title';
        const data = isTitleMode ? (generatedTitleOutputs[lang] || {}) : (generatedChannelOutputs[lang] || {});
        const langName = LANGUAGE_NAMES[lang] || lang.toUpperCase();

        const fields = isTitleMode
            ? [
                { key: 'title', label: t('youtube_title_generator.title') },
                { key: 'description', label: t('youtube_title_generator.description') },
                { key: 'tags', label: t('youtube_title_generator.tags') },
              ]
            : [
                { key: 'channelName', label: t('youtube_title_generator.channelName') },
                { key: 'channelDescription', label: t('youtube_title_generator.channelDescription') },
                { key: 'channelKeywords', label: t('youtube_title_generator.channelKeywords') },
                { key: 'channelHandle', label: t('youtube_title_generator.channelHandle') },
              ];

        return (
            <div key={lang} className="flex flex-col flex-1 min-h-0 space-y-2">
                <h4 className="font-semibold text-gray-300 text-sm">{langName}</h4>
                {fields.map(field => (
                    <div key={field.key} className="flex flex-col flex-1 min-h-0">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-gray-400">{field.label}</label>
                            <ActionButton title={t('node.action.copy')} onClick={() => handleCopy(data[field.key] || '')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </ActionButton>
                        </div>
                        <textarea 
                            readOnly 
                            value={data[field.key] || ''} 
                            className="w-full flex-grow p-2 bg-gray-900/50 rounded-md resize-none custom-scrollbar focus:border-emerald-500 focus:ring-0 focus:outline-none border border-transparent" 
                            onMouseDown={(e) => e.stopPropagation()}
                            onFocus={deselectAllNodes}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full space-y-2" onWheel={e => e.stopPropagation()}>
            <textarea
                value={idea}
                onChange={(e) => handleValueUpdate({ idea: e.target.value })}
                placeholder={isInputConnected ? t('node.content.connectedPlaceholder') : (mode === 'title' ? t('youtube_title_generator.ideaPlaceholder') : t('youtube_title_generator.channelIdeaPlaceholder'))}
                disabled={isInputConnected || isLoading}
                className="w-full p-2 bg-gray-700 border border-transparent rounded-md resize-y focus:border-emerald-500 focus:ring-0 focus:outline-none disabled:bg-gray-800 disabled:text-gray-500 custom-scrollbar min-h-[60px] max-h-[120px]"
                rows={2}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={deselectAllNodes}
            />
            
            <div className="flex-shrink-0 flex items-center space-x-2">
                <div className="flex items-center bg-gray-700 rounded-md p-1 space-x-1 h-10">
                    <button onClick={() => handleValueUpdate({ mode: 'title' })} className={`px-2 py-1 rounded text-xs font-semibold h-full ${mode === 'title' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>{t('youtube_title_generator.mode.title')}</button>
                    <button onClick={() => handleValueUpdate({ mode: 'channel' })} className={`px-2 py-1 rounded text-xs font-semibold h-full ${mode === 'channel' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>{t('youtube_title_generator.mode.channel')}</button>
                </div>
                <button
                    onClick={isLoading ? onStopGeneration : handleGenerate}
                    disabled={isStopping || (!isLoading && !idea.trim() && !isInputConnected)}
                    className={`flex-grow flex-shrink-0 h-10 px-4 py-2 font-bold text-white rounded-md transition-colors duration-200 ${isStopping ? 'bg-yellow-600' : (isLoading ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500')}`}
                >
                    {isStopping ? t('node.action.stopping') : (isLoading ? t('node.content.generating') : t('node.content.generateText'))}
                </button>
            </div>
            
            <SettingsPanel
                uiState={uiState}
                onUpdateUiState={handleUiStateUpdate}
                mode={mode as 'title' | 'channel'}
                t={t}
            />

             {/* Language Selector Group */}
             <div className="flex-shrink-0 bg-gray-700/50 p-1 rounded-md border border-gray-600/30">
                <div className="flex flex-wrap gap-1">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLangChange(lang.code)}
                            className={`flex-1 min-w-[30px] py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                                targetLanguages[lang.code] 
                                    ? 'bg-emerald-600 text-white shadow-sm' 
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-600 hover:text-gray-200'
                            }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-row flex-grow min-h-0 space-x-2">
                {selectedLangs.map(lang => renderOutputColumn(lang))}
            </div>
        </div>
    );
};

export default YouTubeTitleGeneratorNode;
