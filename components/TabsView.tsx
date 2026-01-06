
import React, { useState, useRef, useEffect } from 'react';
import Tooltip from './Tooltip';

interface Tab {
  id: string;
  name: string;
}

interface TabsViewProps {
  tabs: Tab[];
  activeTabIndex: number;
  onTabClick: (index: number) => void;
  onCloseTab: (index: number) => void;
  onRenameTab: (index: number, newName: string) => void;
}

const Tab: React.FC<{
  tab: Tab;
  index: number;
  isActive: boolean;
  onClick: (index: number) => void;
  onClose: (index: number) => void;
  onRename: (index: number, newName: string) => void;
}> = ({ tab, index, isActive, onClick, onClose, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(tab.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(tab.name);
  }, [tab.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (name.trim() === '') {
      setName(tab.name); // revert if empty
    } else if (name.trim() !== tab.name) {
      onRename(index, name.trim());
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setName(tab.name);
      setIsEditing(false);
    }
  };

  const closeButtonHoverClass = isActive ? 'hover:bg-emerald-700' : 'hover:bg-gray-500';

  return (
    <Tooltip title={tab.name} position="bottom" className="h-full">
        <div
          onMouseDown={() => onClick(index)}
          onDoubleClick={() => setIsEditing(true)}
          className={`flex items-center justify-between px-4 h-full cursor-pointer max-w-[200px] transition-colors rounded-md ${isActive ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-emerald-600 hover:text-white'}`}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent outline-none w-full text-sm"
            />
          ) : (
            <span className="truncate text-sm">{tab.name}</span>
          )}
          <button 
            onMouseDown={(e) => { e.stopPropagation(); onClose(index); }}
            className={`ml-2 p-0.5 rounded-full ${closeButtonHoverClass} transition-colors`}
            title="Close tab"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
    </Tooltip>
  );
}

const TabsView: React.FC<TabsViewProps> = ({ tabs, activeTabIndex, onTabClick, onCloseTab, onRenameTab }) => {
  return (
    <div className="flex items-center h-full gap-1">
      {tabs.map((tab, index) => (
        <Tab
          key={tab.id}
          tab={tab}
          index={index}
          isActive={index === activeTabIndex}
          onClick={onTabClick}
          onClose={onCloseTab}
          onRename={onRenameTab}
        />
      ))}
    </div>
  );
};

export default TabsView;
