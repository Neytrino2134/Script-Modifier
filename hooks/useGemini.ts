
import React, { useCallback, useRef, useState } from 'react';
import { Node, Connection, NodeType } from '../types';
import { useGeminiGeneration } from './useGeminiGeneration';
import { useGeminiModification } from './useGeminiModification';
import { useGeminiAnalysis } from './useGeminiAnalysis';
import { useGeminiConversation } from './useGeminiConversation';
import { useGeminiChainExecution } from './useGeminiChainExecution';

export const useGemini = (nodes: Node[], connections: Connection[], setNodes: React.Dispatch<React.SetStateAction<Node[]>>) => {
    const [error, setError] = useState<string | null>(null);
    const executionStopRequested = useRef(false);
    const nodesRef = useRef(nodes);
    nodesRef.current = nodes; 

    const stopGeneration = useCallback(() => {
        executionStopRequested.current = true;
    }, []);

    const getUpstreamTextValue = useCallback((nodeId: string, handleId: string | undefined, visited = new Set<string>()): string => {
        if (visited.has(nodeId)) return '';
        visited.add(nodeId);

        const node = nodesRef.current.find(n => n.id === nodeId);
        if (!node) return '';

        if (node.type === NodeType.REROUTE_DOT) {
             const inputConn = connections.find(c => c.toNodeId === nodeId);
             if (inputConn) {
                 return getUpstreamTextValue(inputConn.fromNodeId, inputConn.fromHandleId, visited);
             }
             return '';
        }

        try {
            const parsedValue = JSON.parse(node.value || '{}');
            
            if (node.type === NodeType.TEXT_INPUT) return node.value;
            if (node.type === NodeType.NOTE) return node.value;
            if (node.type === NodeType.TRANSLATOR) return parsedValue.translatedText || '';
            if (node.type === NodeType.PROMPT_PROCESSOR) return node.value;
            
            switch (node.type) {
                case NodeType.PROMPT_ANALYZER:
                    if (handleId === 'environment') return parsedValue.environment || '';
                    if (handleId === 'action') return parsedValue.action || '';
                    if (handleId === 'style') return parsedValue.style || '';
                    if (handleId?.startsWith('character-')) {
                        const idx = parseInt(handleId.split('-')[1], 10);
                        return parsedValue.characters?.[idx] || '';
                    }
                    return '';
                case NodeType.CHARACTER_ANALYZER:
                    if (handleId === 'character') return parsedValue.character || '';
                    if (handleId === 'clothing') return parsedValue.clothing || '';
                    return '';
                case NodeType.CHARACTER_CARD:
                    let cardData = parsedValue;
                    if (!Array.isArray(cardData)) {
                        cardData = [cardData];
                    }

                    // Helper to clean data for downstream (remove heavy base64 and thumbnails)
                    const sanitize = (c: any) => {
                        const { image, imageBase64, imageSources, thumbnails, selectedRatio, alias, ...cardTextData } = c;
                        // Ensure index is present
                        if (!cardTextData.index && alias) {
                            cardTextData.index = alias;
                        }
                        return cardTextData;
                    };
                    
                    if (handleId === 'primary-character') {
                         // Find the first character marked as output (primary)
                         const primary = cardData.find((c: any) => c.isOutput) || cardData[0];
                         // Return as an array containing the single sanitized object
                         return primary ? JSON.stringify([sanitize(primary)]) : '[]';
                    }

                    // Default 'all-characters' or undefined handle
                    return JSON.stringify(cardData.map((c: any) => sanitize(c)));
                case NodeType.CHARACTER_GENERATOR:
                    if (handleId?.startsWith('character-')) {
                        const charId = handleId.replace('character-', '');
                        const character = parsedValue.characters?.find((c: any) => c.id === charId) 
                                       || parsedValue.characters?.[parseInt(charId, 10)];
                        
                        if (character) {
                            const { imageBase64, image, alias, ...cleanChar } = character;
                            // Ensure index
                            if (!cleanChar.index && alias) {
                                cleanChar.index = alias;
                            }
                            return JSON.stringify(cleanChar); 
                        }
                        return '';
                    }
                    return '';
                case NodeType.SCRIPT_GENERATOR:
                    if (handleId === 'all-script-parts' || handleId === undefined) {
                        // Aggregate local state with upstream connected characters
                        const combinedData = { ...parsedValue };
                        
                        // Find incoming character connections to THIS generator node
                        const charConnections = connections.filter(c => c.toNodeId === nodeId && c.toHandleId === 'characters');
                        const linkedCharacters: any[] = [];
                        
                        charConnections.forEach(conn => {
                            const charJson = getUpstreamTextValue(conn.fromNodeId, conn.fromHandleId, new Set([...visited])); 
                            try {
                                const parsedChar = JSON.parse(charJson || '{}');
                                if (parsedChar.name) {
                                    const { image, imageBase64, imageSources, alias, ...cleanChar } = parsedChar;
                                    if (!cleanChar.index && alias) cleanChar.index = alias;
                                    linkedCharacters.push(cleanChar);
                                } else if (Array.isArray(parsedChar)) {
                                    // Handle array of characters from Character Card (all-characters) or Generator
                                    const cleanChars = parsedChar.map((c: any) => {
                                        const { image, imageBase64, imageSources, thumbnails, alias, ...clean } = c;
                                        if (!clean.index && alias) clean.index = alias;
                                        return clean;
                                    });
                                    linkedCharacters.push(...cleanChars);
                                } else if (parsedChar.characters && Array.isArray(parsedChar.characters)) {
                                     // Legacy Character Generator structure
                                    const cleanChars = parsedChar.characters.map((c: any) => {
                                        const { image, imageBase64, imageSources, alias, ...clean } = c;
                                        if (!clean.index && alias) clean.index = alias;
                                        return clean;
                                    });
                                    linkedCharacters.push(...cleanChars);
                                }
                            } catch {}
                        });

                        // Merge linked characters into detailedCharacters for downstream visibility
                        // We filter out duplicates based on name to avoid clutter
                        const existingNames = new Set((combinedData.detailedCharacters || []).map((c: any) => c.name));
                        const newLinked = linkedCharacters.filter(c => !existingNames.has(c.name));

                        combinedData.detailedCharacters = [
                            ...(combinedData.detailedCharacters || []),
                            ...newLinked
                        ];
                        
                        // Ensure generatedStyle is passed if visualStyle is set to 'custom' or 'generated'
                        if (!combinedData.generatedStyle && combinedData.visualStyle && combinedData.visualStyle !== 'none') {
                             combinedData.generatedStyle = combinedData.customVisualStyle || combinedData.visualStyle;
                        }

                        return JSON.stringify(combinedData);
                    }
                    if (handleId === 'all-narrator-text') {
                         const scenes = parsedValue.scenes || [];
                         const narratorData = scenes.map((s: any) => ({
                             sceneNumber: s.sceneNumber,
                             text: s.narratorText
                         })).filter((d: any) => d.text);
                         return JSON.stringify(narratorData);
                    }
                    if (handleId === 'summary') return parsedValue.summary || '';
                    if (handleId?.startsWith('scene-')) {
                        const idx = parseInt(handleId.split('-')[1], 10);
                        return parsedValue.scenes?.[idx]?.description || '';
                    }
                    if (handleId?.startsWith('character-')) {
                         const charId = handleId.replace('character-', '');
                         const character = parsedValue.detailedCharacters?.find((c: any) => c.id === charId);
                         if (character) return JSON.stringify(character);
                    }
                    return '';
                case NodeType.SCRIPT_ANALYZER:
                    if (handleId === 'all-script-analyzer-data' || handleId === undefined) {
                        // THE PIPELINE LOGIC:
                        // Merge Analyzer's own data with data from its input (Generator)
                        // This allows style, character, AND scene descriptions to "pass through" to the Finalizer
                        
                        const mergedData = { ...parsedValue };

                        // Find input node (Generator)
                        const inputConn = connections.find(c => c.toNodeId === nodeId);
                        if (inputConn) {
                            const upstreamJson = getUpstreamTextValue(inputConn.fromNodeId, inputConn.fromHandleId, new Set([...visited]));
                            try {
                                const upstreamData = JSON.parse(upstreamJson);
                                
                                // 1. Visual Style Pass-through (From Generator -> Analyzer -> Finalizer)
                                // Explicitly preserve generatedStyle from upstream (Generator)
                                if (upstreamData.generatedStyle) {
                                    mergedData.generatedStyle = upstreamData.generatedStyle;
                                }
                                
                                // Fallback: Map to visualStyle if not present locally
                                if (!mergedData.visualStyle && (upstreamData.generatedStyle || upstreamData.visualStyle)) {
                                    mergedData.visualStyle = upstreamData.generatedStyle || upstreamData.visualStyle;
                                }
                                
                                // 2. Character Pass-through (Transparent Mode)
                                if (upstreamData.detailedCharacters && Array.isArray(upstreamData.detailedCharacters)) {
                                    mergedData.detailedCharacters = upstreamData.detailedCharacters;
                                    mergedData.characters = upstreamData.detailedCharacters; 
                                } else if (upstreamData.characters) {
                                    mergedData.detailedCharacters = upstreamData.characters;
                                    mergedData.characters = upstreamData.characters;
                                }

                                // 3. Scene Description Pass-through (Enrichment)
                                if (upstreamData.scenes && Array.isArray(upstreamData.scenes) && mergedData.scenes && Array.isArray(mergedData.scenes)) {
                                    const upstreamScenesMap = new Map();
                                    upstreamData.scenes.forEach((s: any) => {
                                        if (typeof s.sceneNumber === 'number') {
                                            upstreamScenesMap.set(s.sceneNumber, s);
                                        }
                                    });

                                    // Create new array to avoid mutating node state directly
                                    mergedData.scenes = mergedData.scenes.map((s: any) => {
                                        const upstreamScene = upstreamScenesMap.get(s.sceneNumber);
                                        if (upstreamScene) {
                                            return {
                                                ...s,
                                                title: s.title || upstreamScene.title,
                                                description: s.description || upstreamScene.description,
                                                narratorText: s.narratorText || upstreamScene.narratorText
                                            };
                                        }
                                        return s;
                                    });
                                }

                            } catch (e) {
                                // Ignore parsing errors from upstream
                            }
                        }
                        
                        return JSON.stringify(mergedData);
                    }

                    if (handleId === 'all-narrator-data') {
                         const scenes = parsedValue.scenes || [];
                         const narratorData = scenes.map((s: any) => ({
                             sceneNumber: s.sceneNumber,
                             text: s.narratorText
                         })).filter((d: any) => d.text);
                         return JSON.stringify(narratorData);
                    }
                    if (handleId?.startsWith('character-')) {
                        const charId = handleId.replace('character-', '');
                        const character = parsedValue.characters?.find((c: any) => c.id === charId);
                        if (character) return JSON.stringify(character);
                    }
                    if (handleId?.startsWith('frame-')) {
                        const frameNum = parseInt(handleId.split('-')[1], 10);
                        const allFrames = (parsedValue.scenes || []).flatMap((s: any) => s.frames || []);
                        const frame = allFrames.find((f: any) => f.frameNumber === frameNum);
                        return frame?.imagePrompt || '';
                    }
                    return '';
                case NodeType.SCRIPT_PROMPT_MODIFIER:
                    if (handleId?.startsWith('final-prompt-')) {
                        const frameNum = parseInt(handleId.substring('final-prompt-'.length), 10);
                        const prompt = parsedValue.finalPrompts?.find((p: any) => p.frameNumber === frameNum);
                        if (prompt) return prompt.prompt || '';
                    }
                    return '';
                case NodeType.YOUTUBE_ANALYTICS:
                    return parsedValue.aiAdvice || '';
                case NodeType.NARRATOR_TEXT_GENERATOR:
                    return parsedValue.generatedTexts?.[handleId || ''] || '';
                case NodeType.AUDIO_TRANSCRIBER:
                    return parsedValue.transcription || '';
                case NodeType.IDEA_GENERATOR:
                    return parsedValue.generatedIdea || '';
                case NodeType.YOUTUBE_TITLE_GENERATOR:
                    if (handleId && parsedValue.generatedTitleOutputs && parsedValue.generatedTitleOutputs[handleId]) {
                        return JSON.stringify(parsedValue.generatedTitleOutputs[handleId]);
                    }
                    return JSON.stringify(parsedValue);
                case NodeType.MUSIC_IDEA_GENERATOR:
                    return JSON.stringify(parsedValue);
                default:
                    return node.value || '';
            }
        } catch {
            return node.value || '';
        }
    }, [connections]); 

    const generation = useGeminiGeneration({ nodes, connections, setNodes, getUpstreamTextValue, setError, executionStopRequested });
    const analysis = useGeminiAnalysis({ nodes, connections, setNodes, getUpstreamTextValue, setError, executionStopRequested });
    const modification = useGeminiModification({ nodes, connections, setNodes, getUpstreamTextValue, setError, executionStopRequested });
    const conversation = useGeminiConversation({ nodes, connections, setNodes, getUpstreamTextValue, setError });
    
    const chainExecution = useGeminiChainExecution({
        nodes, connections, setNodes, executionStopRequested, setError,
        generationHandlers: { handleGenerateScript: generation.handleGenerateScript },
        analysisHandlers: { handleAnalyzeScript: analysis.handleAnalyzeScript },
        modificationHandlers: { handleModifyScriptPrompts: modification.handleModifyScriptPrompts }
    });

    const combinedStates = {
        ...generation.states,
        ...analysis.states,
        ...modification.states,
        ...conversation.states,
        ...chainExecution.states,
    };

    const stopAll = useCallback(() => {
        stopGeneration();
        generation.stop();
        analysis.stop();
        modification.stop();
        conversation.stop();
        chainExecution.stop();
    }, [stopGeneration, generation, analysis, modification, conversation, chainExecution]);

    return {
        ...generation,
        ...analysis,
        ...modification,
        ...conversation,
        ...chainExecution,
        stopGeneration: stopAll,
        error,
        setError,
        getUpstreamTextValue,
        ...combinedStates
    };
};
