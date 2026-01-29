
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { NodeType, Point } from '../../types';
import { useLanguage } from '../../localization';
import { useAppContext } from '../../contexts/Context';

interface FileDropMenuProps {
  isOpen: boolean;
  position: Point;
  files: File[];
  onClose: () => void;
  onSelect: (action: 'transcribe' | 'tag_editor') => void;
}

const FileDropMenu: React.FC<FileDropMenuProps> = ({ 
  isOpen, 
  position, 
  files, 
  onClose, 
  onSelect 
}) => {
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Dragging State
  const [menuLocation, setMenuLocation] = useState<Point>(position);
  const [isVisible, setIsVisible] = useState(false);
  const isDraggingRef = useRef(false);
  const dragOffset = useRef<Point>({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (isOpen) {
        setMenuLocation(position);
        requestAnimationFrame(() => setIsVisible(true));
    } else {
        setIsVisible(false);
    }
  }, [isOpen, position]);

  useLayoutEffect(() => {
    if (menuRef.current) {
        menuRef.current.style.left = `${menuLocation.x}px`;
        menuRef.current.style.top = `${menuLocation.y}px`;
    }
  }, [menuLocation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (isDraggingRef.current) return;
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleWindowMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !menuRef.current) return;
    e.preventDefault();
    const x = e.clientX - dragOffset.current.x;
    const y = e.clientY - dragOffset.current.y;
    menuRef.current.style.left = `${x}px`;
    menuRef.current.style.top = `${y}px`;
  };

  const handleWindowMouseUp = (e: MouseEvent) => {
    if (isDraggingRef.current && menuRef.current) {
         const x = e.clientX - dragOffset.current.x;
         const y = e.clientY - dragOffset.current.y;
         setMenuLocation({ x, y });
    }
    isDraggingRef.current = false;
    window.removeEventListener('mousemove', handleWindowMouseMove);
    window.removeEventListener('mouseup', handleWindowMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
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
  
  useEffect(() => {
    return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  const handleAction = (action: 'transcribe' | 'tag_editor') => {
      onSelect(action);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`fixed bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700 p-2 flex flex-col space-y-2 w-64 cursor-default transition-[opacity,transform] duration-200 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{ left: menuLocation.x, top: menuLocation.y, zIndex: 1000 }}
      onMouseDown={handleMouseDown}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="px-2 py-1 border-b border-gray-700 flex justify-between items-center cursor-move" onMouseDown={handleMouseDown}>
          <span className="text-xs font-bold text-gray-400 uppercase select-none">{files.length} Files Dropped</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white">&times;</button>
      </div>

      <button
          onClick={() => handleAction('transcribe')}
          className="flex items-center space-x-3 p-2 rounded-md text-left w-full text-gray-200 hover:bg-emerald-600 hover:text-white transition-colors group"
          onMouseDown={e => e.stopPropagation()}
      >
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-700 rounded text-gray-300 group-hover:text-white">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12h5m-5 3h5m-5 3h5" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
          <div>
              <div className="text-sm font-semibold">Open in Audio Transcriber</div>
              <div className="text-[10px] text-gray-500 group-hover:text-emerald-100">Create individual nodes</div>
          </div>
      </button>

      <button
          onClick={() => handleAction('tag_editor')}
          onMouseDown={e => e.stopPropagation()}
          className="flex items-center space-x-3 p-2 rounded-md text-left w-full text-gray-200 hover:bg-emerald-600 hover:text-white transition-colors group"
      >
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-700 rounded text-gray-300 group-hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
          </div>
           <div>
              <div className="text-sm font-semibold">Open in MP3 Tag Editor</div>
              <div className="text-[10px] text-gray-500 group-hover:text-emerald-100">Batch edit tags in one node</div>
          </div>
      </button>
    </div>
  );
};

export default FileDropMenu;
