
import React from 'react';
import { InstructionBrick } from './InstructionBrick';
import { NARRATOR_GENERATOR_INSTRUCTIONS } from '../../../utils/prompts/narratorGenerator';
import { NarratorUiState } from './types';

interface SettingsPanelProps {
    uiState: NarratorUiState;
    onUpdateUiState: (updates: Partial<NarratorUiState>) => void;
    role: string;
    generateSSML: boolean;
    onToggleSSML: () => void;
    t: (key: string) => string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    uiState, onUpdateUiState, role, generateSSML, onToggleSSML, t
}) => {
    let stepCount = 0;

    const getRoleInstruction = () => {
        switch (role) {
            case 'announcer':
            case 'dual_announcer':
                return NARRATOR_GENERATOR_INSTRUCTIONS.ROLE_ANNOUNCER;
            case 'first_person':
                return NARRATOR_GENERATOR_INSTRUCTIONS.ROLE_FIRST_PERSON;
            case 'narrator':
            case 'dual_narrator':
            default:
                return NARRATOR_GENERATOR_INSTRUCTIONS.ROLE_NARRATOR;
        }
    };

    const roleInstruction = getRoleInstruction();

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
                    
                    {/* 1. INPUT CONTEXT */}
                    <div className="space-y-1 mb-3">
                         <h6 className="text-[9px] font-bold text-gray-500 uppercase px-1 border-b border-gray-700/50 pb-0.5">1. Context</h6>
                         <InstructionBrick 
                            label={t(`instruction.${NARRATOR_GENERATOR_INSTRUCTIONS.INPUT_CONTEXT.id}`)} 
                            text={NARRATOR_GENERATOR_INSTRUCTIONS.INPUT_CONTEXT.text} 
                            translatedText={t(`instruction.desc.${NARRATOR_GENERATOR_INSTRUCTIONS.INPUT_CONTEXT.id}`)} 
                            isMandatory 
                            color='gray' 
                            index={++stepCount}
                        />
                         <InstructionBrick 
                            label={t(`instruction.${roleInstruction.id}`)} 
                            text={roleInstruction.text} 
                            translatedText={t(`instruction.desc.${roleInstruction.id}`)} 
                            isMandatory 
                            color='emerald' 
                            index={++stepCount}
                        />
                    </div>
                    
                    {/* 2. FORMATTING RULES */}
                    <div className="space-y-1 mb-3">
                         <h6 className="text-[9px] font-bold text-gray-500 uppercase px-1 border-b border-gray-700/50 pb-0.5">2. Formatting</h6>
                         
                         <InstructionBrick 
                            label={t(`instruction.${NARRATOR_GENERATOR_INSTRUCTIONS.SSML_RULE.id}`)} 
                            text={NARRATOR_GENERATOR_INSTRUCTIONS.SSML_RULE.text} 
                            translatedText={t(`instruction.desc.${NARRATOR_GENERATOR_INSTRUCTIONS.SSML_RULE.id}`)} 
                            isEnabled={generateSSML}
                            onToggle={onToggleSSML}
                            color='purple' 
                            index={generateSSML ? ++stepCount : undefined}
                        />
                    </div>
                    
                     {/* 3. OUTPUT */}
                     <div className="space-y-1">
                         <h6 className="text-[9px] font-bold text-gray-500 uppercase px-1 border-b border-gray-700/50 pb-0.5">3. Output</h6>
                          <InstructionBrick 
                            label={t(`instruction.${NARRATOR_GENERATOR_INSTRUCTIONS.FORMAT.id}`)} 
                            text={NARRATOR_GENERATOR_INSTRUCTIONS.FORMAT.text} 
                            translatedText={t(`instruction.desc.${NARRATOR_GENERATOR_INSTRUCTIONS.FORMAT.id}`)} 
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
