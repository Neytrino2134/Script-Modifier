
import React, { useMemo, useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { NodeType, Tool, Point } from '../../types';
import { useLanguage } from '../../localization';
import { useAppContext } from '../../contexts/Context';

interface QuickAddMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAddNode: (type: NodeType) => void;
  onToolChange: (tool: Tool) => void;
}

const QuickAddItem: React.FC<{ title: string; onClick: () => void; children: React.ReactNode }> = ({ title, onClick, children }) => {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsTooltipVisible(true)}
            onMouseLeave={() => setIsTooltipVisible(false)}
        >
            <button
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag start on buttons
                className="flex items-center justify-center bg-gray-700 rounded-md hover:bg-emerald-600 transition-colors text-gray-300 hover:text-white w-9 h-9"
            >
                {children}
            </button>
            <div
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-gray-100 text-sm whitespace-nowrap rounded-md shadow-xl z-50 transition-opacity duration-200 origin-bottom transform ${isTooltipVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                role="tooltip"
            >
                {title}
            </div>
        </div>
    );
};

interface QuickAddMenuItem {
    type: 'tool' | 'node';
    id: Tool | NodeType;
    title: string;
    icon: React.ReactNode;
}

interface QuickAddMenuGroup {
    title: string;
    items: QuickAddMenuItem[];
}

const QuickAddMenu: React.FC<QuickAddMenuProps> = ({ isOpen, position, onClose, onAddNode, onToolChange }) => {
    // ... existing implementation remains the same ...
    const { t } = useLanguage();
    const { isQuickAddPinned, toggleQuickAddPin, handlePasteFromClipboard } = useAppContext();
    const menuRef = useRef<HTMLDivElement>(null);
    
    // Dragging state
    const [menuLocation, setMenuLocation] = useState<Point>(position);
    const [isVisible, setIsVisible] = useState(false);
    const isDraggingRef = useRef(false);
    const dragOffset = useRef<Point>({ x: 0, y: 0 });

    // Initialize position logic
    useLayoutEffect(() => {
        if (isOpen) {
            // Determine best position if not already moved/pinned or just opening fresh
            const menuRect = menuRef.current ? menuRef.current.getBoundingClientRect() : { width: 300, height: 400 };
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const offset = 20;

            // We use the passed 'position' prop as the anchor point
            let bestLeft = position.x + offset;
            let bestTop = position.y + offset;

            // Simple boundary check
            if (bestLeft + menuRect.width > windowWidth) bestLeft = position.x - menuRect.width - offset;
            if (bestTop + menuRect.height > windowHeight) bestTop = position.y - menuRect.height - offset;
            if (bestLeft < 0) bestLeft = offset;
            if (bestTop < 0) bestTop = offset;

            // If opening fresh (not dragging), reset location
            if (!isDraggingRef.current) {
               setMenuLocation({ x: bestLeft, y: bestTop });
            }

            requestAnimationFrame(() => setIsVisible(true));
            setTimeout(() => menuRef.current?.focus(), 50);
        } else {
            setIsVisible(false);
        }
    }, [isOpen, position]);

    // Update DOM position
    useLayoutEffect(() => {
        if (menuRef.current) {
            menuRef.current.style.left = `${menuLocation.x}px`;
            menuRef.current.style.top = `${menuLocation.y}px`;
        }
    }, [menuLocation]);

    // Drag Handlers
    const handleWindowMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current || !menuRef.current) return;
        e.preventDefault();
        const x = e.clientX - dragOffset.current.x;
        const y = e.clientY - dragOffset.current.y;
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
        // Allow dragging by clicking anywhere on background
        if (e.button !== 0) return;
        
        // STOP PROPAGATION to prevent closing unpinned menu
        e.stopPropagation();

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
        if (!isQuickAddPinned) onClose();
    }, [handlePasteFromClipboard, isQuickAddPinned, onClose]);

    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [handleWindowMouseMove, handleWindowMouseUp]);


    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
        }
    };

    const menuGroups: Record<string, QuickAddMenuGroup> = useMemo(() => ({
      tools: {
        title: t('hotkeys.tools.title'),
        items: [
          { type: 'tool', id: 'edit', title: t('toolbar.edit'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> },
          { type: 'tool', id: 'cutter', title: t('toolbar.cutter'), icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { type: 'tool', id: 'selection', title: t('toolbar.selection'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" d="M3.75 3.75h16.5v16.5H3.75z" /></svg> },
          { type: 'tool', id: 'reroute', title: t('toolbar.reroute'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h8m-8 0l4-4m-4 4l4 4m8 0h8m-8 0l4-4m-4 4l4 4" /></svg> },
        ]
      },
      general_youtube: {
        title: `${t('toolbar.group.general')} / ${t('toolbar.group.youtube')}`,
        items: [
          { type: 'node', id: NodeType.NOTE, title: t('toolbar.addNote'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
          { type: 'node', id: NodeType.DATA_READER, title: t('toolbar.addDataReader'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
          { type: 'node', id: NodeType.YOUTUBE_TITLE_GENERATOR, title: t('toolbar.addYouTubeTitleGenerator'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 5.25H5.25A2.25 2.25 0 003 7.5v9A2.25 2.25 0 005.25 18.75z" /></svg> },
          { type: 'node', id: NodeType.YOUTUBE_ANALYTICS, title: t('toolbar.addYouTubeAnalytics'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
        ]
      },
       prompting: {
        title: t('toolbar.group.prompting'),
        items: [
          { type: 'node', id: NodeType.TEXT_INPUT, title: t('toolbar.addTextInput'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h8M12 6v12" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 3h-1a2 2 0 00-2 2v14a2 2 0 002 2h1m12-18h1a2 2 0 012 2v14a2 2 0 01-2 2h-1" /></svg> },
          { type: 'node', id: NodeType.PROMPT_PROCESSOR, title: t('toolbar.addPromptProcessor'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.672-2.672L11.25 18l1.938-.648a3.375 3.375 0 002.672 2.672L16.25 13l.648 1.938a3.375 3.375 0 002.672 2.672L21.75 18l-1.938.648a3.375 3.375 0 00-2.672 2.672z" /></svg> },
          { type: 'node', id: NodeType.PROMPT_ANALYZER, title: t('toolbar.addPromptAnalyzer'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6M9 11h6M9 8h6" /></svg> },
        ]
      },
      scripting: {
        title: t('toolbar.group.scripting'),
        items: [
           { type: 'node', id: NodeType.IDEA_GENERATOR, title: t('toolbar.addIdeaGenerator'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0112 18.375V19.5" /></svg> },
           { type: 'node', id: NodeType.SCRIPT_GENERATOR, title: t('toolbar.addScriptGenerator'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.01M15 12h.01M10.5 16.5h3M15 19.5h-6a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 018.25 4.5h7.5a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0115.75 19.5h-1.5" /></svg> },
           { type: 'node', id: NodeType.SCRIPT_ANALYZER, title: t('toolbar.addScriptAnalyzer'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V6A2.25 2.25 0 0018.75 3.75H5.25A2.25 2.25 0 003 6v6" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75-.75h-.008a.75.75 0 01-.75-.75v-.008z" /></svg> },
           { type: 'node', id: NodeType.SCRIPT_PROMPT_MODIFIER, title: t('toolbar.addScriptPromptModifier'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.75l-1.125 1.125m1.125-1.125L16.125 11.5m2.25 1.25l1.125-1.125m-1.125 1.125l-1.125-1.125M15 6l-2.25 2.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 6l2.25-2.25M15 6l-2.25-2.25" /></svg> },
        ]
      },
      characters: {
        title: t('toolbar.group.characters'),
        items: [
           { type: 'node', id: NodeType.CHARACTER_GENERATOR, title: t('toolbar.addCharacterGenerator'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
           { type: 'node', id: NodeType.CHARACTER_CARD, title: t('toolbar.addCharacterCard'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 3.75H4.5A2.25 2.25 0 002.25 6v12A2.25 2.25 0 004.5 20.25h15A2.25 2.25 0 0021.75 18V6A2.25 2.25 0 0019.5 3.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" /></svg> },
           { type: 'node', id: NodeType.CHARACTER_ANALYZER, title: t('toolbar.addCharacterAnalyzer'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25c-3.1 0-5.88-1.5-7.5-3.75m15 3.75c-1.62-2.25-4.4-3.75-7.5-3.75S6.12 12 4.5 14.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg> },
        ]
      },
      images: {
        title: t('toolbar.group.images'),
        items: [
           { type: 'node', id: NodeType.IMAGE_GENERATOR, title: t('toolbar.addImageGenerator'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
           { type: 'node', id: NodeType.IMAGE_PREVIEW, title: t('toolbar.addImagePreview'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> },
        ]
      },
      ai: {
        title: t('toolbar.group.ai'),
        items: [
           { type: 'node', id: NodeType.TRANSLATOR, title: t('toolbar.addTranslator'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L12 6l6 12M8 14h8" /></svg> },
           { type: 'node', id: NodeType.GEMINI_CHAT, title: t('toolbar.addGeminiChat'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
           { type: 'node', id: NodeType.ERROR_ANALYZER, title: t('toolbar.addErrorAnalyzer'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        ]
      },
      audio: {
        title: t('toolbar.group.audio'),
        items: [
          { type: 'node', id: NodeType.SPEECH_SYNTHESIZER, title: t('toolbar.addSpeechSynthesizer'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg> },
          { type: 'node', id: NodeType.NARRATOR_TEXT_GENERATOR, title: t('toolbar.addNarratorTextGenerator'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3M18 12h3" /></svg> },
          { type: 'node', id: NodeType.AUDIO_TRANSCRIBER, title: t('toolbar.addAudioTranscriber'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12h5m-5 3h5m-5 3h5" /></svg> },
          { type: 'node', id: NodeType.MUSIC_IDEA_GENERATOR, title: t('toolbar.addMusicIdeaGenerator'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" /></svg> },
        ]
      },
    }), [t]);

    // ... (rest of QuickAddMenu remains unchanged)
    const handleClick = (item: QuickAddMenuItem) => {
        if (item.type === 'tool') {
            onToolChange(item.id as Tool);
        } else if (item.type === 'node') {
            onAddNode(item.id as NodeType);
        }
        if (!isQuickAddPinned) {
            onClose();
        }
    };

    const column1Keys = ['tools', 'audio', 'characters', 'prompting'];
    const column2Keys = ['scripting', 'general_youtube', 'ai', 'images'];

    const renderGroup = (group: QuickAddMenuGroup) => (
        <div className="w-full">
          <span className="text-xs text-gray-400 font-semibold px-1">{group.title}</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {group.items.map(item => (
              <QuickAddItem key={item.id} title={item.title} onClick={() => handleClick(item)}>
                  {item.icon}
              </QuickAddItem>
            ))}
          </div>
        </div>
    );
    
    if (!isOpen) {
        return null;
    }

    return (
        <div
            ref={menuRef}
            tabIndex={-1}
            className={`fixed bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 p-2 flex flex-col items-start z-[51] focus:outline-none cursor-default transition-[opacity,transform] duration-200 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${isQuickAddPinned ? 'pinned-menu' : ''}`}
            style={{ left: menuLocation.x, top: menuLocation.y }}
            onMouseDown={handleMouseDown}
            onKeyDown={handleKeyDown}
        >
            {/* Header Row: Drag Handle & Pin */}
            <div className="flex justify-between items-center w-full mb-1 cursor-move border-b border-gray-700/50 pb-1">
                <span className="text-xs font-bold text-gray-500 uppercase px-1 select-none">{t('quickAddMenu.title')}</span>
                <button
                    onClick={(e) => { e.stopPropagation(); toggleQuickAddPin(); }}
                    className={`p-1 rounded hover:bg-emerald-600 hover:text-white transition-colors ${isQuickAddPinned ? 'text-emerald-400' : 'text-gray-400'}`}
                    title={isQuickAddPinned ? "Unpin" : "Pin"}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {isQuickAddPinned ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.563.045.796.77.357 1.145l-4.163 3.566a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.163-3.566c-.44-.375-.206-1.1.357-1.145l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                    )}
                </button>
            </div>

            <div className="flex flex-row items-start gap-2 w-full">
                <div className="flex flex-col space-y-2 w-full">
                    {column1Keys.map(key => menuGroups[key] && <div key={key}>{renderGroup(menuGroups[key])}</div>)}
                </div>
                <div className="flex flex-col space-y-2 w-full">
                    {column2Keys.map(key => menuGroups[key] && <div key={key}>{renderGroup(menuGroups[key])}</div>)}
                </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-gray-700 w-full my-1"></div>

            {/* Paste Button */}
            <button 
                onClick={handlePaste}
                className="w-full flex items-center justify-center space-x-2 p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-xs font-semibold"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>{t('contextMenu.paste')}</span>
            </button>
        </div>
    );
};

export default QuickAddMenu;
