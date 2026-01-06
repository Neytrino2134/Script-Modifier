
import React from 'react';
import { ActionButton } from '../../ActionButton';

export const UpstreamFrameDisplay: React.FC<{ frame: any, characters: any[], t: (key: string) => string, isCollapsed: boolean, onToggle: () => void }> = React.memo(({ frame, characters, t, isCollapsed, onToggle }) => {
    const charList = (frame.characters || []).map((c: string) => {
        const match = c.match(/(?:Entity|Character|Персонаж)[-\s]?(\d+)/i);
        return match ? `ENT-${match[1]}` : c;
    });
    const charString = charList.length > 0 ? charList.join(', ') : 'NONE';
    
    // Убрали (S-${frame.sceneNumber}) из заголовка
    const shotLabel = frame.shotType ? ` | ${frame.shotType}` : '';
    const headerTitle = `Frame-${frame.frameNumber}${shotLabel} • ${charString}`;
    
    return (
        <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
            <h4 className="font-semibold text-gray-300 text-sm flex justify-between items-center cursor-pointer select-none" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                <span className="truncate pr-2">{headerTitle}</span>
                <ActionButton tooltipPosition="left" title={isCollapsed ? t('node.action.expandFrame') : t('node.action.collapseFrame')} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                    {isCollapsed ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>)}
                </ActionButton>
            </h4>
            {!isCollapsed && (
                <div className="mt-1 text-xs space-y-2">
                    <div className="pt-1"><p className="font-semibold text-emerald-400 mb-0.5">{t('node.content.compositionAndBlocking')}</p><p className="text-gray-300 italic whitespace-pre-wrap select-text pl-2 border-l-2 border-emerald-500">{frame.imagePrompt}</p></div>
                    <div className="pt-1 border-t border-gray-700/50"><p className="font-semibold text-cyan-400 mb-0.5">{t('node.content.environmentPrompt')}</p><p className="text-gray-300 italic whitespace-pre-wrap select-text pl-2 border-l-2 border-cyan-500">{frame.environmentPrompt}</p></div>
                </div>
            )}
        </div>
    );
});

export const CombinedPromptItem: React.FC<{ promptId: string; title: string; imagePrompt: string; videoPrompt: string; isCollapsed: boolean; t: (key: string) => string; onToggleCollapse: (id: string) => void; onCopy: (text: string) => void; onDelete: () => void; }> = React.memo(({ promptId, title, imagePrompt, videoPrompt, isCollapsed, t, onToggleCollapse, onCopy, onDelete }) => {
    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 space-y-0">
            <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-700/50 transition-colors rounded-t-lg" onDoubleClick={() => onToggleCollapse(promptId)} onClick={() => onToggleCollapse(promptId)}>
                <div className="flex items-center space-x-2 flex-grow min-w-0">
                     <ActionButton tooltipPosition="right" title={isCollapsed ? t('node.action.expand') : t('node.action.collapse')} onClick={(e) => { e.stopPropagation(); onToggleCollapse(promptId); }}>
                        {isCollapsed ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>)}
                    </ActionButton>
                    <h4 className="font-bold text-white truncate pr-2 text-sm" title={title}>{title}</h4>
                </div>
                <div className="flex items-center space-x-1"><ActionButton tooltipPosition="left" title={t('node.action.deleteItem')} onClick={(e) => { e.stopPropagation(); onDelete(); }}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></ActionButton></div>
            </div>
            {!isCollapsed && (
                <div className="p-2 space-y-3 border-t border-gray-700">
                    <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-emerald-400 uppercase tracking-wider">{t('node.content.imagePrompt')}</label>
                            <ActionButton tooltipPosition="left" title={t('node.action.copy')} onClick={(e) => { e.stopPropagation(); onCopy(imagePrompt); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            </ActionButton>
                        </div>
                        <textarea className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md resize-none focus:outline-none custom-scrollbar text-xs text-gray-300 h-[120px]" value={imagePrompt} readOnly />
                    </div>
                    {videoPrompt && (
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-medium text-emerald-400 uppercase tracking-wider">{t('node.content.videoPrompt')}</label>
                                <ActionButton tooltipPosition="left" title={t('node.action.copy')} onClick={(e) => { e.stopPropagation(); onCopy(videoPrompt); }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                </ActionButton>
                            </div>
                            <textarea className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md resize-none focus:outline-none custom-scrollbar text-xs text-gray-300 h-[60px]" value={videoPrompt} readOnly />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
