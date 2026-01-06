import React, { useState, useEffect, useMemo, MouseEvent } from 'react';
import { NodeType } from '../../types';
import { useLanguage } from '../../localization';

interface NodeOption {
  type: NodeType;
  title: string;
  icon: React.ReactNode;
}

interface RadialGroup {
    name: string;
    color: 'emerald' | 'purple' | 'cyan' | 'pink' | 'yellow' | 'amber' | 'blue' | 'gray' | 'green' | 'red';
    options: NodeOption[];
}


const SVG_SIZE = 400;
const SVG_CENTER = SVG_SIZE / 2;
const R_OUTER = 184;
const R_INNER = 116;
const DEAD_ZONE_RADIUS = 60;
const ANGLE_OFFSET = Math.PI; // Start at 9 o'clock

const colorMap = {
    emerald: { fill: 'rgba(6, 95, 70, 0.8)', stroke: 'rgba(5, 150, 105, 0.9)', iconBg: 'rgba(5, 150, 105, 1)', iconColor: '#34d399' },
    purple: { fill: 'rgba(91, 33, 182, 0.8)', stroke: 'rgba(124, 58, 237, 0.9)', iconBg: 'rgba(124, 58, 237, 1)', iconColor: '#c084fc' },
    cyan: { fill: 'rgba(21, 94, 117, 0.8)', stroke: 'rgba(6, 182, 212, 0.9)', iconBg: 'rgba(6, 182, 212, 1)', iconColor: '#22d3ee' },
    pink: { fill: 'rgba(157, 23, 77, 0.8)', stroke: 'rgba(219, 39, 119, 0.9)', iconBg: 'rgba(219, 39, 119, 1)', iconColor: '#f472b6' },
    yellow: { fill: 'rgba(180, 83, 9, 0.8)', stroke: 'rgba(234, 179, 8, 0.9)', iconBg: 'rgba(234, 179, 8, 1)', iconColor: '#facc15' },
    amber: { fill: 'rgba(146, 64, 14, 0.8)', stroke: 'rgba(217, 119, 6, 0.9)', iconBg: 'rgba(217, 119, 6, 1)', iconColor: '#fbbf24' },
    blue: { fill: 'rgba(30, 64, 175, 0.8)', stroke: 'rgba(59, 130, 246, 0.9)', iconBg: 'rgba(59, 130, 246, 1)', iconColor: '#60a5fa' },
    gray: { fill: 'rgba(55, 65, 81, 0.8)', stroke: 'rgba(107, 114, 128, 0.9)', iconBg: 'rgb(75, 85, 99)', iconColor: '#9ca3af' },
    green: { fill: 'rgba(22, 163, 74, 0.8)', stroke: 'rgba(21, 128, 61, 0.9)', iconBg: 'rgba(21, 128, 61, 1)', iconColor: '#4ade80' },
    red: { fill: 'rgba(185, 28, 28, 0.8)', stroke: 'rgba(220, 38, 38, 0.9)', iconBg: 'rgba(220, 38, 38, 1)', iconColor: '#f87171' }
};


interface RadialMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAddNode: (type: NodeType) => void;
  onSelectItem: (type: NodeType | null) => void;
}

const RadialMenu: React.FC<RadialMenuProps> = ({
  isOpen,
  position,
  onClose,
  onAddNode,
  onSelectItem,
}) => {
    const { t } = useLanguage();
    const [hoveredItem, setHoveredItem] = useState<NodeOption | null>(null);

    const nodeGroups: RadialGroup[] = useMemo(() => [
        {
            name: t('search.group.input'),
            color: 'emerald',
            options: [
                { type: NodeType.TEXT_INPUT, title: t('search.node.text_input.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h8M12 6v12" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 3h-1a2 2 0 00-2 2v14a2 2 0 002 2h1m12-18h1a2 2 0 012 2v14a2 2 0 01-2 2h-1" /></svg> },
                { type: NodeType.NOTE, title: t('search.node.note.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
                { type: NodeType.DATA_READER, title: t('search.node.data_reader.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
            ]
        },
        {
            name: t('search.group.process'),
            color: 'purple',
            options: [
                { type: NodeType.PROMPT_PROCESSOR, title: t('search.node.prompt_processor.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.672-2.672L11.25 18l1.938-.648a3.375 3.375 0 002.672-2.672L16.25 13l.648 1.938a3.375 3.375 0 002.672 2.672L21.75 18l-1.938.648a3.375 3.375 0 00-2.672 2.672z" /></svg> },
                { type: NodeType.PROMPT_ANALYZER, title: t('search.node.prompt_analyzer.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6M9 11h6M9 8h6" /></svg> },
                { type: NodeType.REROUTE_DOT, title: t('search.node.reroute_dot.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h8m-8 0l4-4m-4 4l4 4m8 0h8m-8 0l4-4m-4 4l4 4" /></svg> },
            ]
        },
        {
            name: t('search.group.scripting'),
            color: 'cyan',
            options: [
                { type: NodeType.IDEA_GENERATOR, title: t('node.title.idea_generator'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0112 18.375V19.5" /></svg> },
                { type: NodeType.SCRIPT_GENERATOR, title: t('search.node.script_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.01M15 12h.01M10.5 16.5h3M15 19.5h-6a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 018.25 4.5h7.5a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0115.75 19.5h-1.5" /></svg> },
                { type: NodeType.SCRIPT_ANALYZER, title: t('search.node.script_analyzer.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V6A2.25 2.25 0 0018.75 3.75H5.25A2.25 2.25 0 003 6v6" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75-.75h-.008a.75.75 0 01-.75-.75v-.008z" /></svg> },
                { type: NodeType.SCRIPT_PROMPT_MODIFIER, title: t('search.node.script_prompt_modifier.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.75l-1.125 1.125m1.125-1.125L16.125 11.5m2.25 1.25l1.125-1.125m-1.125 1.125l-1.125-1.125M15 6l-2.25 2.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 6l2.25-2.25M15 6l-2.25-2.25" /></svg> },
            ]
        },
        {
            name: t('search.group.character'),
            color: 'pink',
            options: [
                { type: NodeType.CHARACTER_GENERATOR, title: t('search.node.character_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
                { type: NodeType.CHARACTER_CARD, title: t('search.node.character_card.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 3.75H4.5A2.25 2.25 0 002.25 6v12A2.25 2.25 0 004.5 20.25h15A2.25 2.25 0 0021.75 18V6A2.25 2.25 0 0019.5 3.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" /></svg> },
                { type: NodeType.CHARACTER_ANALYZER, title: t('search.node.character_analyzer.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25c-3.1 0-5.88-1.5-7.5-3.75m15 3.75c-1.62-2.25-4.4-3.75-7.5-3.75S6.12 12 4.5 14.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg> },
            ]
        },
        {
            name: t('search.group.images'),
            color: 'yellow',
            options: [
                { type: NodeType.IMAGE_GENERATOR, title: t('search.node.image_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                { type: NodeType.IMAGE_PREVIEW, title: t('search.node.image_preview.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> },
            ]
        },
        {
            name: t('search.group.ai'),
            color: 'green',
            options: [
                { type: NodeType.TRANSLATOR, title: t('search.node.translator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L12 6l6 12M8 14h8" /></svg> },
                { type: NodeType.GEMINI_CHAT, title: t('search.node.gemini_chat.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { type: NodeType.ERROR_ANALYZER, title: t('search.node.error_analyzer.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            ]
        },
        {
            name: t('search.group.audio'),
            color: 'blue',
            options: [
                { type: NodeType.SPEECH_SYNTHESIZER, title: t('search.node.speech_synthesizer.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg> },
                { type: NodeType.NARRATOR_TEXT_GENERATOR, title: t('search.node.narrator_text_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3M18 12h3" /></svg> },
                { type: NodeType.AUDIO_TRANSCRIBER, title: t('search.node.audio_transcriber.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12h5m-5 3h5m-5 3h5" /></svg> },
                { type: NodeType.MUSIC_IDEA_GENERATOR, title: t('search.node.music_idea_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" /></svg> },
            ]
        },
        {
            name: t('search.group.youtube'),
            color: 'red',
            options: [
                { type: NodeType.YOUTUBE_TITLE_GENERATOR, title: t('search.node.youtube_title_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 5.25H5.25A2.25 2.25 0 003 7.5v9A2.25 2.25 0 005.25 18.75z" /></svg> },
                { type: NodeType.YOUTUBE_ANALYTICS, title: t('search.node.youtube_analytics'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
            ]
        },
    ], [t]);
    
    const totalItems = useMemo(() => nodeGroups.reduce((sum, group) => sum + group.options.length, 0), [nodeGroups]);


    const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - position.x;
        const dy = e.clientY - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        if (distance < DEAD_ZONE_RADIUS) {
            if (hoveredItem) {
                setHoveredItem(null);
                onSelectItem(null);
            }
            return;
        }
    
        let angle = Math.atan2(dy, dx) - ANGLE_OFFSET;
        if (angle < 0) angle += 2 * Math.PI;
        
        let cumulativeAngle = 0;
        let foundItem: NodeOption | null = null;

        for (const group of nodeGroups) {
            const groupAngle = (group.options.length / totalItems) * (2 * Math.PI);
            
            if (angle >= cumulativeAngle && angle < cumulativeAngle + groupAngle) {
                const angleInGroup = angle - cumulativeAngle;
                const itemAngle = groupAngle / group.options.length;
                const itemIndex = Math.floor(angleInGroup / itemAngle);
                
                if (itemIndex >= 0 && itemIndex < group.options.length) {
                    foundItem = group.options[itemIndex];
                }
                break; 
            }
            cumulativeAngle += groupAngle;
        }

        if (hoveredItem !== foundItem) {
            setHoveredItem(foundItem);
            onSelectItem(foundItem ? foundItem.type : null);
        }
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (hoveredItem) {
            onAddNode(hoveredItem.type);
        }
        onClose();
    };

    if (!isOpen) {
        return null;
    }
    
    return (
        <div 
            className="fixed inset-0 z-40 pointer-events-auto"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div 
                className="absolute pointer-events-none"
                style={{ left: position.x - SVG_CENTER, top: position.y - SVG_CENTER }}
            >
                <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
                    <defs>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    
                    <g>
                        {(() => {
                            let cumulativeAngle = ANGLE_OFFSET;
                            return nodeGroups.map((group) => {
                                const groupAngle = (group.options.length / totalItems) * (2 * Math.PI);
                                const startAngle = cumulativeAngle;
                                const endAngle = startAngle + groupAngle;
                                cumulativeAngle = endAngle;

                                const largeArcFlag = groupAngle > Math.PI ? 1 : 0;

                                const path = `
                                    M ${SVG_CENTER + R_INNER * Math.cos(startAngle)} ${SVG_CENTER + R_INNER * Math.sin(startAngle)}
                                    A ${R_INNER} ${R_INNER} 0 ${largeArcFlag} 1 ${SVG_CENTER + R_INNER * Math.cos(endAngle)} ${SVG_CENTER + R_INNER * Math.sin(endAngle)}
                                    L ${SVG_CENTER + R_OUTER * Math.cos(endAngle)} ${SVG_CENTER + R_OUTER * Math.sin(endAngle)}
                                    A ${R_OUTER} ${R_OUTER} 0 ${largeArcFlag} 0 ${SVG_CENTER + R_OUTER * Math.cos(startAngle)} ${SVG_CENTER + R_OUTER * Math.sin(startAngle)}
                                    Z
                                `;

                                return (
                                    <path
                                        key={group.name}
                                        d={path}
                                        stroke="none"
                                        style={{
                                            fill: 'rgba(31, 41, 55, 0.9)',
                                            transition: 'fill 0.2s',
                                        }}
                                    />
                                );
                            });
                        })()}
                    </g>

                    {/* Ring Strokes */}
                    <circle
                        cx={SVG_CENTER}
                        cy={SVG_CENTER}
                        r={R_OUTER}
                        fill="none"
                        stroke="rgba(75, 85, 99, 0.6)"
                        strokeWidth="1"
                    />
                    <circle
                        cx={SVG_CENTER}
                        cy={SVG_CENTER}
                        r={R_INNER}
                        fill="none"
                        stroke="rgba(75, 85, 99, 0.6)"
                        strokeWidth="1"
                    />

                    <g>
                        {(() => {
                            let cumulativeAngle = ANGLE_OFFSET;
                            return nodeGroups.map((group) => {
                                const groupAngle = (group.options.length / totalItems) * (2 * Math.PI);
                                const startAngle = cumulativeAngle;
                                const itemAngle = groupAngle / group.options.length;
                                cumulativeAngle += groupAngle;

                                return group.options.map((item, itemIndex) => {
                                    const angle = startAngle + ((itemIndex + 0.5) * itemAngle);
                                    const radius = (R_INNER + R_OUTER) / 2;
                                    const x = SVG_CENTER + radius * Math.cos(angle);
                                    const y = SVG_CENTER + radius * Math.sin(angle);
                                    const isHovered = hoveredItem === item;

                                    return (
                                        <g key={item.type} transform={`translate(${x}, ${y})`} style={{ pointerEvents: 'none' }}>
                                            <circle
                                                cx="0" cy="0" r="20"
                                                style={{
                                                    fill: isHovered ? colorMap[group.color].iconBg : 'transparent',
                                                    transition: 'transform 0.2s, filter 0.2s, fill 0.2s',
                                                    transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                                                    filter: isHovered ? 'url(#glow)' : 'none',
                                                }}
                                            />
                                            <g transform="translate(-12, -12)" style={{ color: isHovered ? 'white' : colorMap[group.color].iconColor }}>
                                                {React.cloneElement(item.icon as React.ReactElement, { width: 24, height: 24 } as any)}
                                            </g>
                                        </g>
                                    );
                                });
                            });
                        })()}
                    </g>
                    {hoveredItem && (
                        <foreignObject x="0" y="0" width={SVG_SIZE} height={SVG_SIZE} style={{ pointerEvents: 'none' }}>
                            <div className="relative w-full h-full">
                                {(() => {
                                    const hoveredGroup = nodeGroups.find(g => g.options.includes(hoveredItem!));
                                    const bgColor = hoveredGroup ? colorMap[hoveredGroup.color].iconBg : colorMap.gray.iconBg;
                                    
                                    return (
                                        <div 
                                            style={{ backgroundColor: bgColor }}
                                            className="w-14 h-14 rounded-lg flex items-center justify-center text-white absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2">
                                            {React.cloneElement(hoveredItem.icon as React.ReactElement, { className: "h-8 w-8" } as any)}
                                        </div>
                                    );
                                })()}
                                <p className="absolute top-[42%] left-1/2 -translate-x-1/2 mt-9 w-40 text-center font-bold text-white drop-shadow-lg">{hoveredItem.title}</p>
                            </div>
                        </foreignObject>
                    )}
                </svg>
            </div>
        </div>
    );
};

export default RadialMenu;