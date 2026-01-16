
import React, { useMemo } from 'react';
import { ActionButton } from '../../ActionButton';

export const AIAdviceSection: React.FC<{ advice: string, addToast: (msg: string, type: 'success' | 'info') => void }> = ({ advice, addToast }) => {
    if (!advice) return null;

    // Parse markdown-like headers (### Title)
    const sections = useMemo(() => {
        const parts = advice.split(/(?=###\s)/); // Split looking ahead for ###
        return parts.map(part => {
            const trimmed = part.trim();
            if (trimmed.startsWith('###')) {
                const [titleLine, ...contentLines] = trimmed.split('\n');
                return {
                    title: titleLine.replace(/^###\s*/, '').trim(),
                    content: contentLines.join('\n').trim(),
                    isHeader: true
                };
            }
            return {
                title: null,
                content: trimmed,
                isHeader: false
            };
        }).filter(p => p.content);
    }, [advice]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast('Copied to clipboard', 'success');
    };

    // Helper to render markdown bold
    const renderContent = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-emerald-300 font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="space-y-2 mt-2">
            {sections.map((section, idx) => (
                <div key={idx} className={`bg-gray-800/80 border border-gray-700 rounded-md overflow-hidden ${section.isHeader ? 'mb-2' : 'mb-1'}`}>
                    {section.title && (
                        <div className="flex justify-between items-center bg-gray-900/60 px-2 py-1.5 border-b border-gray-700/50">
                            <h4 className="text-sm font-bold text-emerald-400">{section.title}</h4>
                            <ActionButton title="Copy Section" onClick={() => handleCopy(`${section.title}\n${section.content}`)}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </ActionButton>
                        </div>
                    )}
                    <div className="p-2 text-xs text-gray-300 whitespace-pre-wrap select-text leading-relaxed">
                        {renderContent(section.content)}
                    </div>
                </div>
            ))}
        </div>
    );
};
