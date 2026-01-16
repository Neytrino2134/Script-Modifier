
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NodeType } from '../../types';
import { useLanguage } from '../../localization';

interface NodeOption {
  type: NodeType;
  title: string;
  description: string;
  icon: React.ReactNode;
  group: 'input' | 'process' | 'scripting' | 'character' | 'images' | 'ai' | 'audio' | 'youtube';
}

interface QuickSearchMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (type: NodeType) => void;
}

const QuickSearchMenu: React.FC<QuickSearchMenuProps> = ({ isOpen, onClose, onAddNode }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const nodeOptions: NodeOption[] = useMemo(() => [
    // Group: Input
    { group: 'input', type: NodeType.TEXT_INPUT, title: t('search.node.text_input.title'), description: t('search.node.text_input.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h8M12 6v12" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 3h-1a2 2 0 00-2 2v14a2 2 0 002 2h1m12-18h1a2 2 0 012 2v14a2 2 0 01-2 2h-1" /></svg> },
    { group: 'input', type: NodeType.NOTE, title: t('search.node.note.title'), description: t('search.node.note.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
    // Group: Scripting
    { group: 'scripting', type: NodeType.IDEA_GENERATOR, title: t('search.node.idea_generator.title'), description: t('search.node.idea_generator.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0112 18.375V19.5" /></svg> },
    { group: 'scripting', type: NodeType.SCRIPT_GENERATOR, title: t('search.node.script_generator.title'), description: t('search.node.script_generator.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.01M15 12h.01M10.5 16.5h3M15 19.5h-6a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 018.25 4.5h7.5a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0115.75 19.5h-1.5" /></svg> },
    { group: 'scripting', type: NodeType.SCRIPT_ANALYZER, title: t('search.node.script_analyzer.title'), description: t('search.node.script_analyzer.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V6A2.25 2.25 0 0018.75 3.75H5.25A2.25 2.25 0 003 6v6" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75-.75h-.008a.75.75 0 01-.75-.75v-.008z" /></svg> },
    { group: 'scripting', type: NodeType.SCRIPT_PROMPT_MODIFIER, title: t('search.node.script_prompt_modifier.title'), description: t('search.node.script_prompt_modifier.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.75l-1.125 1.125m1.125-1.125L16.125 11.5m2.25 1.25l1.125-1.125m-1.125 1.125l-1.125-1.125M15 6l-2.25 2.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 6l2.25-2.25M15 6l-2.25-2.25" /></svg> },
    // Group: Processing
    { group: 'process', type: NodeType.PROMPT_PROCESSOR, title: t('search.node.prompt_processor.title'), description: t('search.node.prompt_processor.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.672-2.672L11.25 18l1.938-.648a3.375 3.375 0 002.672-2.672L16.25 13l.648 1.938a3.375 3.375 0 002.672 2.672L21.75 18l-1.938.648a3.375 3.375 0 00-2.672 2.672z" /></svg> },
    { group: 'process', type: NodeType.PROMPT_ANALYZER, title: t('search.node.prompt_analyzer.title'), description: t('search.node.prompt_analyzer.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6M9 11h6M9 8h6" /></svg> },
    { group: 'process', type: NodeType.DATA_READER, title: t('search.node.data_reader.title'), description: t('search.node.data_reader.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { group: 'process', type: NodeType.REROUTE_DOT, title: t('search.node.reroute_dot.title'), description: t('search.node.reroute_dot.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h8m-8 0l4-4m-4 4l4 4m8 0h8m-8 0l4-4m-4 4l4 4" /></svg> },
    // Group: Characters
    { group: 'character', type: NodeType.CHARACTER_GENERATOR, title: t('search.node.character_generator.title'), description: t('search.node.character_generator.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { group: 'character', type: NodeType.CHARACTER_CARD, title: t('search.node.character_card.title'), description: t('search.node.character_card.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 3.75H4.5A2.25 2.25 0 002.25 6v12A2.25 2.25 0 004.5 20.25h15A2.25 2.25 0 0021.75 18V6A2.25 2.25 0 0019.5 3.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" /></svg> },
    { group: 'character', type: NodeType.CHARACTER_ANALYZER, title: t('search.node.character_analyzer.title'), description: t('search.node.character_analyzer.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25c-3.1 0-5.88-1.5-7.5-3.75m15 3.75c-1.62-2.25-4.4-3.75-7.5-3.75S6.12 12 4.5 14.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg> },
    // Group: Images
    { group: 'images', type: NodeType.IMAGE_GENERATOR, title: t('search.node.image_generator.title'), description: t('search.node.image_generator.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { group: 'images', type: NodeType.IMAGE_PREVIEW, title: t('search.node.image_preview.title'), description: t('search.node.image_preview.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> },
    { group: 'images', type: NodeType.IMAGE_EDITOR, title: t('search.node.image_editor.title'), description: t('search.node.image_editor.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg> },
    // Group: AI Tools
    { group: 'ai', type: NodeType.TRANSLATOR, title: t('search.node.translator.title'), description: t('search.node.translator.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L12 6l6 12M8 14h8" /></svg> },
    { group: 'ai', type: NodeType.GEMINI_CHAT, title: t('search.node.gemini_chat.title'), description: t('search.node.gemini_chat.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { group: 'ai', type: NodeType.ERROR_ANALYZER, title: t('search.node.error_analyzer.title'), description: t('search.node.error_analyzer.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { group: 'ai', type: NodeType.YOUTUBE_TITLE_GENERATOR, title: t('search.node.youtube_title_generator.title'), description: t('search.node.youtube_title_generator.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 5.25H5.25A2.25 2.25 0 003 7.5v9A2.25 2.25 0 005.25 18.75z" /></svg> },
    { group: 'ai', type: NodeType.YOUTUBE_ANALYTICS, title: t('node.title.youtube_analytics'), description: t('node.help.youtube_analytics'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
    // Group: Audio Tools
    { group: 'audio', type: NodeType.SPEECH_SYNTHESIZER, title: t('search.node.speech_synthesizer.title'), description: t('search.node.speech_synthesizer.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg> },
    { group: 'audio', type: NodeType.NARRATOR_TEXT_GENERATOR, title: t('search.node.narrator_text_generator.title'), description: t('search.node.narrator_text_generator.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3M18 12h3" /></svg> },
    { group: 'audio', type: NodeType.AUDIO_TRANSCRIBER, title: t('search.node.audio_transcriber.title'), description: t('search.node.audio_transcriber.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12h5m-5 3h5m-5 3h5" /></svg> },
    { group: 'audio', type: NodeType.MUSIC_IDEA_GENERATOR, title: t('search.node.music_idea_generator.title'), description: t('search.node.music_idea_generator.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" /></svg> },
    // Group: YouTube
    { group: 'youtube', type: NodeType.YOUTUBE_TITLE_GENERATOR, title: t('search.node.youtube_title_generator.title'), description: t('search.node.youtube_title_generator.description'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 5.25H5.25A2.25 2.25 0 003 7.5v9A2.25 2.25 0 005.25 18.75z" /></svg> },
    { group: 'youtube', type: NodeType.YOUTUBE_ANALYTICS, title: t('node.title.youtube_analytics'), description: t('node.help.youtube_analytics'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
  ], [t]);

  const groupTitles = useMemo(() => ({
    input: t('search.group.input'),
    process: t('search.group.process'),
    scripting: t('search.group.scripting'),
    character: t('search.group.character'), // Changed from characters to character
    images: t('search.group.images'),
    ai: t('search.group.ai'),
    audio: t('search.group.audio'),
    youtube: t('search.group.youtube'), // Added youtube
  }), [t]);

  const groupStyles: Record<NodeOption['group'], string> = {
    input: 'bg-purple-800/50 text-purple-300',
    process: 'bg-green-800/50 text-green-300',
    scripting: 'bg-cyan-800/50 text-cyan-300',
    character: 'bg-pink-800/50 text-pink-300',
    images: 'bg-yellow-800/50 text-yellow-300',
    ai: 'bg-green-800/50 text-green-300',
    audio: 'bg-blue-800/50 text-blue-300',
    youtube: 'bg-red-800/50 text-red-300',
  };

  const filteredNodes = nodeOptions.filter(node => 
    node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Animation Logic
  useEffect(() => {
    if (isOpen) {
        setIsRendered(true);
        requestAnimationFrame(() => setIsVisible(true));
        setTimeout(() => inputRef.current?.focus(), 50);
        setSearchTerm('');
        setSelectedIndex(0);
    } else {
        setIsVisible(false);
        const timer = setTimeout(() => setIsRendered(false), 200);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < filteredNodes.length) {
      const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, filteredNodes]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredNodes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredNodes[selectedIndex]) {
        onAddNode(filteredNodes[selectedIndex].type);
        onClose();
      }
    }
  };

  if (!isRendered) {
    return null;
  }
  
  return (
    <div 
      className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center transition-opacity duration-200 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onMouseDown={onClose} // Use onMouseDown to prevent click-through on the same event
    >
      <div 
        className={`bg-gray-800 rounded-lg w-full max-w-md border border-gray-700 flex flex-col transition-all duration-200 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-4 border-b border-gray-700">
          <input
            ref={inputRef}
            type="text"
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full px-3 py-2 bg-gray-900 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <ul ref={listRef} className="max-h-80 overflow-y-auto p-2" onWheel={e => e.stopPropagation()}>
          {filteredNodes.length > 0 ? (
            filteredNodes.map((node, index) => {
                const prevNode = index > 0 ? filteredNodes[index - 1] : null;
                const showHeader = !prevNode || node.group !== prevNode.group;

                return (
                    <React.Fragment key={node.type}>
                        {showHeader && (
                            <li
                              className={`px-3 py-1 mt-2 mb-1 text-xs font-bold rounded ${groupStyles[node.group]} select-none list-none`}
                              aria-hidden="true"
                            >
                              {groupTitles[node.group]}
                            </li>
                        )}
                        <li
                            data-index={index}
                            onClick={() => { onAddNode(node.type); onClose(); }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`flex items-center space-x-4 p-3 rounded-md cursor-pointer transition-colors duration-150 ${
                            index === selectedIndex ? 'bg-emerald-600' : 'hover:bg-gray-700'
                            }`}
                        >
                            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded ${index === selectedIndex ? 'text-white' : 'text-gray-300'}`}>
                            {node.icon}
                            </div>
                            <div>
                            <p className={`font-semibold ${index === selectedIndex ? 'text-white' : 'text-gray-100'}`}>{node.title}</p>
                            <p className={`text-sm ${index === selectedIndex ? 'text-emerald-100' : 'text-gray-400'}`}>{node.description}</p>
                            </div>
                        </li>
                    </React.Fragment>
                );
            })
          ) : (
            <li className="p-4 text-center text-gray-500">{t('search.noResults')}</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default QuickSearchMenu;
