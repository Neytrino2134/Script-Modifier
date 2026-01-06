
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LibraryItem, LibraryItemType } from '../types';
import { useLanguage } from '../localization';

interface PromptLibraryToolbarProps {
  libraryItems: LibraryItem[];
  onPromptInsert: (promptText: string) => void;
}

export const PromptLibraryToolbar: React.FC<PromptLibraryToolbarProps> = ({ libraryItems, onPromptInsert }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null = Root
  const menuRef = useRef<HTMLDivElement>(null);

  const currentFolder = useMemo(() => 
    currentFolderId ? libraryItems.find(i => i.id === currentFolderId) : null
  , [currentFolderId, libraryItems]);

  const itemsInCurrentFolder = useMemo(() => {
    return libraryItems
        .filter(i => i.parentId === currentFolderId)
        .sort((a, b) => {
            // Sort folders first, then alphabetically
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === LibraryItemType.FOLDER ? -1 : 1;
        });
  }, [libraryItems, currentFolderId]);

  // Animation Logic
  useEffect(() => {
    if (isOpen) {
        setIsRendered(true);
        requestAnimationFrame(() => setIsVisible(true));
    } else {
        setIsVisible(false);
        const timer = setTimeout(() => setIsRendered(false), 200);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as globalThis.Node)) {
        setIsOpen(false);
        setCurrentFolderId(null); // Reset to root on close
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleItemClick = (item: LibraryItem) => {
      if (item.type === LibraryItemType.FOLDER) {
          setCurrentFolderId(item.id);
      } else {
          onPromptInsert(item.content || '');
          setIsOpen(false);
          setCurrentFolderId(null); // Reset on selection
      }
  };

  const handleBack = () => {
      if (currentFolder) {
          setCurrentFolderId(currentFolder.parentId);
      } else {
          setCurrentFolderId(null); // Should already be at root, but for safety
      }
  };

  return (
    <div ref={menuRef} className="relative mb-1 flex-shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 ${isOpen ? 'ring-1 ring-emerald-500 border-emerald-500' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span>{t('catalog.tabs.library')}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isRendered && (
        <div 
            className={`absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-gray-800 rounded-md shadow-xl z-50 border border-gray-600 flex flex-col transition-[opacity,transform] duration-200 ease-out origin-top ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            onWheel={e => e.stopPropagation()}
        >
            {/* Header / Back Button */}
            {currentFolderId ? (
                <button 
                    onClick={handleBack}
                    className="flex items-center px-3 py-2 text-sm font-bold text-gray-300 hover:text-white hover:bg-gray-700 border-b border-gray-700/50 sticky top-0 bg-gray-800 z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    {currentFolder?.name || 'Back'}
                </button>
            ) : (
                <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase border-b border-gray-700/50 sticky top-0 bg-gray-800 z-10 cursor-default">
                    {t('catalog.tabs.library')}
                </div>
            )}
            
            {/* Content List */}
            <div className="p-1">
                {itemsInCurrentFolder.length > 0 ? (
                    itemsInCurrentFolder.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-md flex items-center group"
                            title={item.content}
                        >
                            {item.type === LibraryItemType.FOLDER ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500 group-hover:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500 group-hover:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            )}
                            <span className="truncate">{item.name}</span>
                            {item.type === LibraryItemType.FOLDER && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto text-gray-500 group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            )}
                        </button>
                    ))
                ) : (
                    <div className="text-center text-xs text-gray-500 py-4 italic">
                        {t('library.empty.title')}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
