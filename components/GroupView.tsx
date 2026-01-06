
import React from 'react';
import type { Group } from '../types';
import { useLanguage } from '../localization';
import { ActionButton } from './ActionButton';

interface GroupViewProps {
  group: Group;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>, groupId: string) => void;
  onClose: (groupId: string, e: React.MouseEvent) => void;
  onRename: (groupId: string, currentTitle: string) => void;
  onSaveToCatalog: (groupId: string) => void;
  onSaveToDisk: (groupId: string) => void;
  onCopy: (groupId: string) => void;
  onDuplicate: (groupId: string) => void;
  isHoveredForDrop: boolean;
  isBeingDragged: boolean;
}

const GroupView: React.FC<GroupViewProps> = ({ group, onMouseDown, onTouchStart, onClose, onRename, onSaveToCatalog, onSaveToDisk, onCopy, onDuplicate, isHoveredForDrop, isBeingDragged }) => {
  const { t } = useLanguage();
  const borderStyle = isBeingDragged
    ? 'border-solid border-emerald-400'
    : isHoveredForDrop
    ? 'border-solid border-emerald-400 ring-2 ring-emerald-400/50'
    : 'border-dashed border-gray-500';
  const bgStyle = 'bg-white/5';

  return (
    <div
      className={`absolute ${bgStyle} border-2 ${borderStyle} rounded-lg transition-colors duration-200 pointer-events-auto`}
      style={{
        // Using raw coordinates (no rounding) to prevent jitter
        transform: `translate3d(${group.position.x}px, ${group.position.y}px, 0)`,
        width: group.width,
        height: group.height,
        zIndex: 5,
        backfaceVisibility: 'hidden',
      }}
    >
      <div 
        className="bg-gray-700/50 text-white font-bold p-2 rounded-t-md flex justify-between items-center cursor-move pointer-events-auto"
        onMouseDown={onMouseDown}
        onTouchStart={(e) => onTouchStart(e, group.id)}
        onDoubleClick={() => onRename(group.id, group.title)}
        onContextMenu={(e) => e.stopPropagation()}
      >
        <span className="truncate pr-2">{group.title}</span>
        <div className="flex items-center space-x-1">
            <ActionButton title={t('group.rename')} onClick={() => onRename(group.id, group.title)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </ActionButton>
            <ActionButton title={t('node.action.copy')} onClick={() => onCopy(group.id)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </ActionButton>
            <ActionButton title={t('node.action.duplicateWithContent')} onClick={() => onDuplicate(group.id)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </ActionButton>
            <ActionButton title={t('group.saveToCatalog')} onClick={() => onSaveToCatalog(group.id)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1-4l-3 3-3-3m3 3V3" />
              </svg>
            </ActionButton>
            <ActionButton title={t('group.saveToDisk')} onClick={() => onSaveToDisk(group.id)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </ActionButton>
            <ActionButton title={t('group.ungroup')} onClick={(e) => onClose(group.id, e)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default React.memo(GroupView);
