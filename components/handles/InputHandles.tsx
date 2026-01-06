
import React from 'react';
import { NodeType } from '../../types';
import { getInputHandleType } from '../../utils/nodeUtils';
import EdgeHandle from './EdgeHandle';
import type { HandleProps } from './types';

const HEADER_HEIGHT = 40;
const CONTENT_PADDING = 12;
const HANDLE_VERTICAL_PADDING = 10;

export const InputHandles: React.FC<HandleProps> = ({ node, getHandleColor, handleCursor, isCollapsed, t }) => {
    if (isCollapsed) {
        let handles: { handleId?: string; type: 'text' | 'image' | null; title: string }[] = [];
        if (node.type === NodeType.SCRIPT_GENERATOR) {
            handles = [
                { handleId: 'prompt', type: 'text', title: t('node.content.scriptPromptPlaceholder') },
                { handleId: 'characters', type: 'text', title: t('node.content.characters') }
            ];
        } else if (node.type === NodeType.SCRIPT_PROMPT_MODIFIER) {
            handles = [
                { handleId: 'all-script-analyzer-data', type: 'text', title: t('node.content.allScriptAnalyzerData') },
                { handleId: 'style', type: 'text', title: t('node.content.style') }
            ];
        } else if (node.type === NodeType.SCRIPT_ANALYZER) {
            // Unified input for Script Analyzer
            handles = [
                { handleId: undefined, type: 'text', title: t('node.input.default') } 
            ];
        } else {
            const inputType = getInputHandleType(node, undefined); 
            if (inputType !== null || node.type === NodeType.REROUTE_DOT) {
                handles = [{ handleId: undefined, type: inputType, title: t('node.input.default') }];
            }
        }
        
        return (
            <>
                {handles.map((handle, index) => (
                    <EdgeHandle
                        key={handle.handleId || `input-${index}`}
                        id={`handle-in-${node.id}-${handle.handleId || 'default'}`}
                        title={handle.title}
                        color={getHandleColor(handle.type, handle.handleId)}
                        handleCursor={handleCursor}
                        position="left"
                        style={{ top: `${(index + 1) * (HEADER_HEIGHT / (handles.length + 1))}px`, transform: 'translateY(-50%)' }}
                    />
                ))}
            </>
        );
    }

    if (node.type === NodeType.SCRIPT_GENERATOR) {
        const handles = [
            { handleId: 'prompt', title: t('node.content.scriptPromptPlaceholder'), y_pos: 95 },
            { handleId: 'characters', title: t('node.content.characters'), y_pos: 330 }
        ];

        return (
            <>
                {handles.map((handle) => {
                    // Use specific pixel positions as requested
                    const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(handle.y_pos, node.height - HANDLE_VERTICAL_PADDING));
                    return (
                        <EdgeHandle
                            key={handle.handleId}
                            id={`handle-in-${node.id}-${handle.handleId}`}
                            title={handle.title}
                            color={getHandleColor('text', handle.handleId)}
                            handleCursor={handleCursor}
                            position="left"
                            style={{ top: `${clampedY}px`, transform: 'translateY(-50%)' }}
                        />
                    );
                })}
            </>
        );
    }

    if (node.type === NodeType.SCRIPT_PROMPT_MODIFIER) {
        const handles = [
            { handleId: 'all-script-analyzer-data', title: t('node.content.allScriptAnalyzerData'), y_pos_ratio: 1/3 },
            { handleId: 'style', title: t('node.content.style'), y_pos_ratio: 2/3 }
        ];

        return (
            <>
                {handles.map((handle) => {
                    const idealY = node.height * handle.y_pos_ratio;
                    const clampedY = Math.max(HEADER_HEIGHT + HANDLE_VERTICAL_PADDING, Math.min(idealY, node.height - HANDLE_VERTICAL_PADDING));
                    return (
                        <EdgeHandle
                            key={handle.handleId}
                            id={`handle-in-${node.id}-${handle.handleId}`}
                            title={handle.title}
                            color={getHandleColor('text', handle.handleId)}
                            handleCursor={handleCursor}
                            position="left"
                            style={{ top: `${clampedY}px`, transform: 'translateY(-50%)' }}
                        />
                    );
                })}
            </>
        );
    }

    const inputType = getInputHandleType(node, undefined);
    if (inputType === null && node.type !== NodeType.REROUTE_DOT) return null;

    const idealYPosition = node.height / 2;
    const clampedYPosition = Math.max(HEADER_HEIGHT / 2, Math.min(idealYPosition, node.height - HANDLE_VERTICAL_PADDING));

    return (
        <EdgeHandle
            id={`handle-in-${node.id}-default`}
            title={t('node.input.default')}
            color={getHandleColor(inputType, undefined)}
            handleCursor={handleCursor}
            position="left"
            style={{ top: `${clampedYPosition}px`, transform: 'translateY(-50%)' }}
        />
    );
};

export default InputHandles;
