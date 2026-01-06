
import { useState, useRef, useCallback } from 'react';
import { NodeType } from '../types';
import type { Node, Point } from '../types';

export const getNodeDefaults = (type: NodeType, t: (key: string, options?: { [key: string]: string | number }) => string): Omit<Node, 'id' | 'position'> => {
    const titleKey = `node.title.${type.toLowerCase()}`;
    const title = t(titleKey);

    switch (type) {
        case NodeType.TEXT_INPUT:
            return { type, title, value: '', width: 460, height: 280 };
        case NodeType.PROMPT_PROCESSOR:
            return { type, title, value: '', width: 460, height: 280 };
        case NodeType.PROMPT_ANALYZER:
            return { type, title, value: JSON.stringify({ environment: '', characters: [], action: '', style: '', targetLanguage: 'ru' }), width: 460, height: 1000 };
        case NodeType.CHARACTER_ANALYZER:
            return { type, title, value: JSON.stringify({ character: '', clothing: '' }), width: 460, height: 500 };
        case NodeType.CHARACTER_GENERATOR:
            return { type, title, value: JSON.stringify({ prompt: '', numberOfCharacters: 1, targetLanguage: 'en', characterType: 'simple', style: 'simple', customStyle: '', characters: [] }), width: 680, height: 800 };
        case NodeType.IMAGE_GENERATOR:
            return { type, title, value: JSON.stringify({ prompt: '', imageBase64: '' }), width: 400, height: 520 };
        case NodeType.IMAGE_PREVIEW:
            return { type, title, value: JSON.stringify({ imageBase64: null }), width: 300, height: 340 };
        case NodeType.CHARACTER_CARD:
            return { 
                type, 
                title, 
                value: JSON.stringify([{ 
                    id: `char-card-${Date.now()}`, 
                    name: 'New Entity 1', 
                    index: 'Entity-1', 
                    imageSources: {}, 
                    selectedRatio: '1:1', 
                    prompt: '', 
                    fullDescription: '',
                    additionalPrompt: "Full body character concept on a gray background",
                    targetLanguage: 'en',
                    isOutput: true
                }]), 
                width: 460, 
                height: 1000 
            };
        case NodeType.GEMINI_CHAT:
            return { type, title, value: JSON.stringify({ messages: [], currentInput: '' }), width: 400, height: 640 };
        case NodeType.TRANSLATOR:
            return { type, title, value: JSON.stringify({ inputText: '', targetLanguage: 'ru', translatedText: '', inputHeight: 120 }), width: 380, height: 640 };
        case NodeType.SCRIPT_GENERATOR:
            return { 
                type, 
                title, 
                value: JSON.stringify({ 
                    prompt: '', 
                    targetLanguage: 'en', 
                    characterType: 'simple', 
                    useExistingCharacters: false, 
                    narratorEnabled: true, 
                    narratorMode: 'normal', 
                    summary: '', 
                    detailedCharacters: [], 
                    scenes: [], 
                    isAdvancedMode: false, 
                    numberOfScenes: null, 
                    isDetailedPlot: false, 
                    genre: 'general', 
                    noCharacters: false, 
                    genre2: 'general', 
                    model: 'gemini-3-flash-preview',
                    uiState: {
                        isSettingsCollapsed: true, 
                        isSummaryCollapsed: true, 
                        isStyleCollapsed: true,
                        isCharactersSectionCollapsed: true,
                        isScenesSectionCollapsed: false
                    }
                }), 
                width: 680, 
                height: 800 
            };
        case NodeType.SCRIPT_ANALYZER:
            return { type, title, value: JSON.stringify({ characters: [], frames: [], targetLanguage: 'en', model: 'gemini-3-flash-preview', isAdvancedMode: false, extendedAnalysis: false, generateStartEndFrames: false, batchProcessing: true }), width: 680, height: 800 };
        case NodeType.SCRIPT_PROMPT_MODIFIER:
            return { type, title, value: JSON.stringify({ finalPrompts: [], videoPrompts: [], targetLanguage: 'en', startFrameNumber: null, endFrameNumber: null, styleOverride: '', breakIntoParagraphs: false, copyVideoPrompt: false, generateVideoPrompt: true, model: 'gemini-3-flash-preview', disabledInstructionIds: ['break_paragraphs', 'pm_anthro', 'pm_subscribe', 'rule_saturation'] }), width: 680, height: 800 };
        case NodeType.ERROR_ANALYZER:
            return { type, title, value: '', width: 380, height: 280 };
        case NodeType.NOTE:
            return { type, title, value: '', width: 440, height: 640 };
        case NodeType.SPEECH_SYNTHESIZER:
            return { type, title, value: JSON.stringify({ inputText: '', voice: 'Zephyr', audioFiles: [], startSceneNumber: null, endSceneNumber: null, intonation: 'standard', mode: 'simple', isMultiSpeaker: false, speaker1Name: 'Man', speaker1Voice: 'Zephyr', speaker2Name: 'Woman', speaker2Voice: 'Kore' }), width: 680, height: 800 };
        case NodeType.IDEA_GENERATOR:
            return { type, title, value: JSON.stringify({ stage: 'initial', theme: '', isLoadingCategories: false, isGeneratingIdea: false, categories: null, selection: { action: null, place: null, obstacle: null }, generatedIdea: '', targetLanguage: 'ru', format: 'childrens' }), width: 680, height: 800 };
        case NodeType.NARRATOR_TEXT_GENERATOR:
            return { type, title, value: JSON.stringify({ prompt: '', role: 'narrator', generatedTexts: { ru: '', en: '' }, targetLanguages: { ru: true, en: true }, generateSSML: false }), width: 680, height: 800 };
        case NodeType.REROUTE_DOT:
            return { type, title, value: JSON.stringify({ type: null }), width: 60, height: 40 };
        case NodeType.DATA_READER:
            return { type, title, value: '', width: 380, height: 280 };
        case NodeType.AUDIO_TRANSCRIBER:
            return { type, title, value: JSON.stringify({ audioBase64: null, mimeType: null, transcription: '' }), width: 400, height: 480 };
        case NodeType.YOUTUBE_TITLE_GENERATOR:
            return { 
                type, 
                title, 
                value: JSON.stringify({ 
                    mode: 'title', 
                    idea: '', 
                    targetLanguages: { ru: true, en: false }, 
                    generatedTitleOutputs: {}, 
                    generatedChannelOutputs: {} 
                }), 
                width: 680, 
                height: 800
            };
        case NodeType.MUSIC_IDEA_GENERATOR:
            return {
                type,
                title,
                value: JSON.stringify({
                    generateLyrics: true,
                    idea: '',
                    targetLanguages: { ru: true, en: false },
                    generatedLyrics: {},
                    generatedMusicPrompts: {},
                    generatedTitles: {},
                    model: 'gemini-3-flash-preview'
                }),
                width: 680, 
                height: 800
            };
        case NodeType.YOUTUBE_ANALYTICS:
            return {
                type,
                title,
                value: JSON.stringify({
                    authorName: '',
                    channels: [{ id: 'default', name: 'Main Channel', videos: [], stats: [], notes: [] }],
                    activeChannelId: 'default',
                    aiAdvice: ''
                }),
                width: 1100,
                height: 800
            };
        default:
            return { type, title, value: '', width: 200, height: 150 };
    }
};

export const useNodes = (initialNodes: Node[], initialCounter: number) => {
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const nodeIdCounter = useRef<number>(initialCounter);

    const handleValueChange = useCallback((nodeId: string, value: string) => {
        setNodes(current => current.map(n => n.id === nodeId ? { ...n, value } : n));
    }, []);

    const handleAddNode = useCallback((type: NodeType, position: Point, t: (key: string, options?: { [key: string]: string | number }) => string, value?: string, title?: string): string => {
        nodeIdCounter.current++;
        const newId = `node-${nodeIdCounter.current}-${Date.now()}`;
        const defaults = getNodeDefaults(type, t);
        const newNode: Node = { 
            ...defaults, 
            id: newId, 
            position,
            title: title || defaults.title 
        };
        if (value !== undefined) newNode.value = value;
        setNodes(current => [...current, newNode]);
        return newId;
    }, []);

    const handleDeleteNode = useCallback((nodeId: string) => {
        setNodes(current => current.filter(n => n.id !== nodeId));
    }, []);
    
    const handleCopyNodeValue = useCallback(async (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        let textToCopy = node.value;

        if (node.type === NodeType.CHARACTER_CARD) {
            try {
                const parsedValue = JSON.parse(node.value || '[]');
                // Handle both single object and array structure
                const cards = Array.isArray(parsedValue) ? parsedValue : [parsedValue];

                const exportCards = cards.map((card: any) => {
                    const selectedRatio = card.selectedRatio || '1:1';
                    const imageSources = card.imageSources || card.thumbnails || {};
                    const exportedImageSources: Record<string, string | null> = {};
                    const ratios = ['1:1', '16:9', '9:16'];
                    
                    ratios.forEach(r => {
                        const val = imageSources[r];
                        if (val) {
                             exportedImageSources[r] = val.startsWith('data:image') ? val : `data:image/png;base64,${val}`;
                        } else {
                             exportedImageSources[r] = null;
                        }
                    });
                    
                    let mainImage = exportedImageSources[selectedRatio] || null;
                    if (!mainImage && (card.imageBase64 || card.image)) {
                         const val = card.imageBase64 || card.image;
                         mainImage = val.startsWith('data:image') ? val : `data:image/png;base64,${val}`;
                         if (!exportedImageSources['1:1']) {
                             exportedImageSources['1:1'] = mainImage;
                         }
                    }

                    return {
                        type: 'character-card',
                        nodeTitle: node.title,
                        id: card.id || `char-card-${Date.now()}-${Math.random()}`,
                        name: card.name || 'New Entity 1',
                        index: card.index || card.alias || 'Entity-1',
                        image: mainImage,
                        selectedRatio: selectedRatio,
                        prompt: card.prompt || '',
                        fullDescription: card.fullDescription || '',
                        imageSources: exportedImageSources,
                        additionalPrompt: card.additionalPrompt,
                        targetLanguage: card.targetLanguage,
                        isOutput: card.isOutput
                    };
                });

                textToCopy = JSON.stringify(exportCards, null, 2);
            } catch (e) {
                console.warn("Error formatting character card for copy", e);
            }
        } else if (node.type === NodeType.SCRIPT_GENERATOR) {
            try {
                const parsed = JSON.parse(node.value || '{}');
                const exportObject = {
                    type: 'script-generator-data',
                    title: node.title,
                    ...parsed
                };
                textToCopy = JSON.stringify(exportObject, null, 2);
            } catch (e) { console.warn("Error formatting script generator for copy", e); }
        } else if (node.type === NodeType.SCRIPT_ANALYZER) {
            try {
                const parsed = JSON.parse(node.value || '{}');
                const exportObject = {
                    type: 'script-analyzer-data',
                    title: node.title,
                    ...parsed
                };
                textToCopy = JSON.stringify(exportObject, null, 2);
            } catch (e) { console.warn("Error formatting script analyzer for copy", e); }
        } else if (node.type === NodeType.SCRIPT_PROMPT_MODIFIER) {
            try {
                const parsed = JSON.parse(node.value || '{}');
                const exportObject = {
                    type: 'script-prompt-modifier-data',
                    title: node.title,
                    ...parsed
                };
                textToCopy = JSON.stringify(exportObject, null, 2);
            } catch (e) { console.warn("Error formatting script prompt modifier for copy", e); }
        } else if (node.type === NodeType.YOUTUBE_TITLE_GENERATOR) {
            try {
                const parsed = JSON.parse(node.value || '{}');
                const exportObject = {
                    type: 'youtube-title-data',
                    title: node.title,
                    ...parsed
                };
                textToCopy = JSON.stringify(exportObject, null, 2);
            } catch (e) { console.warn("Error formatting youtube title generator for copy", e); }
        } else if (node.type === NodeType.YOUTUBE_ANALYTICS) {
            try {
                const parsed = JSON.parse(node.value || '{}');
                const exportObject = {
                    type: 'youtube-analytics-data',
                    title: node.title,
                    ...parsed
                };
                textToCopy = JSON.stringify(exportObject, null, 2);
            } catch (e) { console.warn("Error formatting youtube analytics for copy", e); }
        }

        await navigator.clipboard.writeText(textToCopy);
    }, [nodes]);

    const handlePasteNodeValue = useCallback(async (nodeId: string) => {
        const text = await navigator.clipboard.readText();
        handleValueChange(nodeId, text);
    }, [handleValueChange]);
    
    const handleToggleNodeCollapse = useCallback((nodeId: string) => {
        setNodes(current => current.map(n => n.id === nodeId ? { ...n, isCollapsed: !n.isCollapsed } : n));
    }, []);
    
    const createDuplicateNode = useCallback((nodeId: string, overrideValue?: string) => {
        const nodeToDuplicate = nodes.find(n => n.id === nodeId);
        if (!nodeToDuplicate) return '';

        nodeIdCounter.current++;
        const newNodeId = `node-${nodeIdCounter.current}-${Date.now()}`;
        
        const newNode: Node = {
            ...nodeToDuplicate,
            id: newNodeId,
            position: { x: nodeToDuplicate.position.x + 30, y: nodeToDuplicate.position.y + 30 },
            isCollapsed: nodeToDuplicate.isCollapsed,
            value: overrideValue !== undefined ? overrideValue : nodeToDuplicate.value
        };

        setNodes(current => [...current, newNode]);
        return newNodeId;
    }, [nodes]);

    const handleDuplicateNode = useCallback((nodeId: string) => {
        return createDuplicateNode(nodeId);
    }, [createDuplicateNode]);

    const handleDuplicateNodeEmpty = useCallback((nodeId: string, t: (key: string, options?: { [key: string]: string | number }) => string): string => {
        const nodeToDuplicate = nodes.find(n => n.id === nodeId);
        if (!nodeToDuplicate) return '';
        const defaults = getNodeDefaults(nodeToDuplicate.type, t);
        return createDuplicateNode(nodeId, defaults.value);
    }, [nodes, createDuplicateNode]);

    const handleToggleNodeOutputVisibility = useCallback((nodeId: string) => {
        setNodes(current => current.map(n => n.id === nodeId ? { ...n, areOutputHandlesHidden: !n.areOutputHandlesHidden } : n));
    }, []);

    return {
        nodes,
        setNodes,
        nodeIdCounter,
        handleValueChange,
        handleAddNode,
        handleDeleteNode,
        handleCopyNodeValue,
        handlePasteNodeValue,
        handleToggleNodeCollapse,
        handleDuplicateNode,
        handleDuplicateNodeEmpty,
        handleToggleNodeOutputVisibility,
    };
};
