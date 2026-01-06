
import React from 'react';
import { AnalyzedCharacter } from './types';

interface CharacterIndexControlProps {
    characters: string[];
    onChange: (newCharacters: string[]) => void;
    availableCharacters: AnalyzedCharacter[];
}

export const CharacterIndexControl: React.FC<CharacterIndexControlProps> = ({ characters, onChange, availableCharacters }) => {
    
    const parseIndex = (aliasOrName: string) => {
        const match = aliasOrName.match(/(?:Entity|Character|Персонаж)[-\s]?(\d+)/i);
        if (match) return parseInt(match[1], 10);

        // Fallback: Check if the string itself is just a number (unlikely but possible in some error cases)
        const anyNum = aliasOrName.match(/(\d+)/);
        if (anyNum) return parseInt(anyNum[1], 10);

        return null;
    };

    const handleChangeIndex = (indexInArray: number, delta: number) => {
        const currentAlias = characters[indexInArray];
        let num = parseIndex(currentAlias);
        if (num === null) num = 0; 
        
        const newNum = Math.max(1, num + delta);
        // Force new convention
        const newAlias = `Entity-${newNum}`;
        
        const newChars = [...characters];
        newChars[indexInArray] = newAlias;
        onChange(newChars);
    };

    const handleRemove = (indexInArray: number) => {
        const newChars = characters.filter((_, i) => i !== indexInArray);
        onChange(newChars);
    };

    const handleAdd = () => {
        let maxNum = 0;
        characters.forEach(char => {
            const num = parseIndex(char);
            if (num !== null && num > maxNum) {
                maxNum = num;
            }
        });
        const newChars = [...characters, `Entity-${maxNum + 1}`];
        onChange(newChars);
    };

    return (
        <div className="flex flex-wrap items-center gap-1">
            {characters.map((char, idx) => {
                const num = parseIndex(char) ?? '?';
                const displayText = `ENT-${num}`;
                return (
                    <div key={idx} className="flex items-center bg-gray-900 rounded px-1 border border-gray-600 h-6">
                         <span className="text-xs font-mono text-gray-300 mr-1 select-none" title={char}>{displayText}</span>
                         <div className="flex flex-col -space-y-0.5">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleChangeIndex(idx, 1); }}
                                className="text-[8px] leading-none text-gray-500 hover:text-white"
                            >▲</button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleChangeIndex(idx, -1); }}
                                className="text-[8px] leading-none text-gray-500 hover:text-white"
                            >▼</button>
                         </div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                            className="ml-1 text-xs text-gray-500 hover:text-white"
                         >
                            &times;
                         </button>
                    </div>
                );
            })}
            <button 
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                className="w-6 h-6 flex items-center justify-center bg-gray-900 hover:bg-gray-700 border border-gray-600 rounded text-gray-400 hover:text-white text-xs font-bold"
                title="Add character reference"
            >
                +
            </button>
        </div>
    );
};
