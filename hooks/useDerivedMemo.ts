
import { useMemo, useCallback } from 'react';
import type { Node, Connection, Point } from '../types';
import { NodeType } from '../types';
import { getOutputHandleType, getInputHandleType } from '../utils/nodeUtils';
import { getScriptGeneratorHandlePositions } from '../components/handles/handleLayouts';

const HEADER_HEIGHT = 40;
const CONTENT_PADDING = 12;
const HANDLE_VERTICAL_PADDING = 10;

export const useDerivedMemo = ({ nodes, connections, selectedNodeIds, dollyZoomingInfo, draggingInfo, effectiveTool, isPanning, t, selectionRect: selectionRectPoints }: any) => {
    const connectedInputs = useMemo(() => {
        const map = new Map();
        connections.forEach(conn => {
            if (!map.has(conn.toNodeId)) map.set(conn.toNodeId, new Set());
            map.get(conn.toNodeId).add(conn.toHandleId);
        });
        return map;
    }, [connections]);

    const groupButtonPosition = useMemo(() => {
        if (selectedNodeIds.length <= 1) return null;
        const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
        let minX = Infinity, minY = Infinity, maxX = -Infinity;
        selectedNodes.forEach(node => { minX = Math.min(minX, node.position.x); minY = Math.min(minY, node.position.y); maxX = Math.max(maxX, node.position.x + node.width); });
        if (minX === Infinity) return null;
        const centerX = (minX + maxX) / 2;
        const topY = minY;
        return { x: centerX, y: topY - 60 };
    }, [selectedNodeIds, nodes]);

    const getCanvasCursor = () => {
        if (dollyZoomingInfo) return 'var(--cursor-zoom-in)';
        if (draggingInfo || isPanning) return 'grabbing';
        if (effectiveTool === 'zoom') return 'var(--cursor-zoom-in)';
        if (effectiveTool === 'selection') return 'crosshair';
        if (['edit', 'cutter', 'reroute'].includes(effectiveTool)) return 'grab';
        return 'default';
    };

    const getConnectionPoints = useCallback((fromNode: Node, toNode: Node, conn: Connection): { start: Point; end: Point } => {
        const startPoint: Point = { x: 0, y: 0 };
        const endPoint: Point = { x: 0, y: 0 };

        // START POINT (OUTPUT from fromNode)
        startPoint.x = fromNode.position.x + fromNode.width;

        if (fromNode.isCollapsed) {
            let handles: { handleId?: string }[] = [];
            const fromType = getOutputHandleType(fromNode, undefined);
            if (fromNode.type === NodeType.PROMPT_ANALYZER) {
                let localCharacters: string[] = []; try { localCharacters = JSON.parse(fromNode.value || '{}').characters || []; } catch {}
                const handleIds = ['environment', ...Array.from({ length: Math.max(1, localCharacters.length) }, (_, i) => `character-${i}`), 'action', 'style'];
                handles = handleIds.map(id => ({ handleId: id }));
            } else if (fromNode.type === NodeType.CHARACTER_ANALYZER) {
                handles = [{ handleId: 'character' }, { handleId: 'clothing' }];
            } else if (fromNode.type === NodeType.SCRIPT_GENERATOR) {
                handles.push({ handleId: 'all-script-parts' });
                let scriptData: any = {};
                try { scriptData = JSON.parse(fromNode.value || '{}'); } catch {}
                const scenes = scriptData.scenes || [];
                const hasNarratorText = scenes.some((s: any) => s.narratorText && s.narratorText.trim() !== '');
                if (hasNarratorText) {
                    handles.push({ handleId: 'all-narrator-text' });
                }
            } else if (fromNode.type === NodeType.CHARACTER_CARD) {
                handles = [{ handleId: 'all-characters' }, { handleId: 'primary-character' }];
            } else if (fromType !== null || fromNode.type === NodeType.REROUTE_DOT) {
                handles = [{ handleId: undefined }];
            }
            
            const handleIndex = handles.findIndex(h => h.handleId === conn.fromHandleId);
            startPoint.y = fromNode.position.y + (handleIndex >= 0 ? (handleIndex + 1) * (HEADER_HEIGHT / (handles.length + 1)) : HEADER_HEIGHT / 2);
        } else { // fromNode is expanded
            switch (fromNode.type) {
                case NodeType.PROMPT_ANALYZER: {
                    let localCharacters: string[] = []; try { localCharacters = JSON.parse(fromNode.value || '{}').characters || []; } catch {}
                    const characterHandleCount = Math.max(1, localCharacters.length);
                    const totalPanes = 3 + characterHandleCount;
                    const handleIds = ['environment', ...Array.from({ length: characterHandleCount }, (_, i) => `character-${i}`), 'action', 'style'];
                    const handleIndex = handleIds.indexOf(conn.fromHandleId || '');
                    const contentAreaTop = HEADER_HEIGHT + CONTENT_PADDING;
                    const contentAreaBottom = fromNode.height - CONTENT_PADDING - 40 - 8;
                    const textAreasContainerHeight = contentAreaBottom - contentAreaTop;
                    startPoint.y = fromNode.position.y + contentAreaTop + (textAreasContainerHeight / totalPanes) * (handleIndex + 0.5);
                    break;
                }
                case NodeType.CHARACTER_ANALYZER: {
                    const handleIds = ['character', 'clothing'];
                    const handleIndex = handleIds.indexOf(conn.fromHandleId || '');
                    const contentAreaTop = HEADER_HEIGHT + CONTENT_PADDING;
                    const contentAreaBottom = fromNode.height - CONTENT_PADDING - 40 - 8;
                    const textAreasContainerHeight = contentAreaBottom - contentAreaTop;
                    startPoint.y = fromNode.position.y + contentAreaTop + (textAreasContainerHeight / 2) * (handleIndex + 0.5);
                    break;
                }
                case NodeType.CHARACTER_GENERATOR: {
                    let charactersFromGen: any[] = []; try { charactersFromGen = JSON.parse(fromNode.value || '{}').characters || []; } catch {}
                    const localHandles: { handleId: string }[] = [];
                    charactersFromGen.forEach((char: any, index: number) => {
                        localHandles.push({ handleId: char.id ? `character-${char.id}` : `character-${index}` });
                    });
                    const totalHandles = localHandles.length;
                    const availableHeight = fromNode.height - HEADER_HEIGHT;
                    const handleIndex = localHandles.findIndex(h => h.handleId === conn.fromHandleId);
                    if (handleIndex !== -1) {
                         startPoint.y = fromNode.position.y + HEADER_HEIGHT + (availableHeight / (totalHandles + 1)) * (handleIndex + 1);
                    } else {
                        startPoint.y = fromNode.position.y + fromNode.height / 2;
                    }
                    break;
                }
                case NodeType.SCRIPT_GENERATOR: {
                    const positions = getScriptGeneratorHandlePositions(fromNode, t);
                    const pos = positions.get(conn.fromHandleId || 'all-script-parts');
                    startPoint.y = pos ? fromNode.position.y + pos.y : fromNode.position.y + fromNode.height / 2;
                    break;
                }
                case NodeType.SCRIPT_ANALYZER: {
                    let analysisData: { characters: any[], scenes: any[] } = { characters: [], scenes: [] }; try { analysisData = JSON.parse(fromNode.value || '{}'); } catch {}
                    const { characters: analyzedChars = [], scenes = [] } = analysisData;
                    
                    const localHandles: { handleId: string; }[] = [];
                    localHandles.push({ handleId: 'all-script-analyzer-data' });
                    const hasNarratorData = scenes.some((s: any) => s.narratorText);
                    if (hasNarratorData) {
                        localHandles.push({ handleId: 'all-narrator-data' });
                    }
                    analyzedChars.forEach((char: any, index: number) => {
                        const charId = char.id || `char-idx-${index}`;
                        localHandles.push({ handleId: `character-${charId}`});
                    });

                    const handleIndex = localHandles.findIndex(h => h.handleId === conn.fromHandleId);
                    
                    if (handleIndex !== -1) {
                         const availableHeight = fromNode.height - HEADER_HEIGHT;
                         startPoint.y = fromNode.position.y + HEADER_HEIGHT + (availableHeight / (localHandles.length + 1)) * (handleIndex + 1);
                    } else {
                        startPoint.y = fromNode.position.y + fromNode.height / 2;
                    }
                    break;
                }
                case NodeType.SCRIPT_PROMPT_MODIFIER: {
                    let finalizerData: { finalPrompts: any[] } = { finalPrompts: [] }; try { finalizerData = JSON.parse(fromNode.value || '{}'); } catch {}
                    const { finalPrompts = [] } = finalizerData;
                    const handleId = conn.fromHandleId || '';
                    const handleIndex = finalPrompts.findIndex(p => `final-prompt-${p.frameNumber}` === handleId);

                    if (handleIndex !== -1) {
                         const totalHandles = finalPrompts.length;
                         const availableHeight = fromNode.height - HEADER_HEIGHT;
                         const yOffset = (availableHeight / (totalHandles + 1)) * (handleIndex + 1);
                         startPoint.y = fromNode.position.y + HEADER_HEIGHT + yOffset;
                    } else {
                        startPoint.y = fromNode.position.y + fromNode.height / 2;
                    }
                    break;
                }
                case NodeType.NARRATOR_TEXT_GENERATOR: {
                    let targetLanguages: { ru?: boolean, en?: boolean } = {};
                    try { targetLanguages = JSON.parse(fromNode.value || '{}').targetLanguages || {}; } catch {}
                    const selectedLangs = Object.entries(targetLanguages).filter(([, selected]) => selected).map(([lang]) => lang);
                    const handleIndex = selectedLangs.indexOf(conn.fromHandleId || '');

                    if (handleIndex !== -1) {
                        const totalHandles = selectedLangs.length;
                        
                        const CONTROLS_HEIGHT = 60;
                        const PROMPT_TEXTAREA_HEIGHT = 96;
                        const BUTTON_HEIGHT = 40;
                        const SPACING = 8;
                        
                        const topFixedContentHeight = CONTROLS_HEIGHT + SPACING + PROMPT_TEXTAREA_HEIGHT + SPACING + BUTTON_HEIGHT;
                        const contentAreaTop = HEADER_HEIGHT + CONTENT_PADDING + topFixedContentHeight + SPACING;
                        const contentAreaBottom = fromNode.height - CONTENT_PADDING;
                        const availableHeight = contentAreaBottom - contentAreaTop;

                        let idealHandleY;
                        if (availableHeight <= 20 * totalHandles) { // Fallback if node is too small
                            const fallbackAvailable = fromNode.height - contentAreaTop;
                            idealHandleY = contentAreaTop + (fallbackAvailable / (totalHandles + 1)) * (handleIndex + 1);
                        } else {
                            idealHandleY = contentAreaTop + (availableHeight / totalHandles) * (handleIndex + 0.5);
                        }
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(idealHandleY, fromNode.height - HANDLE_VERTICAL_PADDING));
                        startPoint.y = fromNode.position.y + clampedY;
                    } else {
                         startPoint.y = fromNode.position.y + fromNode.height / 2;
                    }
                    break;
                }
                case NodeType.YOUTUBE_TITLE_GENERATOR: {
                    let targetLanguages: { ru?: boolean, en?: boolean } = {};
                    try { targetLanguages = JSON.parse(fromNode.value || '{}').targetLanguages || {}; } catch {}
        
                    const selectedLangs = Object.entries(targetLanguages)
                        .filter(([, selected]) => selected)
                        .map(([lang]) => lang);
                    
                    const handleIndex = selectedLangs.indexOf(conn.fromHandleId || '');

                    if (handleIndex !== -1) {
                        const totalHandles = selectedLangs.length;
                        const availableHeight = fromNode.height - HEADER_HEIGHT;
                        const idealHandleY = HEADER_HEIGHT + (availableHeight / (totalHandles + 1)) * (handleIndex + 1);
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(idealHandleY, fromNode.height - HANDLE_VERTICAL_PADDING));
                        startPoint.y = fromNode.position.y + clampedY;
                    } else {
                        startPoint.y = fromNode.position.y + fromNode.height / 2;
                    }
                    break;
                }
                case NodeType.CHARACTER_CARD: {
                    const handles = [
                        { handleId: 'all-characters' },
                        { handleId: 'primary-character' }
                    ];
                    const availableHeight = fromNode.height - HEADER_HEIGHT;
                    const totalHandles = handles.length;
                    
                    const handleIndex = handles.findIndex(h => h.handleId === conn.fromHandleId);
                    
                    if (handleIndex !== -1) {
                        const y = HEADER_HEIGHT + (availableHeight / (totalHandles + 1)) * (handleIndex + 1);
                        const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(y, fromNode.height - HANDLE_VERTICAL_PADDING));
                        startPoint.y = fromNode.position.y + clampedY;
                    } else {
                        startPoint.y = fromNode.position.y + fromNode.height / 2;
                    }
                    break;
                }
                default:
                    startPoint.y = fromNode.position.y + fromNode.height / 2;
            }
        }

        // END POINT (INPUT to toNode)
        endPoint.x = toNode.position.x;
        
        if (toNode.isCollapsed) {
            let handles: { handleId?: string }[] = [];
            if (toNode.type === NodeType.SCRIPT_GENERATOR) {
                handles = [{ handleId: 'prompt' }, { handleId: 'characters' }];
            } else if (toNode.type === NodeType.SCRIPT_PROMPT_MODIFIER) {
                handles = [{ handleId: 'all-script-analyzer-data' }, { handleId: 'style' }];
            } else if (toNode.type === NodeType.SCRIPT_ANALYZER) {
                handles = [{ handleId: undefined }]; // Merged input
            } else {
                const inputType = getInputHandleType(toNode, undefined);
                if (inputType !== null || toNode.type === NodeType.REROUTE_DOT) {
                    handles = [{ handleId: undefined }];
                }
            }
            const handleIndex = handles.findIndex(h => h.handleId === conn.toHandleId);
            endPoint.y = toNode.position.y + (handleIndex >= 0 ? (handleIndex + 1) * (HEADER_HEIGHT / (handles.length + 1)) : HEADER_HEIGHT / 2);

        } else { // toNode is expanded
            let yPosition: number;
            
            const calculateYRatio = (handleId: string | undefined, ratios: { [key: string]: number }, defaultRatio: number) => {
                const ratio = (handleId && ratios[handleId]) ? ratios[handleId] : defaultRatio;
                return toNode.position.y + toNode.height * ratio;
            };

            switch (toNode.type) {
                case NodeType.SCRIPT_GENERATOR:
                    // Use specific pixel values if possible, or calculate based on assumption
                    if (conn.toHandleId === 'prompt') yPosition = toNode.position.y + 95;
                    else if (conn.toHandleId === 'characters') yPosition = toNode.position.y + 330;
                    else yPosition = toNode.position.y + toNode.height / 2;
                    break;
                case NodeType.SCRIPT_PROMPT_MODIFIER:
                    yPosition = calculateYRatio(conn.toHandleId, { 'all-script-analyzer-data': 1/3, 'style': 2/3 }, 1/3);
                    break;
                case NodeType.SCRIPT_ANALYZER:
                    // Standard default center
                    yPosition = toNode.position.y + toNode.height / 2;
                    break;
                default:
                    yPosition = toNode.position.y + toNode.height / 2;
            }
            endPoint.y = yPosition;
        }
        
        return { start: startPoint, end: endPoint };
    }, [nodes, t]);

    const selectionRect = useMemo(() => {
        if (!selectionRectPoints) return null;
        const { start, end } = selectionRectPoints;
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(start.x - end.x);
        const height = Math.abs(start.y - end.y);
        return { x, y, width, height };
    }, [selectionRectPoints]);


    return {
        connectedInputs,
        groupButtonPosition,
        getCanvasCursor,
        getConnectionPoints,
        selectionRect,
    };
};
