
import React, { useMemo, useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { NodeType, Tool, Point } from '../../types';
import { useLanguage } from '../../localization';
import { useAppContext } from '../../contexts/Context';
import Tooltip from '../ui/Tooltip';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAddNode: (type: NodeType) => void;
  slots: (NodeType | null)[];
  onAssignSlot: (index: number, type: NodeType | null) => void;
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

const ToolButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, title: string }> = ({ active, onClick, icon, title }) => (
    <Tooltip title={title} position="top">
        <button 
            onClick={onClick}
            className={`rounded-md flex items-center justify-center transition-colors w-8 h-8 ${active ? 'bg-emerald-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
        >
            {icon}
        </button>
    </Tooltip>
);

interface NodeGroup {
    title: string;
    items: { type: NodeType, title: string, icon: React.ReactNode }[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
    isOpen, position, onClose, onAddNode, slots, onAssignSlot, activeTool, onToolChange
}) => {
    const { t } = useLanguage();
    const { isContextMenuPinned, toggleContextMenuPin, viewTransform, setZoom, handlePasteFromClipboard } = useAppContext();
    const menuRef = useRef<HTMLDivElement>(null);
    const [pickingSlotIndex, setPickingSlotIndex] = useState<number | null>(null);
    
    // State for Dragging and Visibility
    const [menuLocation, setMenuLocation] = useState<Point>(position);
    const [isVisible, setIsVisible] = useState(false);

    const isDraggingRef = useRef(false);
    const dragOffset = useRef<Point>({ x: 0, y: 0 });

    // Initialize position synchronously to prevent flicker
    useLayoutEffect(() => {
        if (isOpen) {
            setMenuLocation(position);
            setPickingSlotIndex(null);
            
            // Trigger animation
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        } else {
            setIsVisible(false);
        }
    }, [isOpen, position]);

    // Apply position to DOM
    useLayoutEffect(() => {
        if (menuRef.current) {
            menuRef.current.style.left = `${menuLocation.x}px`;
            menuRef.current.style.top = `${menuLocation.y}px`;
        }
    }, [menuLocation]);

    const handleWindowMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current || !menuRef.current) return;
        e.preventDefault();
        
        const x = e.clientX - dragOffset.current.x;
        const y = e.clientY - dragOffset.current.y;
        
        // Direct DOM manipulation for smooth dragging
        menuRef.current.style.left = `${x}px`;
        menuRef.current.style.top = `${y}px`;
    }, []);

    const handleWindowMouseUp = useCallback((e: MouseEvent) => {
        if (isDraggingRef.current && menuRef.current) {
             const x = e.clientX - dragOffset.current.x;
             const y = e.clientY - dragOffset.current.y;
             setMenuLocation({ x, y });
        }
        isDraggingRef.current = false;
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        
        const rect = menuRef.current?.getBoundingClientRect();
        if (rect) {
            isDraggingRef.current = true;
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
        }
    };
    
    const handlePaste = useCallback(async () => {
        await handlePasteFromClipboard();
        if (!isContextMenuPinned) onClose();
    }, [handlePasteFromClipboard, isContextMenuPinned, onClose]);

    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [handleWindowMouseMove, handleWindowMouseUp]);


    // Zoom Logic
    const scaleToSliderValue = (scale: number) => {
        const scaleNum = Number(scale);
        const minScale = 0.2;
        const maxScale = 2.0;
        if (scaleNum < 1.0) {
            const base = Math.pow(1.0 / minScale, 1 / 100);
            return (Math.log(scaleNum / minScale) / Math.log(base)) - 100;
        }
        const base = Math.pow(maxScale, 1 / 100);
        return Math.log(scaleNum) / Math.log(base);
    };
    
    const sliderValueToScale = (value: number) => {
        const valueNum = Number(value);
        const minScale = 0.2;
        const maxScale = 2.0;
        if (valueNum < 0) {
            const base = Math.pow(1.0 / minScale, 1 / 100);
            return Math.pow(base, valueNum + 100) * minScale;
        }
        const base = Math.pow(maxScale, 1 / 100);
        return Math.pow(base, valueNum);
    };

    const handleZoomChange = (newScale: number) => {
        setZoom(newScale, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    };

    const handleSlotClick = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (slots[index] && !e.shiftKey) {
             onAddNode(slots[index]!);
             if (!isContextMenuPinned) onClose();
        } else {
             setPickingSlotIndex(index);
        }
    };

    const handleSlotRightClick = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPickingSlotIndex(index);
    };

    const handleToolClick = (tool: Tool) => {
        onToolChange(tool);
        if (!isContextMenuPinned) onClose();
    };

    const groups: NodeGroup[] = useMemo(() => [
      {
        title: t('search.group.input'),
        items: [
          { type: NodeType.TEXT_INPUT, title: t('search.node.text_input.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h8M12 6v12" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 3h-1a2 2 0 00-2 2v14a2 2 0 002 2h1m12-18h1a2 2 0 012 2v14a2 2 0 01-2 2h-1" /></svg> },
          { type: NodeType.NOTE, title: t('search.node.note.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
          { type: NodeType.DATA_READER, title: t('search.node.data_reader.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        ]
      },
      {
        title: t('search.group.process'),
        items: [
          { type: NodeType.PROMPT_PROCESSOR, title: t('search.node.prompt_processor.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.672-2.672L11.25 18l1.938-.648a3.375 3.375 0 002.672-2.672L16.25 13l.648 1.938a3.375 3.375 0 002.672 2.672L21.75 18l-1.938.648a3.375 3.375 0 00-2.672 2.672z" /></svg> },
          { type: NodeType.PROMPT_ANALYZER, title: t('search.node.prompt_analyzer.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6M9 11h6M9 8h6" /></svg> },
          { type: NodeType.REROUTE_DOT, title: t('search.node.reroute_dot.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h8m-8 0l4-4m-4 4l4 4m8 0h8m-8 0l4-4m-4 4l4 4" /></svg> },
        ]
      },
      {
        title: t('search.group.scripting'),
        items: [
           { type: NodeType.IDEA_GENERATOR, title: t('search.node.idea_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0112 18.375V19.5" /></svg> },
           { type: NodeType.SCRIPT_GENERATOR, title: t('search.node.script_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.01M15 12h.01M10.5 16.5h3M15 19.5h-6a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 018.25 4.5h7.5a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0115.75 19.5h-1.5" /></svg> },
           { type: NodeType.SCRIPT_ANALYZER, title: t('search.node.script_analyzer.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V6A2.25 2.25 0 0018.75 3.75H5.25A2.25 2.25 0 003 6v6" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75-.75h-.008a.75.75 0 01-.75-.75v-.008z" /></svg> },
           { type: NodeType.SCRIPT_PROMPT_MODIFIER, title: t('search.node.script_prompt_modifier.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.75l-1.125 1.125m1.125-1.125L16.125 11.5m2.25 1.25l1.125-1.125m-1.125 1.125l-1.125-1.125M15 6l-2.25 2.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 6l2.25-2.25M15 6l-2.25-2.25" /></svg> },
        ]
      },
      {
        title: t('search.group.character'),
        items: [
           { type: NodeType.CHARACTER_GENERATOR, title: t('search.node.character_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
           { type: NodeType.CHARACTER_CARD, title: t('search.node.character_card.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 3.75H4.5A2.25 2.25 0 002.25 6v12A2.25 2.25 0 004.5 20.25h15A2.25 2.25 0 0021.75 18V6A2.25 2.25 0 0019.5 3.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" /></svg> },
           { type: NodeType.CHARACTER_ANALYZER, title: t('search.node.character_analyzer.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25c-3.1 0-5.88-1.5-7.5-3.75m15 3.75c-1.62-2.25-4.4-3.75-7.5-3.75S6.12 12 4.5 14.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg> },
        ]
      },
      {
        title: t('search.group.images'),
        items: [
           { type: NodeType.IMAGE_GENERATOR, title: t('search.node.image_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
           { type: NodeType.IMAGE_PREVIEW, title: t('search.node.image_preview.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> },
        ]
      },
      {
        title: t('search.group.ai'),
        items: [
           { type: NodeType.TRANSLATOR, title: t('search.node.translator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L12 6l6 12M8 14h8" /></svg> },
           { type: NodeType.GEMINI_CHAT, title: t('search.node.gemini_chat.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
           { type: NodeType.ERROR_ANALYZER, title: t('search.node.error_analyzer.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        ]
      },
      {
        title: t('search.group.audio'),
        items: [
          { type: NodeType.SPEECH_SYNTHESIZER, title: t('search.node.speech_synthesizer.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg> },
          { type: NodeType.NARRATOR_TEXT_GENERATOR, title: t('search.node.narrator_text_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3M18 12h3" /></svg> },
          { type: NodeType.AUDIO_TRANSCRIBER, title: t('search.node.audio_transcriber.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12h5m-5 3h5m-5 3h5" /></svg> },
          { type: NodeType.MUSIC_IDEA_GENERATOR, title: t('search.node.music_idea_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" /></svg> },
        ]
      },
      {
        title: t('search.group.youtube'),
        items: [
            { type: NodeType.YOUTUBE_TITLE_GENERATOR, title: t('search.node.youtube_title_generator.title'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 5.25H5.25A2.25 2.25 0 003 7.5v9A2.25 2.25 0 005.25 18.75z" /></svg> },
            { type: NodeType.YOUTUBE_ANALYTICS, title: t('node.title.youtube_analytics'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
        ]
      },
    ], [t]);

    const getIconForType = (type: NodeType) => {
        for (const group of groups) {
            const item = group.items.find(i => i.type === type);
            if (item) return item.icon;
        }
        return null;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Main Menu */}
            <div 
                ref={menuRef}
                className={`fixed bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl p-1.5 flex flex-col space-y-1.5 z-50 cursor-default transition-[opacity,transform] duration-200 ease-out origin-top-left ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${isContextMenuPinned ? 'pinned-menu' : ''}`}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                onContextMenu={e => e.preventDefault()}
            >
                {/* Header - Drag Handle & Pin */}
                <div className="flex items-center justify-between pb-1 border-b border-gray-600 cursor-move w-full" onMouseDown={handleMouseDown}>
                    <span className="text-xs text-gray-400 font-semibold px-1 select-none">{t('contextMenu.tools')}</span>
                    <Tooltip title={isContextMenuPinned ? "Unpin" : "Pin"} position="left">
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleContextMenuPin(); }}
                            className={`p-1 rounded hover:bg-gray-700 transition-colors ${isContextMenuPinned ? 'text-emerald-400' : 'text-gray-400'}`}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                             {isContextMenuPinned ? (
                                // Solid Star (Pinned)
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                // Outline Star (Unpinned)
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.563.045.796.77.357 1.145l-4.163 3.566a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.163-3.566c-.44-.375-.206-1.1.357-1.145l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                            )}
                        </button>
                    </Tooltip>
                </div>

                {/* Top Row: Tools */}
                <div className="grid grid-cols-4 gap-0.5">
                    <ToolButton 
                        active={activeTool === 'edit'} 
                        onClick={() => handleToolClick('edit')} 
                        title={t('toolbar.edit')} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>} 
                    />
                    <ToolButton 
                        active={activeTool === 'cutter'} 
                        onClick={() => handleToolClick('cutter')} 
                        title={t('toolbar.cutter')} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
                    />
                    <ToolButton 
                        active={activeTool === 'selection'} 
                        onClick={() => handleToolClick('selection')} 
                        title={t('toolbar.selection')} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" d="M3.75 3.75h16.5v16.5H3.75z" /></svg>} 
                    />
                    <ToolButton 
                        active={activeTool === 'reroute'} 
                        onClick={() => handleToolClick('reroute')} 
                        title={t('toolbar.reroute')} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h8m-8 0l4-4m-4 4l4 4m8 0h8m-8 0l4-4m-4 4l4 4" /></svg>} 
                    />
                </div>

                <div className="h-px bg-gray-600 w-full my-0.5"></div>

                {/* Slots Grid */}
                <div className="grid grid-cols-4 gap-0.5">
                    {slots.map((slotType, index) => (
                        <Tooltip 
                            key={index} 
                            title={slotType ? t('contextMenu.addNodeFromSlot', { node: t(`node.title.${slotType.toLowerCase()}` as any), index: index + 1 }) : t('contextMenu.assignSlot', { index: index + 1 })}
                            position="bottom"
                        >
                            <button
                                onClick={(e) => handleSlotClick(index, e)}
                                onContextMenu={(e) => handleSlotRightClick(index, e)}
                                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors relative group ${slotType ? 'bg-gray-700 hover:bg-emerald-600 text-emerald-400' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-500'}`}
                            >
                                {slotType ? getIconForType(slotType) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                )}
                                <span className="absolute top-0.5 right-0.5 text-[8px] font-mono text-gray-500 group-hover:text-gray-300">{index + 1}</span>
                            </button>
                        </Tooltip>
                    ))}
                </div>
                
                {/* Zoom Controls Container */}
                 <div className="flex items-center justify-center space-x-2 pt-1 border-t border-gray-600 w-full">
                    <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        step="1" 
                        value={scaleToSliderValue(viewTransform.scale)} 
                        onChange={(e) => handleZoomChange(sliderValueToScale(parseFloat(e.target.value)))} 
                        className="w-20 min-w-0 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                    />
                    <button onClick={() => handleZoomChange(1)} className="text-[10px] font-semibold text-gray-400 hover:text-white w-8 text-center hover:bg-emerald-600 rounded py-0.5 flex-shrink-0">
                        {Math.round(viewTransform.scale * 100)}%
                    </button>
                </div>
                 
                 {/* Footer Hint */}
                 <div className="text-[10px] text-gray-500 text-center pt-1 select-none border-t border-gray-700/50 w-full">
                     Key 1-8 to Quick Add
                 </div>

                {/* Paste Button */}
                <div className="h-px bg-gray-700 w-full my-0.5"></div>
                <button 
                    onClick={handlePaste}
                    className="w-full flex items-center justify-center space-x-2 p-1 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-xs font-semibold"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>{t('contextMenu.paste')}</span>
                </button>
            </div>

            {/* Slot Picking Overlay */}
            {pickingSlotIndex !== null && (
                <>
                    <div 
                        className="fixed inset-0 z-[59] bg-transparent"
                        onClick={(e) => {
                            e.stopPropagation();
                            setPickingSlotIndex(null);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    <div 
                        className="fixed z-[60] bg-gray-800 rounded-lg border border-gray-700 shadow-xl flex flex-col overflow-hidden max-h-[400px] w-64 cursor-default"
                        style={{ left: menuLocation.x + 20, top: menuLocation.y + 20 }}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                    >
                        <div className="p-2 bg-gray-900 border-b border-gray-700 font-semibold text-gray-300 text-sm flex justify-between items-center">
                            <span>{t('contextMenu.assignSlot', { index: pickingSlotIndex + 1 })}</span>
                            <button onClick={() => setPickingSlotIndex(null)} className="text-gray-500 hover:text-white">&times;</button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-1">
                                {groups.map((group, idx) => (
                                <div key={idx} className="mb-2">
                                    <div className="px-2 py-1 text-xs font-bold text-gray-500 uppercase">{group.title}</div>
                                    {group.items.map(item => (
                                        <button
                                            key={item.type}
                                            onClick={() => { onAssignSlot(pickingSlotIndex, item.type); setPickingSlotIndex(null); }}
                                            className="w-full flex items-center space-x-2 px-2 py-1.5 hover:bg-emerald-600 rounded-md text-left text-sm text-gray-300 hover:text-white transition-colors"
                                        >
                                            <div className="text-gray-400 group-hover:text-white">{item.icon}</div>
                                            <span>{item.title}</span>
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default React.memo(ContextMenu);
