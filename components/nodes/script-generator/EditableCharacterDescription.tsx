
import React, { useState, useEffect } from 'react';
import { ActionButton } from '../../ActionButton';

export const EditableCharacterDescription: React.FC<{
    fullDescription: string;
    onDescriptionChange: (newDescription: string) => void;
    readOnly?: boolean;
    t: (key: string) => string;
    onFocus?: () => void;
}> = React.memo(({ fullDescription, onDescriptionChange, readOnly = false, t, onFocus }) => {
    const [sections, setSections] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const parsed: { [key: string]: string } = { 'Appearance': '', 'Personality': '', 'Clothing': '' };
        const keyMap: { [key: string]: 'Appearance' | 'Personality' | 'Clothing' } = {
            'Внешность': 'Appearance', 'Личность': 'Personality', 'Одежда': 'Clothing',
            'Appearance': 'Appearance', 'Personality': 'Personality', 'Clothing': 'Clothing'
        };
        const sectionRegex = /####\s*(Appearance|Personality|Clothing|Внешность|Личность|Одежда)\s*([\s\S]*?)(?=####|$)/gi;
    
        let match;
        let foundMatch = false;
        while ((match = sectionRegex.exec(fullDescription)) !== null) {
            foundMatch = true;
            const key = keyMap[match[1].trim() as keyof typeof keyMap];
            const value = match[2].trim();
            if (key) {
                parsed[key] = value;
            }
        }

        if (!foundMatch && fullDescription.trim()) {
            parsed['Appearance'] = fullDescription.trim();
        }
        
        setSections(parsed);
    }, [fullDescription]);
    
    const handleSectionChange = (key: string, value: string) => {
        const newSections = { ...sections, [key]: value };
        const newFullDescription = `#### Appearance\n${newSections['Appearance'] || ''}\n\n#### Personality\n${newSections['Personality'] || ''}\n\n#### Clothing\n${newSections['Clothing'] || ''}`;
        onDescriptionChange(newFullDescription);
    };

    return (
        <div className="space-y-2 text-sm">
            {(['Appearance', 'Personality', 'Clothing'] as const).map(key => (
                <div key={key}>
                    <div className="flex justify-between items-center">
                        <h5 className="font-semibold text-gray-400 text-xs uppercase tracking-wider">{t(`node.content.${key.toLowerCase()}` as any) || key}</h5>
                        <ActionButton tooltipPosition="left" title={`${t('node.action.copy')} ${key}`} onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(sections[key] || ''); }}>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </ActionButton>
                    </div>
                    <textarea
                        value={sections[key] || ''}
                        onChange={e => handleSectionChange(key, e.target.value)}
                        readOnly={readOnly}
                        className={`w-full text-sm p-2 bg-gray-900 border-none rounded-md resize-y min-h-[60px] focus:outline-none focus:ring-1 focus:ring-emerald-500 custom-scrollbar overflow-y-scroll read-only:bg-gray-900/50 read-only:text-gray-400 ${readOnly ? 'read-only:cursor-not-allowed' : ''}`}
                        onWheel={e => e.stopPropagation()}
                        onFocus={onFocus}
                    />
                </div>
            ))}
        </div>
    );
});
