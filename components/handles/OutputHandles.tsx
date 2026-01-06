
import React from 'react';
import type { Node } from '../../types';
import { NodeType } from '../../types';
import { getOutputHandleType } from '../../utils/nodeUtils';
import EdgeHandle from './EdgeHandle';
import type { OutputHandleProps } from './types';
import { getScriptGeneratorHandlePositions } from './handleLayouts';

const HEADER_HEIGHT = 40;
const CONTENT_PADDING = 12;
const HANDLE_VERTICAL_PADDING = 10;

export const OutputHandles: React.FC<OutputHandleProps> = ({ node, getHandleColor, handleCursor, onOutputHandleMouseDown, onOutputHandleTouchStart, isCollapsed, t }) => {
    if (node.areOutputHandlesHidden) return null;

    let handles: { handleId?: string; type: 'text' | 'image' | null; title: string }[] = [];
    const fromType = getOutputHandleType(node, undefined);

    if (isCollapsed) {
        if (node.type === NodeType.PROMPT_ANALYZER) {
            let localCharacters: string[] = [];
            try {
                localCharacters = JSON.parse(node.value || '{}').characters || [];
            } catch {}
            const handleIds = ['environment', ...Array.from({ length: Math.max(1, localCharacters.length) }, (_, i) => `character-${i}`), 'action', 'style'];
            handles = handleIds.map(id => ({ handleId: id, type: 'text', title: id.replace('-', ' ') }));
        } else if (node.type === NodeType.CHARACTER_ANALYZER) {
            handles = [{ handleId: 'character', type: 'text', title: 'Character' }, { handleId: 'clothing', type: 'text', title: 'Clothing' }];
        } else if (node.type === NodeType.SCRIPT_GENERATOR) {
            handles.push({ handleId: 'all-script-parts', type: 'text', title: t('node.content.allScriptParts') });
            let scriptData: any = {};
            try { scriptData = JSON.parse(node.value || '{}'); } catch {}
            const scenes = scriptData.scenes || [];
            const hasNarratorText = scenes.some((s: any) => s.narratorText && s.narratorText.trim() !== '');
            if (hasNarratorText) {
                handles.push({ handleId: 'all-narrator-text', type: 'text', title: t('node.content.allNarratorData') });
            }
        } else if (node.type === NodeType.CHARACTER_CARD) {
            handles = [
                { handleId: 'all-characters', type: 'text', title: t('node.output.allCharacters') },
                { handleId: 'primary-character', type: 'text', title: t('node.output.primaryCharacter') }
            ];
        } else if (fromType !== null || node.type === NodeType.REROUTE_DOT) {
            handles = [{ handleId: undefined, type: fromType, title: t('node.output.default') }];
        }

        return (
            <>
                {handles.map((handle, index) => (
                     <EdgeHandle
                        key={handle.handleId || `output-${index}`}
                        id={`handle-out-${node.id}-${handle.handleId || 'default'}`}
                        title={handle.title}
                        color={getHandleColor(handle.type, handle.handleId)}
                        handleCursor={handleCursor}
                        position="right"
                        style={{ top: `${(index + 1) * (HEADER_HEIGHT / (handles.length + 1))}px`, transform: 'translateY(-50%)' }}
                        onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, handle.handleId); }}
                        onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, handle.handleId); }}
                    />
                ))}
            </>
        );
    }
    
    // Expanded state
    switch (node.type) {
        case NodeType.PROMPT_ANALYZER:
            let localCharacters: string[] = [];
            try {
                localCharacters = JSON.parse(node.value || '{}').characters || [];
            } catch {}
            const characterHandleCount = Math.max(1, localCharacters.length);
            const totalPanes = 3 + characterHandleCount;
            const handleIds = ['environment', ...Array.from({ length: characterHandleCount }, (_, i) => `character-${i}`), 'action', 'style'];
            
            const BUTTON_HEIGHT = 40;
            const BUTTON_MARGIN_TOP = 8;
            const contentAreaTop = HEADER_HEIGHT + CONTENT_PADDING;
            const contentAreaBottom = node.height - CONTENT_PADDING - BUTTON_HEIGHT - BUTTON_MARGIN_TOP;
            const textAreasContainerHeight = contentAreaBottom - contentAreaTop;

            return (
                <>
                    {handleIds.map((id, index) => {
                        const idealHandleY = contentAreaTop + (textAreasContainerHeight / totalPanes) * (index + 0.5);
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(idealHandleY, node.height - HANDLE_VERTICAL_PADDING));
                        return (
                            <EdgeHandle
                                key={id}
                                id={`handle-out-${node.id}-${id}`}
                                title={id.replace('-', ' ')}
                                color={getHandleColor('text', id)}
                                handleCursor={handleCursor}
                                position="right"
                                style={{ top: `${clampedY}px`, transform: 'translateY(-50%)' }}
                                onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, id); }}
                                onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, id); }}
                            />
                        );
                    })}
                </>
            );
        case NodeType.CHARACTER_ANALYZER:
             const charHandleIds = ['character', 'clothing'];
             const charTotalPanes = 2;
             const charButtonHeight = 40;
             const charButtonMarginTop = 8;
             const charContentAreaTop = HEADER_HEIGHT + CONTENT_PADDING;
             const charContentAreaBottom = node.height - CONTENT_PADDING - charButtonHeight - charButtonMarginTop;
             const charTextAreasContainerHeight = charContentAreaBottom - charContentAreaTop;

            return (
                <>
                    {charHandleIds.map((id, index) => {
                        const idealHandleY = charContentAreaTop + (charTextAreasContainerHeight / charTotalPanes) * (index + 0.5);
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(idealHandleY, node.height - HANDLE_VERTICAL_PADDING));
                        return (
                             <EdgeHandle
                                key={id}
                                id={`handle-out-${node.id}-${id}`}
                                title={id}
                                color={getHandleColor('text', id)}
                                handleCursor={handleCursor}
                                position="right"
                                style={{ top: `${clampedY}px`, transform: 'translateY(-50%)' }}
                                onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, id); }}
                                onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, id); }}
                            />
                        );
                    })}
                </>
            );
        case NodeType.CHARACTER_GENERATOR: {
            let charactersFromGen: any[] = [];
            try {
                charactersFromGen = JSON.parse(node.value || '{}').characters || [];
            } catch {}

            const localHandles: { handleId: string; title: string }[] = [];
            
            charactersFromGen.forEach((char: any, index: number) => {
                const handleId = char.id ? `character-${char.id}` : `character-${index}`;
                localHandles.push({ 
                    handleId: handleId, 
                    title: char.name || `${t('node.content.character')} ${index + 1}` 
                });
            });

            const totalHandles = localHandles.length;
            const availableHeight = node.height - HEADER_HEIGHT;

            if (totalHandles === 0) {
                return null;
            }

            return (
                <>
                    {localHandles.map(({ handleId, title }, index) => {
                        const idealHandleY = HEADER_HEIGHT + (availableHeight / (totalHandles + 1)) * (index + 1);
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(idealHandleY, node.height - HANDLE_VERTICAL_PADDING));
                        return (
                            <EdgeHandle
                                key={handleId}
                                id={`handle-out-${node.id}-${handleId}`}
                                title={title}
                                color={getHandleColor('text', handleId)}
                                handleCursor={handleCursor}
                                position="right"
                                style={{ top: `${clampedY}px`, transform: 'translateY(-50%)' }}
                                onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, handleId); }}
                                onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, handleId); }}
                            />
                        );
                    })}
                </>
            );
        }
        case NodeType.SCRIPT_GENERATOR: {
            const positions = getScriptGeneratorHandlePositions(node, t);
            return (
                <>
                    {Array.from(positions.entries()).map(([handleId, { y, title }]) => {
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(y, node.height - HANDLE_VERTICAL_PADDING));
                        return (
                            <EdgeHandle
                                key={handleId}
                                id={`handle-out-${node.id}-${handleId}`}
                                title={title}
                                color={getHandleColor('text', handleId)}
                                handleCursor={handleCursor}
                                position="right"
                                style={{ top: `${clampedY}px`, transform: 'translateY(-50%)' }}
                                onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, handleId); }}
                                onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, handleId); }}
                            />
                        );
                    })}
                </>
            );
        }
        case NodeType.SCRIPT_ANALYZER: {
            let analysisData: { characters: any[], scenes: any[] } = { characters: [], scenes: [] };
            try {
                analysisData = JSON.parse(node.value || '{}');
            } catch {}
            const { characters: analyzedChars = [], scenes = [] } = analysisData;

            const localHandles: { handleId: string; title: string }[] = [];
            localHandles.push({ handleId: 'all-script-analyzer-data', title: t('node.content.allScriptAnalyzerData') });

            const hasNarratorData = scenes.some((s: any) => s.narratorText);
            if (hasNarratorData) {
                localHandles.push({ handleId: 'all-narrator-data', title: t('node.content.allNarratorData') });
            }

            analyzedChars.forEach((char: any, index: number) => {
                const charId = char.id || `char-idx-${index}`;
                localHandles.push({ handleId: `character-${charId}`, title: char.name || `${t('node.content.character')} ${index + 1}` });
            });

            const totalHandles = localHandles.length;
            const availableHeight = node.height - HEADER_HEIGHT;
        
            return (
                <>
                    {localHandles.map(({ handleId, title }, index) => {
                        const idealHandleY = HEADER_HEIGHT + (availableHeight / (totalHandles + 1)) * (index + 1);
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(idealHandleY, node.height - HANDLE_VERTICAL_PADDING));
                        return (
                            <EdgeHandle
                                key={handleId}
                                id={`handle-out-${node.id}-${handleId}`}
                                title={title}
                                color={getHandleColor('text', handleId)}
                                handleCursor={handleCursor}
                                position="right"
                                style={{ top: `${clampedY}px`, transform: 'translateY(-50%)' }}
                                onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, handleId); }}
                                onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, handleId); }}
                            />
                        );
                    })}
                </>
            );
        }
        case NodeType.SCRIPT_PROMPT_MODIFIER: {
            let finalizerData: { finalPrompts: any[] } = { finalPrompts: [] };
            try {
                finalizerData = JSON.parse(node.value || '{}');
            } catch {}
            const { finalPrompts = [] } = finalizerData;

            const localHandles: { handleId: string; title: string }[] = finalPrompts.map((p: any) => ({
                handleId: `final-prompt-${p.frameNumber}`,
                title: `${t('node.content.finalPrompt')} - ${t('node.content.frame')} ${p.frameNumber}`
            }));

            const totalHandles = localHandles.length;
            const availableHeight = node.height - HEADER_HEIGHT;

            if (totalHandles === 0) return null;

            return (
                <>
                    {localHandles.map(({ handleId, title }, index) => {
                        const y = HEADER_HEIGHT + (availableHeight / (totalHandles + 1)) * (index + 1);
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(y, node.height - HANDLE_VERTICAL_PADDING));
                        
                        return (
                            <EdgeHandle
                                key={handleId}
                                id={`handle-out-${node.id}-${handleId}`}
                                title={title}
                                color={getHandleColor('text', handleId)}
                                handleCursor={handleCursor}
                                position="right"
                                style={{ top: `${clampedY}px`, transform: 'translateY(-50%)' }}
                                onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, handleId); }}
                                onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, handleId); }}
                            />
                        );
                    })}
                </>
            );
        }
        case NodeType.NARRATOR_TEXT_GENERATOR: {
            let targetLanguages: { ru?: boolean, en?: boolean } = {};
            try {
                targetLanguages = JSON.parse(node.value || '{}').targetLanguages || {};
            } catch {}
        
            const selectedLangs = Object.entries(targetLanguages)
                .filter(([, selected]) => selected)
                .map(([lang]) => lang);
            
            if (selectedLangs.length === 0) return null;
        
            const totalHandles = selectedLangs.length;
        
            const CONTROLS_HEIGHT = 60;
            const PROMPT_TEXTAREA_HEIGHT = 96;
            const BUTTON_HEIGHT = 40;
            const SPACING = 8;
            
            const topFixedContentHeight = CONTROLS_HEIGHT + SPACING + PROMPT_TEXTAREA_HEIGHT + SPACING + BUTTON_HEIGHT;
            const contentAreaTop = HEADER_HEIGHT + CONTENT_PADDING + topFixedContentHeight + SPACING;
            const contentAreaBottom = node.height - CONTENT_PADDING;
            const availableHeight = contentAreaBottom - contentAreaTop;
            
            if (availableHeight <= 20 * totalHandles) { // Fallback if node is too small
                const fallbackAvailable = node.height - contentAreaTop;
                const fallbackTop = contentAreaTop;
                return (
                     <>
                        {selectedLangs.map((lang, index) => {
                            const y = fallbackTop + (fallbackAvailable / (totalHandles + 1)) * (index + 1);
                            const title = lang === 'ru' ? 'Русский текст' : 'English Text';
                            return (
                                <EdgeHandle
                                    key={lang} id={`handle-out-${node.id}-${lang}`} title={title}
                                    color={getHandleColor('text', lang)} handleCursor={handleCursor} position="right"
                                    style={{ top: `${y}px`, transform: 'translateY(-50%)' }}
                                    onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, lang); }}
                                    onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, lang); }}
                                />
                            );
                        })}
                    </>
                );
            }
        
            return (
                <>
                    {selectedLangs.map((lang, index) => {
                        const idealHandleY = contentAreaTop + (availableHeight / totalHandles) * (index + 0.5);
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(idealHandleY, node.height - HANDLE_VERTICAL_PADDING));
                        const title = lang === 'ru' ? 'Русский текст' : 'English Text';
                        return (
                            <EdgeHandle
                                key={lang}
                                id={`handle-out-${node.id}-${lang}`}
                                title={title}
                                color={getHandleColor('text', lang)}
                                handleCursor={handleCursor}
                                position="right"
                                style={{ top: `${clampedY}px`, transform: 'translateY(-50%)' }}
                                onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, lang); }}
                                onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, lang); }}
                            />
                        );
                    })}
                </>
            );
        }
        case NodeType.YOUTUBE_TITLE_GENERATOR: {
            let targetLanguages: { ru?: boolean, en?: boolean } = {};
            try { targetLanguages = JSON.parse(node.value || '{}').targetLanguages || {}; } catch {}
        
            const selectedLangs = Object.entries(targetLanguages)
                .filter(([, selected]) => selected)
                .map(([lang]) => lang);
            
            if (selectedLangs.length === 0) return null;
        
            const totalHandles = selectedLangs.length;
            const availableHeight = node.height - HEADER_HEIGHT;
        
            return (
                <>
                    {selectedLangs.map((lang, index) => {
                        const idealHandleY = HEADER_HEIGHT + (availableHeight / (totalHandles + 1)) * (index + 1);
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(idealHandleY, node.height - HANDLE_VERTICAL_PADDING));
                        const title = t('youtube_title_generator.title') + (lang === 'ru' ? ' (RU)' : ' (EN)');
                        return (
                            <EdgeHandle
                                key={lang}
                                id={`handle-out-${node.id}-${lang}`}
                                title={title}
                                color={getHandleColor('text', lang)}
                                handleCursor={handleCursor}
                                position="right"
                                style={{ top: `${clampedY}px`, transform: 'translateY(-50%)' }}
                                onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, lang); }}
                                onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, lang); }}
                            />
                        );
                    })}
                </>
            );
        }
        case NodeType.CHARACTER_CARD: {
            const handles = [
                { handleId: 'all-characters', type: 'text', title: t('node.output.allCharacters') },
                { handleId: 'primary-character', type: 'text', title: t('node.output.primaryCharacter') }
            ];

            const availableHeight = node.height - HEADER_HEIGHT;
            const totalHandles = handles.length;

            return (
                <>
                    {handles.map((handle, index) => {
                        const y = HEADER_HEIGHT + (availableHeight / (totalHandles + 1)) * (index + 1);
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(y, node.height - HANDLE_VERTICAL_PADDING));
                        return (
                            <EdgeHandle
                                key={handle.handleId}
                                id={`handle-out-${node.id}-${handle.handleId}`}
                                title={handle.title}
                                color={getHandleColor('text', handle.handleId)}
                                handleCursor={handleCursor}
                                position="right"
                                style={{ top: `${clampedY}px`, transform: 'translateY(-50%)' }}
                                onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, handle.handleId); }}
                                onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, handle.handleId); }}
                            />
                        );
                    })}
                </>
            );
        }
        case NodeType.IMAGE_GENERATOR:
        case NodeType.TEXT_INPUT:
        case NodeType.PROMPT_PROCESSOR:
        case NodeType.TRANSLATOR:
        case NodeType.ERROR_ANALYZER:
        case NodeType.REROUTE_DOT:
        case NodeType.AUDIO_TRANSCRIBER:
        case NodeType.IDEA_GENERATOR:
        case NodeType.MUSIC_IDEA_GENERATOR:
        case NodeType.YOUTUBE_ANALYTICS:
            if (fromType !== null || node.type === NodeType.REROUTE_DOT) {
                return (
                    <EdgeHandle
                        id={`handle-out-${node.id}-default`}
                        title={t('node.output.default')}
                        color={getHandleColor(fromType, undefined)}
                        handleCursor={handleCursor}
                        position="right"
                        style={{ top: '50%', transform: 'translateY(-50%)' }}
                        onMouseDown={(e) => { e.stopPropagation(); onOutputHandleMouseDown(e, node.id, undefined); }}
                        onTouchStart={(e) => { e.stopPropagation(); onOutputHandleTouchStart(e, node.id, undefined); }}
                    />
                );
            }
            return null;

        default: return null;
    }
};

export default OutputHandles;
