import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../localization';
import Tooltip from './Tooltip';

const HelpPanel: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({
    opacity: 0,
    pointerEvents: 'none',
    position: 'fixed'
  });

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPanelStyle({
          position: 'fixed',
          top: `${rect.bottom + 8}px`,
          left: `${rect.left}px`,
          opacity: 1,
          pointerEvents: 'auto',
          transition: 'opacity 150ms ease-in-out',
        });
      }
    } else {
      setPanelStyle(prev => ({ ...prev, opacity: 0, pointerEvents: 'none' }));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hotkeySections = {
    tools: [
      { key: 'V', description: t('hotkeys.tools.edit') },
      { key: 'C', description: t('hotkeys.tools.cutter') },
      { key: 'S', description: t('hotkeys.tools.selection') },
      { key: 'R', description: t('hotkeys.tools.reroute') },
      { key: 'Z', description: t('hotkeys.tools.zoom') },
      { key: 'H', description: t('node.action.collapse') },
      { key: 'Shift + W', description: t('hotkeys.tools.snapToGrid') },
      { key: 'Shift + E', description: t('hotkeys.tools.toggleLineStyle') },
      { key: 'G', description: t('hotkeys.tools.group') },
      { key: 'D', description: t('node.action.duplicateEmpty') },
      { key: 'Ctrl + D', description: t('hotkeys.tools.duplicate') },
      { key: 'X / Del', description: t('hotkeys.tools.closeNode') },
      { key: 'Ctrl + A', description: t('hotkeys.tools.selectAll') },
      { key: 'Alt + A', description: t('hotkeys.tools.deselectAll') },
      { key: 'Shift+Click', description: t('hotkeys.tools.deleteGroup') },
    ],
    windows: [
      { key: 'F', description: t('hotkeys.windows.search') },
      { key: 'Space', description: t('hotkeys.windows.quickAdd') },
      { key: 'Ctrl+Space', description: t('hotkeys.windows.catalog') },
      { key: 'F1', description: t('hotkeys.show') },
    ],
    file: [
      { key: 'Ctrl + S', description: t('hotkeys.file.save') },
      { key: 'Ctrl + Shift + S', description: t('hotkeys.file.saveProject') },
      { key: 'Ctrl + O', description: t('hotkeys.file.load') },
    ],
    createNode: [
      { key: 'T', description: t('node.title.text_input') },
      { key: 'P', description: t('node.title.prompt_processor') },
      { key: 'A', description: t('node.title.prompt_analyzer') },
      { key: 'M', description: t('node.title.gemini_chat') },
      { key: 'L', description: t('node.title.translator') },
      { key: 'N', description: t('node.title.note') },
      { key: 'O', description: t('node.title.image_generator') },
      { key: 'I', description: t('node.title.image_preview') },
      { key: 'Shift+A', description: t('node.title.idea_generator') },
      { key: 'Shift+C', description: t('node.title.character_generator') },
      { key: 'Ctrl+Shift+C', description: t('node.title.character_card') },
      { key: 'Shift+S', description: t('node.title.script_generator') },
      { key: 'Shift+D', description: t('node.title.script_analyzer') },
      { key: 'Shift+F', description: t('node.title.script_prompt_modifier') },
      { key: 'Shift+R', description: t('node.title.data_reader') },
      { key: 'Shift+G', description: t('node.title.narrator_text_generator') },
      { key: 'Shift+N', description: t('node.title.speech_synthesizer') },
      { key: 'Shift+B', description: t('node.title.audio_transcriber') },
      { key: 'Shift+T', description: t('node.title.youtube_title_generator') },
      { key: 'Shift+Y', description: t('node.title.youtube_analytics') },
      { key: 'Shift+M', description: t('node.title.music_idea_generator') },
    ],
  };

  const renderHotkeySection = (title: string, keys: { key: string, description: string }[]) => (
    <div>
      <h4 className="font-bold text-gray-300 mb-2 border-b border-gray-600 pb-1">{title}</h4>
      <ul className="space-y-1.5">
        {keys.map(({ key, description }) => (
          <li key={key} className="flex justify-between items-center">
            <span>{description}</span>
            <kbd className="font-mono bg-gray-700 px-2 py-1 rounded-md text-gray-300 text-xs">{key}</kbd>
          </li>
        ))}
      </ul>
    </div>
  );

  const panelContent = (
    <div 
      ref={panelRef}
      className="bg-gray-800 rounded-lg w-[450px] h-[600px] border border-gray-700 z-[60] flex flex-col shadow-2xl"
      style={panelStyle}
      onMouseDown={e => e.stopPropagation()}
      onWheel={e => e.stopPropagation()}
    >
      <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-bold text-emerald-400">{t('help.title')}</h2>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1 text-gray-400 rounded-full hover:bg-gray-600 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 overflow-y-auto text-sm text-gray-400 flex-grow min-h-0 custom-scrollbar">
        <div className="flex flex-col gap-6">
          {renderHotkeySection(t('hotkeys.tools.title'), hotkeySections.tools)}
          {renderHotkeySection(t('hotkeys.createNode.title'), hotkeySections.createNode)}
          {renderHotkeySection(t('hotkeys.windows.title'), hotkeySections.windows)}
          {renderHotkeySection(t('hotkeys.file.title'), hotkeySections.file)}
        </div>
      </div>
      
      {/* License & Author Footer */}
      <div className="p-3 bg-gray-900 border-t border-gray-700 text-xs text-gray-500 flex flex-col gap-2 rounded-b-lg">
          <div className="flex justify-between items-center">
             <span>Script Modifier</span>
             <span className="font-mono">Licensed under GNU GPLv3</span>
          </div>
          <div className="flex justify-between items-end border-t border-gray-800 pt-2 text-gray-400">
              <div className="flex flex-col gap-1">
                <span>Author: MeowMaster</span>
                <span>Email: MeowMasterart@gmail.com</span>
                <a href="https://github.com/meowmasterart-spec/scriptmodifier-st" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                    GitHub: meowmasterart-spec/scriptmodifier-st
                </a>
              </div>
              <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
                <img src="https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg" alt="Deploys by Netlify" style={{ height: '32px' }} />
              </a>
          </div>
      </div>
    </div>
  );

  return (
    <div ref={buttonRef}>
      <Tooltip title={t('hotkeys.show')} position="bottom">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-md transition-colors duration-200 focus:outline-none flex items-center justify-center h-9 w-9 bg-gray-700 hover:bg-emerald-600 text-gray-300 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </Tooltip>
      {isOpen && createPortal(panelContent, document.body)}
    </div>
  );
};

export default HelpPanel;