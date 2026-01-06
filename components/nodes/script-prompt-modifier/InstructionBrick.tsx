
import React, { forwardRef, useState } from 'react';

interface InstructionBrickProps {
    id: string;
    label: string;
    originalText: string;
    translatedText?: string;
    isCritical?: boolean;
    isEnabled?: boolean;
    isMandatory?: boolean;
    onToggle?: (id: string) => void;
    color?: 'emerald' | 'cyan' | 'gray';
    className?: string;
    index?: number;
    isHighlighted?: boolean;
}

export const InstructionBrick = forwardRef<HTMLDivElement, InstructionBrickProps>(({ 
    id, label, originalText, translatedText, isCritical, isEnabled = true, isMandatory = false, onToggle, color = 'emerald', className = "h-full", index, isHighlighted
}, ref) => {
    const [isCopied, setIsCopied] = useState(false);
    
    let bgClass = '';
    let borderClass = '';
    let headerTextClass = '';
    let indicatorClass = '';
    let contentTextClass = '';
    let badgeBgClass = '';
    
    // Base styles
    const baseClasses = "flex flex-row p-2 rounded border text-xs transition-all relative overflow-hidden group select-none gap-3 items-stretch duration-200";

    if (!isEnabled) {
        // Disabled State (Dimmed but clickable)
        bgClass = 'bg-gray-800/40 hover:bg-gray-800/60';
        borderClass = 'border-gray-700 hover:border-gray-600';
        headerTextClass = 'text-gray-500 group-hover:text-gray-400';
        indicatorClass = 'bg-gray-700 group-hover:bg-gray-600';
        contentTextClass = 'text-gray-600 group-hover:text-gray-500';
        badgeBgClass = 'bg-gray-800 text-gray-600';
    } else if (isCritical) {
        // Critical State (Active)
        bgClass = 'bg-red-900/20';
        borderClass = 'border-red-800/50';
        headerTextClass = 'text-red-400';
        indicatorClass = 'bg-red-500';
        contentTextClass = 'text-gray-300';
        badgeBgClass = 'bg-red-900/50 text-red-200';
    } else if (isMandatory) {
        // Mandatory State (Always On)
        bgClass = 'bg-gray-800';
        borderClass = 'border-gray-600';
        headerTextClass = 'text-emerald-400';
        indicatorClass = 'bg-gray-500';
        contentTextClass = 'text-gray-300';
        badgeBgClass = 'bg-gray-700 text-gray-400';
    } else {
        // Active State (Based on Color)
        contentTextClass = 'text-gray-300';
        switch (color) {
            case 'cyan':
                bgClass = 'bg-cyan-900/20';
                borderClass = 'border-cyan-700/50';
                headerTextClass = 'text-cyan-400';
                indicatorClass = 'bg-cyan-500';
                badgeBgClass = 'bg-cyan-900/50 text-cyan-200';
                break;
            case 'gray':
                bgClass = 'bg-gray-700/40';
                borderClass = 'border-gray-500/50';
                headerTextClass = 'text-gray-300';
                indicatorClass = 'bg-gray-400';
                badgeBgClass = 'bg-gray-600 text-gray-200';
                break;
            default: // emerald
                bgClass = 'bg-emerald-900/20';
                borderClass = 'border-emerald-700/50';
                headerTextClass = 'text-emerald-400';
                indicatorClass = 'bg-emerald-500';
                badgeBgClass = 'bg-emerald-900/50 text-emerald-200';
        }
    }

    // Highlighting override (Search)
    if (isHighlighted) {
        borderClass = 'border-yellow-400 ring-1 ring-yellow-400/50';
        bgClass = 'bg-yellow-900/30';
    }

    const handleClick = (e: React.MouseEvent) => {
        if (!isMandatory && onToggle) {
            e.preventDefault();
            e.stopPropagation();
            onToggle(id);
        }
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(originalText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
    };

    return (
        <div 
            ref={ref}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClick}
            className={`${baseClasses} ${bgClass} ${borderClass} ${className} ${!isMandatory ? 'cursor-pointer shadow-sm' : ''}`}
        >
            {/* Number Badge */}
            {index !== undefined && (
                <div className={`flex-shrink-0 w-6 flex flex-col items-center justify-start pt-0.5`}>
                    <div className={`text-[9px] font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full ${badgeBgClass}`}>
                        {index}
                    </div>
                    {/* Vertical line connector visualization */}
                    <div className={`w-px flex-grow mt-1 ${isEnabled ? 'bg-gray-700' : 'bg-transparent'}`}></div>
                </div>
            )}

            <div className="flex flex-col flex-grow min-w-0">
                {/* Header */}
                <div className="flex justify-between items-center mb-1 flex-shrink-0">
                    <div className="flex items-center gap-2">
                         {index === undefined && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${indicatorClass}`} />}
                         <div className={`font-bold uppercase tracking-wider text-[10px] leading-tight ${headerTextClass}`}>{label}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Copy Button */}
                        <button
                            onClick={handleCopy}
                            className={`p-0.5 rounded transition-colors ${isEnabled ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-gray-400'}`}
                            title="Copy Prompt Text"
                        >
                            {isCopied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </button>

                        {!isMandatory && (
                            <div className={`text-[9px] uppercase font-mono px-1 rounded ${isEnabled ? 'text-white bg-white/10' : 'text-gray-600 bg-black/20'}`}>
                                {isEnabled ? 'ON' : 'OFF'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Container */}
                <div className={`mb-1 leading-tight ${isEnabled ? 'text-gray-400' : 'text-gray-600'} text-[10px]`}>
                    {originalText}
                </div>

                {/* Translated Text */}
                {translatedText && (
                    <>
                         <div className="border-t border-gray-600/30 my-1 w-full" />
                         <div className={`leading-tight italic ${contentTextClass}`}>
                            {translatedText}
                        </div>
                    </>
                )}
            </div>
            
            {/* Bottom Accent Line/Separator for style */}
            <div className={`absolute bottom-0 left-0 w-full h-[2px] opacity-30 ${indicatorClass}`} />
        </div>
    );
});
