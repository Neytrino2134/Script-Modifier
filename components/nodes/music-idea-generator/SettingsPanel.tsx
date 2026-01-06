
import React from 'react';
import { InstructionBrick } from './InstructionBrick';
import { MUSIC_GENERATOR_INSTRUCTIONS } from '../../../utils/prompts/musicGenerator';
import { MusicUiState } from './types';
import { ActionButton } from '../../ActionButton';

interface SettingsPanelProps {
    uiState: MusicUiState;
    onUpdateUiState: (updates: Partial<MusicUiState>) => void;
    generateLyrics: boolean;
    onToggleGenerateLyrics: () => void;
    model: string;
    t: (key: string) => string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    uiState, onUpdateUiState, generateLyrics, onToggleGenerateLyrics, model, t
}) => {
    let stepCount = 0;

    const getFormattedModelName = (modelId: string) => {
        if (modelId === 'gemini-3-flash-preview') return 'Gemini 3 Flash Preview';
        if (modelId === 'gemini-3-pro-preview') return 'Gemini 3 Pro Preview';
        return modelId;
    };

    return (
        <div className="border border-gray-600 hover:border-gray-400 rounded-md bg-gray-900 overflow-hidden flex-shrink-0 flex flex-col transition-colors duration-200">
            <div 
                className="flex justify-between items-center p-2 bg-gray-800/50 cursor-pointer select-none hover:bg-gray-700/50 transition-colors flex-shrink-0"
                onClick={() => onUpdateUiState({ isSettingsCollapsed: !uiState.isSettingsCollapsed })}
            >
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('node.content.activePromptStack')}</h4>
                <div className="text-gray-400">
                     {uiState.isSettingsCollapsed ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                    )}
                </div>
            </div>
            
            {!uiState.isSettingsCollapsed && (
                <div className="p-2 bg-gray-800/20 flex flex-col gap-1 overflow-y-auto custom-scrollbar max-h-64" onWheel={(e) => e.stopPropagation()}>
                    
                    {/* Model Brick */}
                     <InstructionBrick 
                        label={t('node.content.model')} 
                        text={getFormattedModelName(model)}
                        isMandatory 
                        color='gray'
                        className="mb-2"
                    />

                    {/* 1. INPUT CONTEXT */}
                    <div className="space-y-1 mb-3">
                         <h6 className="text-[9px] font-bold text-gray-500 uppercase px-1 border-b border-gray-700/50 pb-0.5">1. Context</h6>
                         <InstructionBrick 
                            label={t(`instruction.${MUSIC_GENERATOR_INSTRUCTIONS.ROLE.id}`)} 
                            text={MUSIC_GENERATOR_INSTRUCTIONS.ROLE.text} 
                            translatedText={t(`instruction.desc.${MUSIC_GENERATOR_INSTRUCTIONS.ROLE.id}`)} 
                            isMandatory 
                            color='emerald' 
                            index={++stepCount}
                        />
                         <InstructionBrick 
                            label={t(`instruction.${MUSIC_GENERATOR_INSTRUCTIONS.INPUT_CONTEXT.id}`)} 
                            text={MUSIC_GENERATOR_INSTRUCTIONS.INPUT_CONTEXT.text} 
                            translatedText={t(`instruction.desc.${MUSIC_GENERATOR_INSTRUCTIONS.INPUT_CONTEXT.id}`)} 
                            isMandatory 
                            color='gray' 
                            index={++stepCount}
                        />
                    </div>
                    
                    {/* 2. GENERATION RULES */}
                    <div className="space-y-1 mb-3">
                         <h6 className="text-[9px] font-bold text-gray-500 uppercase px-1 border-b border-gray-700/50 pb-0.5">2. Generation Rules</h6>
                         
                         <InstructionBrick 
                            label={t(`instruction.${MUSIC_GENERATOR_INSTRUCTIONS.CREATIVE_RULE.id}`)} 
                            text={MUSIC_GENERATOR_INSTRUCTIONS.CREATIVE_RULE.text} 
                            translatedText={t(`instruction.desc.${MUSIC_GENERATOR_INSTRUCTIONS.CREATIVE_RULE.id}`)} 
                            isMandatory 
                            color='cyan' 
                            index={++stepCount}
                        />

                         <InstructionBrick 
                            label={t(`instruction.${MUSIC_GENERATOR_INSTRUCTIONS.MUSIC_PROMPT_RULE.id}`)} 
                            text={MUSIC_GENERATOR_INSTRUCTIONS.MUSIC_PROMPT_RULE.text} 
                            translatedText={t(`instruction.desc.${MUSIC_GENERATOR_INSTRUCTIONS.MUSIC_PROMPT_RULE.id}`)} 
                            isMandatory 
                            color='cyan' 
                            index={++stepCount}
                        />

                         <InstructionBrick 
                            label={t(`instruction.${MUSIC_GENERATOR_INSTRUCTIONS.LYRICS_RULE.id}`)} 
                            text={MUSIC_GENERATOR_INSTRUCTIONS.LYRICS_RULE.text} 
                            translatedText={t(`instruction.desc.${MUSIC_GENERATOR_INSTRUCTIONS.LYRICS_RULE.id}`)} 
                            isEnabled={generateLyrics}
                            onToggle={onToggleGenerateLyrics}
                            color='emerald' 
                            index={generateLyrics ? ++stepCount : undefined}
                        />
                    </div>
                    
                     {/* 3. FORMAT */}
                     <div className="space-y-1">
                         <h6 className="text-[9px] font-bold text-gray-500 uppercase px-1 border-b border-gray-700/50 pb-0.5">3. Output Format</h6>
                          <InstructionBrick 
                            label={t(`instruction.${MUSIC_GENERATOR_INSTRUCTIONS.FORMAT.id}`)} 
                            text={MUSIC_GENERATOR_INSTRUCTIONS.FORMAT.text} 
                            translatedText={t(`instruction.desc.${MUSIC_GENERATOR_INSTRUCTIONS.FORMAT.id}`)} 
                            isMandatory 
                            color='gray' 
                            index={++stepCount}
                        />
                     </div>
                </div>
            )}
        </div>
    );
};
