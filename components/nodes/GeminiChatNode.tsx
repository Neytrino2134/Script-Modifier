
import React, { useEffect, useMemo, useRef } from 'react';
import type { NodeContentProps } from '../../types';
import { ActionButton } from '../ActionButton';

// Simple Markdown Parser to avoid external dependencies for basic chat formatting
const renderMarkdown = (text: string) => {
    if (!text) return null;
    
    // Helper to parse inline styles (Bold and Code)
    const parseInline = (str: string) => {
        // 1. Split by Bold (**text**)
        const parts = str.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                // Remove asterisks and style
                return <strong key={i} className="text-emerald-200 font-bold">{part.slice(2, -2)}</strong>;
            }
            
            // 2. Split by Inline Code (`text`) within non-bold parts
            const codeParts = part.split(/(`.*?`)/g);
            return codeParts.map((cp, j) => {
                if (cp.startsWith('`') && cp.endsWith('`')) {
                    return <code key={`${i}-${j}`} className="bg-gray-900/80 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-xs border border-gray-700">{cp.slice(1, -1)}</code>;
                }
                return cp;
            });
        });
    };

    const lines = text.split('\n');
    
    return lines.map((line, index) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith('### ')) {
            return <h5 key={index} className="text-emerald-400 font-bold text-sm mt-3 mb-1 uppercase tracking-wide">{parseInline(trimmed.substring(4))}</h5>;
        }
        if (trimmed.startsWith('## ')) {
            return <h4 key={index} className="text-cyan-400 font-bold text-base mt-4 mb-2 border-b border-gray-600/50 pb-1">{parseInline(trimmed.substring(3))}</h4>;
        }
        if (trimmed.startsWith('# ')) {
            return <h3 key={index} className="text-white font-black text-lg mt-5 mb-2">{parseInline(trimmed.substring(2))}</h3>;
        }

        // Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
                <div key={index} className="flex items-start ml-2 mb-1">
                    <span className="mr-2 text-emerald-500 font-bold">•</span>
                    <span className="text-gray-200">{parseInline(trimmed.substring(2))}</span>
                </div>
            );
        }
        
        // Numbered Lists (Simple check for "1. ")
        if (/^\d+\.\s/.test(trimmed)) {
             const dotIndex = trimmed.indexOf('.');
             const number = trimmed.substring(0, dotIndex + 1);
             const content = trimmed.substring(dotIndex + 1);
             return (
                 <div key={index} className="flex items-start ml-1 mb-1">
                    <span className="mr-1 text-cyan-500 font-mono text-xs pt-0.5">{number}</span>
                    <span className="text-gray-200">{parseInline(content)}</span>
                </div>
             );
        }
        
        // Horizontal Rule
        if (trimmed === '---' || trimmed === '***') {
            return <hr key={index} className="my-3 border-gray-600/50" />;
        }

        // Empty lines (for spacing)
        if (!trimmed) {
            return <div key={index} className="h-2"></div>;
        }

        // Regular Paragraph
        return <p key={index} className="text-gray-300 leading-relaxed min-h-[1em]">{parseInline(line)}</p>;
    });
};

const GeminiChatNode: React.FC<NodeContentProps> = ({ node, onValueChange, onSendMessage, isChatting, isStopping, onStopGeneration, t, deselectAllNodes }) => {
    const isLoading = isChatting === node.id;
    const chatValue = useMemo(() => {
        try {
            return JSON.parse(node.value || '{}');
        } catch {
            return { messages: [], currentInput: '', mode: 'general' };
        }
    }, [node.value]);

    const { messages = [], currentInput = '', mode = 'general' } = chatValue;
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!isLoading) {
            onSendMessage(node.id);
        }
    };
    
    const handleModeChange = (newMode: string) => {
         onValueChange(node.id, JSON.stringify({ ...chatValue, mode: newMode }));
    };

    return (
        <div className="flex flex-col h-full">
            {/* Mode Selector Toolbar */}
            <div className="bg-gray-800 rounded-md p-1 mb-2 flex-shrink-0">
                <div className="flex space-x-1 w-full">
                    <button
                        onClick={() => handleModeChange('general')}
                        className={`flex-1 py-2 px-1 rounded transition-colors flex flex-col items-center justify-center gap-1 ${mode === 'general' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-[10px] font-medium leading-none text-center">{t('chat.mode.general')}</span>
                    </button>
                    <button
                        onClick={() => handleModeChange('script')}
                        className={`flex-1 py-2 px-1 rounded transition-colors flex flex-col items-center justify-center gap-1 ${mode === 'script' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-[10px] font-medium leading-none text-center">{t('chat.mode.script')}</span>
                    </button>
                    <button
                        onClick={() => handleModeChange('prompt')}
                        className={`flex-1 py-2 px-1 rounded transition-colors flex flex-col items-center justify-center gap-1 ${mode === 'prompt' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] font-medium leading-none text-center">{t('chat.mode.prompt')}</span>
                    </button>
                    <button
                        onClick={() => handleModeChange('youtube')}
                        className={`flex-1 py-2 px-1 rounded transition-colors flex flex-col items-center justify-center gap-1 ${mode === 'youtube' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[10px] font-medium leading-none text-center">{t('chat.mode.youtube')}</span>
                    </button>
                </div>
            </div>

            <div ref={chatContainerRef} onWheel={e => e.stopPropagation()} className="flex-grow p-2 bg-gray-900/50 rounded-md overflow-y-auto overflow-x-auto mb-2 space-y-4 select-text custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex h-full items-center justify-center text-gray-500 text-xs italic text-center px-4">
                        {t(`chat.mode.${mode}`)}
                    </div>
                )}
                {messages.map((msg: { role: string, content: string }, index: number) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative group max-w-[90%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-800 border border-gray-700'}`}>
                            {msg.role === 'user' ? (
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            ) : (
                                <div className="text-sm break-words">
                                    {renderMarkdown(msg.content)}
                                </div>
                            )}
                            
                            {msg.role === 'model' && (
                                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ActionButton tooltipPosition="left" title={t('node.action.copy')} onClick={() => navigator.clipboard.writeText(msg.content)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </ActionButton>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] p-3 rounded-lg bg-gray-800 border border-gray-700">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="relative w-full">
                <textarea
                    value={currentInput}
                    onChange={(e) => onValueChange(node.id, JSON.stringify({ ...chatValue, currentInput: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={t('node.content.chatPlaceholder')}
                    onWheel={e => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full p-2 pr-10 bg-gray-700 border border-transparent rounded-md resize-y focus:border-emerald-500 focus:ring-0 focus:outline-none custom-scrollbar overflow-y-scroll min-h-[80px] text-white placeholder-gray-400"
                    rows={2}
                    onFocus={deselectAllNodes}
                />
                <button 
                  onClick={isLoading ? onStopGeneration : handleSend} 
                  disabled={isStopping || (!isLoading && !currentInput.trim())} 
                  className={`absolute right-2 bottom-2 p-1.5 rounded-md transition-colors duration-200 flex items-center justify-center ${isStopping ? 'bg-yellow-600 text-white' : (isLoading ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed')}`}
                  title={isStopping ? "Stopping" : isLoading ? "Stop" : "Send"}
                >
                    {isStopping ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor"><rect x="6" y="6" width="8" height="8" /></svg>
                    ) : isLoading ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default GeminiChatNode;
