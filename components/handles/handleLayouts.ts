
import type { Node } from '../../types';

const HEADER_HEIGHT = 40;
const CONTENT_PADDING = 12;

export const getScriptGeneratorHandlePositions = (node: Node, t: (key: string) => string): Map<string, { y: number; title: string }> => {
    const positions = new Map<string, { y: number; title: string }>();

    let parsedValue;
    try {
        parsedValue = JSON.parse(node.value || '{}');
    } catch {
        parsedValue = { summary: '', detailedCharacters: [], scenes: [] };
    }

    const { summary = '', detailedCharacters = [], scenes = [] } = parsedValue;

    const handles: { handleId: string; title: string }[] = [];
    
    handles.push({ handleId: 'all-script-parts', title: t('node.content.allScriptParts') });

    const hasNarratorText = scenes.some((s: any) => s.narratorText && s.narratorText.trim() !== '');
    if (hasNarratorText) {
        handles.push({ handleId: 'all-narrator-text', title: t('node.content.allNarratorData') });
    }

    if (summary) {
        handles.push({ handleId: 'summary', title: t('node.content.summary') });
    }

    detailedCharacters.forEach((char: any, index: number) => {
        const charId = char.id || `char-idx-${index}`;
        handles.push({ handleId: `character-${charId}`, title: char.name || 'Character' });
    });

    const sortedScenes = [...scenes].sort((a: any, b: any) => a.sceneNumber - b.sceneNumber);
    sortedScenes.forEach((scene: any, index: number) => {
        const sceneHandleId = `scene-${index}`;
        handles.push({ handleId: sceneHandleId, title: scene.title || `Scene ${index + 1}` });
    });
    
    const availableHeight = node.height - HEADER_HEIGHT;
    const totalHandles = handles.length;
    
    if (totalHandles === 0) return positions;

    handles.forEach(({ handleId, title }, index) => {
        const y = HEADER_HEIGHT + (availableHeight / (totalHandles + 1)) * (index + 1);
        positions.set(handleId, { y, title });
    });

    return positions;
};

// Script Analyzer Logic now handled via default input logic in InputHandles.tsx
export const getScriptAnalyzerInputHandlePositions = (node: Node, t: (key: string) => string): Map<string | undefined, { y: number; title: string }> => {
    const positions = new Map<string | undefined, { y: number; title: string }>();
    // Returns simplified single input
    positions.set(undefined, { y: node.height / 2, title: t('node.input.default') });
    return positions;
};
