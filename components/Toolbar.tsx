

import React, { useState, useRef, useEffect } from 'react';
import { NodeType, Tool, LineStyle, Point } from '../types';
import { useLanguage } from '../localization';
import Tooltip from './ui/Tooltip';
import { useAppContext } from '../contexts/Context'; // Added import

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onAddNode: (type: NodeType, initialValue?: string) => void; // Updated signature
  onSaveCanvas: () => void;
  onSaveProject: () => void;
  onLoadCanvas: () => void;
  onOpenSearch: () => void;
  onOpenCatalog: () => void;
  viewTransform: { scale: number };
  setZoom: (newScale: number, pivot: Point) => void;
  isSnapToGrid: boolean;
  setIsSnapToGrid: React.Dispatch<React.SetStateAction<boolean>>;
  lineStyle: LineStyle;
  setLineStyle: React.Dispatch<React.SetStateAction<LineStyle>>;
  handleClearCanvas: () => void;
}

const ToolButton: React.FC<{
    title: string;
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    tooltipPosition?: 'top' | 'right';
    customClasses?: string;
    hoverBgClass?: string;
    sizeClass?: string;
    id?: string;
}> = ({ title, onClick, isActive = false, children, tooltipPosition = 'top', customClasses, hoverBgClass, sizeClass = "h-9 w-9", id }) => {
    const baseClasses = `p-1.5 rounded-md transition-colors duration-200 focus:outline-none flex items-center justify-center ${sizeClass}`;
    const activeClasses = "bg-emerald-600 text-white shadow-md";
    // Default hover is now emerald-600 unless overridden (e.g., for color groups)
    const inactiveClasses = `bg-gray-700 ${hoverBgClass || 'hover:bg-emerald-600'} text-gray-300 hover:text-white`;
    
    const combinedClasses = customClasses
        ? `${baseClasses} ${customClasses}`
        : `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;

    return (
        <Tooltip title={title} position={tooltipPosition}>
            <button
                id={id}
                onClick={onClick}
                aria-label={title}
                className={combinedClasses}
            >
                {children}
            </button>
        </Tooltip>
    );
};


const Toolbar: React.FC<ToolbarProps> = ({ 
    activeTool, onToolChange, onAddNode, onSaveCanvas, onSaveProject, onLoadCanvas, onOpenSearch, onOpenCatalog,
    viewTransform, setZoom, isSnapToGrid, setIsSnapToGrid, lineStyle, setLineStyle, handleClearCanvas 
}) => {
  const { t } = useLanguage();
  const [isCanvasControlsCollapsed, setIsCanvasControlsCollapsed] = React.useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = React.useState(false);
  const [isCompact, setIsCompact] = React.useState(false);

  // Vertical Layout State
  const [isVerticalView, setIsVerticalView] = useState(false);
  const centralToolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
        if (centralToolbarRef.current) {
            const centralWidth = centralToolbarRef.current.offsetWidth;
            // Calculate distance from screen edge to central panel
            // Assuming centered: (WindowWidth - PanelWidth) / 2
            const distance = (window.innerWidth - centralWidth) / 2;
            
            // Switch to vertical if left margin is less than 380px
            setIsVerticalView(distance < 380);
        } else {
            // Fallback estimation if ref is not ready
            setIsVerticalView(window.innerWidth < 1400); 
        }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    // Also observe the toolbar element itself for width changes (e.g. content loading/wrapping)
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (centralToolbarRef.current) {
        resizeObserver.observe(centralToolbarRef.current);
    }

    return () => {
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
    };
  }, []);

  // Vertical Toolbar Dragging State
  const [verticalToolbarY, setVerticalToolbarY] = useState(64); // Initial top position (approx top-16)
  const toolbarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ y: 0, initialTop: 0 });

  const handleDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = { y: e.clientY, initialTop: verticalToolbarY };
    document.body.style.cursor = 'ns-resize';
    
    window.addEventListener('mousemove', handleDragMouseMove);
    window.addEventListener('mouseup', handleDragMouseUp);
  };

  const handleDragMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const dy = e.clientY - dragStartRef.current.y;
    const height = toolbarRef.current?.offsetHeight || 200;
    
    const minTop = 56;
    const maxTop = window.innerHeight - height - 56;
    
    const newTop = Math.max(minTop, Math.min(maxTop, dragStartRef.current.initialTop + dy));
    setVerticalToolbarY(newTop);
  };

  const handleDragMouseUp = () => {
    isDraggingRef.current = false;
    document.body.style.cursor = 'default';
    window.removeEventListener('mousemove', handleDragMouseMove);
    window.removeEventListener('mouseup', handleDragMouseUp);
  };

  useEffect(() => {
    return () => {
        window.removeEventListener('mousemove', handleDragMouseMove);
        window.removeEventListener('mouseup', handleDragMouseUp);
    };
  }, []);

  const handleZoomChange = (newScale: number) => {
    setZoom(newScale, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  };
  
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

  return (
    <>
      {/* Left Vertical Toolbar - Draggable */}
      <div 
        ref={toolbarRef}
        style={{ top: `${verticalToolbarY}px` }}
        className="absolute left-2 z-20 bg-gray-900/50 backdrop-blur-md p-1 rounded-lg shadow-lg flex flex-col items-center gap-1 border border-gray-700 select-none"
        onMouseDown={(e) => e.stopPropagation()} // Prevent drag propagating to canvas
      >
        {/* Drag Handle */}
        <div 
            onMouseDown={handleDragMouseDown}
            className="w-full h-4 flex items-center justify-center cursor-ns-resize group hover:bg-gray-800/50 rounded-t-lg -mt-0.5 mb-1"
            title="Drag to move"
        >
            <div className="w-6 h-1 bg-gray-600 rounded-full group-hover:bg-gray-400 transition-colors"></div>
        </div>

        <ToolButton sizeClass="h-9 w-9" title={t('toolbar.edit')} onClick={() => onToolChange('edit')} isActive={activeTool === 'edit'} tooltipPosition="right">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </ToolButton>
        <ToolButton sizeClass="h-9 w-9" title={t('toolbar.cutter')} onClick={() => onToolChange('cutter')} isActive={activeTool === 'cutter'} tooltipPosition="right">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </ToolButton>
        <ToolButton sizeClass="h-9 w-9" title={t('toolbar.selection')} onClick={() => onToolChange('selection')} isActive={activeTool === 'selection'} tooltipPosition="right">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" d="M3.75 3.75h16.5v16.5H3.75z" />
          </svg>
        </ToolButton>
        <ToolButton sizeClass="h-9 w-9" title={t('toolbar.reroute')} onClick={() => onToolChange('reroute')} isActive={activeTool === 'reroute'} tooltipPosition="right">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h8m-8 0l4-4m-4 4l4 4m8 0h8m-8 0l4-4m-4 4l4 4" />
          </svg>
        </ToolButton>
      </div>
      
      {/* Bottom Main Toolbar - Responsive Margins */}
       <div className={`absolute bottom-2 left-14 right-14 z-20 flex justify-center pointer-events-none transition-transform duration-300 ease-in-out ${isToolbarCollapsed ? 'translate-y-[calc(100%+8px)]' : 'translate-y-0'}`}>
        <div className="relative pointer-events-auto cursor-auto max-w-full">
          {/* Split Handle Tongue */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 h-7 w-28 bg-gray-900/50 backdrop-blur-md border-t border-x border-gray-700 rounded-t-xl flex items-stretch overflow-hidden shadow-lg">
             {/* Left half: Compact Toggle */}
             <button
                onClick={() => setIsCompact(!isCompact)}
                className={`flex-1 flex items-center justify-center transition-colors border-r border-gray-700/50 ${isCompact ? 'text-emerald-400 bg-emerald-900/20' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                title={t('toolbar.toggleHeaders')}
             >
                {isCompact ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )}
             </button>
             {/* Right half: Collapse Toolbar */}
             <button
                onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
                className="flex-1 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
                title={isToolbarCollapsed ? t('toolbar.expand') : t('toolbar.collapse')}
              >
                {isToolbarCollapsed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                )}
              </button>
          </div>

          <div ref={centralToolbarRef} className="bg-gray-900/50 backdrop-blur-md p-1 rounded-lg shadow-lg flex flex-wrap justify-center items-center gap-x-2 gap-y-2 border border-gray-700">
            {/* Catalog */}
            <div className="flex flex-col items-center gap-1">
              {!isCompact && <span className="text-[10px] text-gray-400 font-semibold tracking-wide">{t('catalog.title')}</span>}
              <div className="flex items-center gap-1 p-0.5 rounded-md">
                <ToolButton title={t('toolbar.addNode')} onClick={onOpenSearch} hoverBgClass="hover:bg-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.catalog')} onClick={onOpenCatalog} hoverBgClass="hover:bg-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </ToolButton>
              </div>
            </div>

            {/* General */}
            <div className="flex flex-col items-center gap-1">
              {!isCompact && <span className="text-[10px] text-gray-400 font-semibold tracking-wide">{t('toolbar.group.general')}</span>}
              <div className="flex items-center gap-1 p-0.5 rounded-md">
                <ToolButton title={t('toolbar.addNote')} onClick={() => onAddNode(NodeType.NOTE)} hoverBgClass="hover:bg-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addDataReader')} onClick={() => onAddNode(NodeType.DATA_READER)} hoverBgClass="hover:bg-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </ToolButton>
              </div>
            </div>
            
            {/* Prompting & Analysis */}
            <div className="flex flex-col items-center gap-1">
              {!isCompact && <span className="text-[10px] text-gray-400 font-semibold tracking-wide">{t('toolbar.group.prompting')}</span>}
              <div className="flex items-center gap-1 p-0.5 rounded-md">
                <ToolButton title={t('toolbar.addTextInput')} onClick={() => onAddNode(NodeType.TEXT_INPUT)} hoverBgClass="hover:bg-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h8M12 6v12" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h-1a2 2 0 00-2 2v14a2 2 0 002 2h1m12-18h1a2 2 0 012 2v14a2 2 0 01-2 2h-1" />
                  </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addPromptProcessor')} onClick={() => onAddNode(NodeType.PROMPT_PROCESSOR)} hoverBgClass="hover:bg-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.672-2.672L11.25 18l1.938-.648a3.375 3.375 0 002.672-2.672L16.25 13l.648 1.938a3.375 3.375 0 002.672 2.672L21.75 18l-1.938.648a3.375 3.375 0 00-2.672 2.672z" />
                  </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addPromptAnalyzer')} onClick={() => onAddNode(NodeType.PROMPT_ANALYZER)} hoverBgClass="hover:bg-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6M9 11h6M9 8h6" />
                  </svg>
                </ToolButton>
              </div>
            </div>

            {/* Scripting */}
            <div className="flex flex-col items-center gap-1">
              {!isCompact && <span className="text-[10px] text-gray-400 font-semibold tracking-wide">{t('toolbar.group.scripting')}</span>}
              <div className="flex items-center gap-1 p-0.5 rounded-md">
                <ToolButton title={t('toolbar.addIdeaGenerator')} onClick={() => onAddNode(NodeType.IDEA_GENERATOR)} hoverBgClass="hover:bg-cyan-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0112 18.375V19.5" />
                    </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addScriptGenerator')} onClick={() => onAddNode(NodeType.SCRIPT_GENERATOR)} hoverBgClass="hover:bg-cyan-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.01M15 12h.01M10.5 16.5h3M15 19.5h-6a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 018.25 4.5h7.5a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0115.75 19.5h-1.5" />
                    </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addScriptAnalyzer')} onClick={() => onAddNode(NodeType.SCRIPT_ANALYZER)} hoverBgClass="hover:bg-cyan-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V6A2.25 2.25 0 0018.75 3.75H5.25A2.25 2.25 0 003 6v6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75-.75h-.008a.75.75 0 01-.75-.75v-.008z" />
                    </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addScriptPromptModifier')} onClick={() => onAddNode(NodeType.SCRIPT_PROMPT_MODIFIER)} hoverBgClass="hover:bg-cyan-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.75l-1.125 1.125m1.125-1.125L16.125 11.5m2.25 1.25l1.125-1.125m-1.125 1.125l-1.125-1.125M15 6l-2.25 2.25" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l2.25-2.25M15 6l-2.25-2.25" />
                  </svg>
                </ToolButton>
              </div>
            </div>

            {/* Characters */}
            <div className="flex flex-col items-center gap-1">
              {!isCompact && <span className="text-[10px] text-gray-400 font-semibold tracking-wide">{t('toolbar.group.characters')}</span>}
              <div className="flex items-center gap-1 p-0.5 rounded-md">
                <ToolButton title={t('toolbar.addCharacterGenerator')} onClick={() => onAddNode(NodeType.CHARACTER_GENERATOR)} hoverBgClass="hover:bg-pink-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addCharacterAnalyzer')} onClick={() => onAddNode(NodeType.CHARACTER_ANALYZER)} hoverBgClass="hover:bg-pink-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25c-3.1 0-5.88-1.5-7.5-3.75m15 3.75c-1.62-2.25-4.4-3.75-7.5-3.75S6.12 12 4.5 14.25" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                    </svg>
                </ToolButton>
                 <ToolButton title={t('toolbar.addCharacterCard')} onClick={() => onAddNode(NodeType.CHARACTER_CARD)} hoverBgClass="hover:bg-pink-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 3.75H4.5A2.25 2.25 0 002.25 6v12A2.25 2.25 0 004.5 20.25h15A2.25 2.25 0 0021.75 18V6A2.25 2.25 0 0019.5 3.75z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" />
                    </svg>
                </ToolButton>
              </div>
            </div>

            {/* Images */}
            <div className="flex flex-col items-center gap-1">
              {!isCompact && <span className="text-[10px] text-gray-400 font-semibold tracking-wide">{t('toolbar.group.images')}</span>}
              <div className="flex items-center gap-1 p-0.5 rounded-md">
                <ToolButton title={t('toolbar.addImageGenerator')} onClick={() => onAddNode(NodeType.IMAGE_GENERATOR)} hoverBgClass="hover:bg-yellow-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addImagePreview')} onClick={() => onAddNode(NodeType.IMAGE_PREVIEW)} hoverBgClass="hover:bg-yellow-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                </ToolButton>
              </div>
            </div>
            
            {/* AI */}
            <div className="flex flex-col items-center gap-1">
              {!isCompact && <span className="text-[10px] text-gray-400 font-semibold tracking-wide">{t('toolbar.group.ai')}</span>}
              <div className="flex items-center gap-1 p-0.5 rounded-md">
                <ToolButton title={t('toolbar.addTranslator')} onClick={() => onAddNode(NodeType.TRANSLATOR)} hoverBgClass="hover:bg-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L12 6l6 12M8 14h8" />
                  </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addGeminiChat')} onClick={() => onAddNode(NodeType.GEMINI_CHAT)} hoverBgClass="hover:bg-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addErrorAnalyzer')} onClick={() => onAddNode(NodeType.ERROR_ANALYZER)} hoverBgClass="hover:bg-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </ToolButton>
              </div>
            </div>

            {/* Audio */}
            <div className="flex flex-col items-center gap-1">
              {!isCompact && <span className="text-[10px] text-gray-400 font-semibold tracking-wide">{t('toolbar.group.audio')}</span>}
              <div className="flex items-center gap-1 p-0.5 rounded-md">
                <ToolButton title={t('toolbar.addNarratorTextGenerator')} onClick={() => onAddNode(NodeType.NARRATOR_TEXT_GENERATOR)} hoverBgClass="hover:bg-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3M18 12h3" />
                    </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addSpeechSynthesizer')} onClick={() => onAddNode(NodeType.SPEECH_SYNTHESIZER)} hoverBgClass="hover:bg-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addAudioTranscriber')} onClick={() => onAddNode(NodeType.AUDIO_TRANSCRIBER)} hoverBgClass="hover:bg-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12h5m-5 3h5m-5 3h5" />
                    </svg>
                </ToolButton>
                {/* NEW BUTTON: Tag Editor (Audio Transcriber with specific init) */}
                <ToolButton title={t('toolbar.addTagEditor')} onClick={() => onAddNode(NodeType.AUDIO_TRANSCRIBER, JSON.stringify({ initialTab: 'tags' }))} hoverBgClass="hover:bg-blue-600">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                </ToolButton>

                <ToolButton title={t('toolbar.addMusicIdeaGenerator')} onClick={() => onAddNode(NodeType.MUSIC_IDEA_GENERATOR)} hoverBgClass="hover:bg-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" /></svg>
                </ToolButton>
              </div>
            </div>

            {/* YouTube */}
            <div className="flex flex-col items-center gap-1">
              {!isCompact && <span className="text-[10px] text-gray-400 font-semibold tracking-wide">{t('toolbar.group.youtube')}</span>}
              <div className="flex items-center gap-1 p-0.5 rounded-md">
                <ToolButton title={t('toolbar.addYouTubeTitleGenerator')} onClick={() => onAddNode(NodeType.YOUTUBE_TITLE_GENERATOR)} hoverBgClass="hover:bg-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 5.25H5.25A2.25 2.25 0 003 7.5v9A2.25 2.25 0 005.25 18.75z" />
                    </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.addYouTubeAnalytics')} onClick={() => onAddNode(NodeType.YOUTUBE_ANALYTICS)} hoverBgClass="hover:bg-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                </ToolButton>
              </div>
            </div>
            
            {/* File */}
            <div className="flex flex-col items-center gap-1">
              {!isCompact && <span className="text-[10px] text-gray-400 font-semibold tracking-wide">{t('toolbar.group.file')}</span>}
              <div className="flex items-center gap-1 p-0.5 rounded-md">
                <ToolButton title={t('toolbar.saveProject')} onClick={onSaveProject} hoverBgClass="hover:bg-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.saveCanvas')} onClick={onSaveCanvas} hoverBgClass="hover:bg-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                      <path d="M17.2928932,3.29289322 L21,7 L21,20 C21,20.5522847 20.5522847,21 20,21 L4,21 C3.44771525,21 3,20.5522847 3,20 L3,4 C3,3.44771525 3.44771525,3 4,3 L16.5857864,3 C16.8510029,3 17.1053568,3.10535684 17.2928932,3.29289322 Z"></path>
                      <rect width="10" height="8" x="7" y="13"></rect>
                      <rect width="8" height="5" x="8" y="3"></rect>
                  </svg>
                </ToolButton>
                <ToolButton title={t('toolbar.loadCanvas')} onClick={onLoadCanvas} hoverBgClass="hover:bg-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                </ToolButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* View Controls - Responsive */}
      <div 
        className={`absolute bottom-2 left-2 z-20 bg-gray-900/50 backdrop-blur-md rounded-lg flex items-center border border-gray-700 shadow-lg pointer-events-auto p-1 
            ${isCanvasControlsCollapsed ? 'gap-0' : 'gap-1'} 
            ${isVerticalView ? 'flex-col-reverse items-start' : 'flex-row'}
            max-h-[680px]:top-[calc(4rem+200px+0.5rem)] max-h-[680px]:bottom-auto`}
        >
        <div className="relative flex items-center">
            <Tooltip 
                title={isCanvasControlsCollapsed ? t('toolbar.expand') : t('toolbar.collapse')} 
                position="right"
            >
                <button
                    onClick={() => setIsCanvasControlsCollapsed(!isCanvasControlsCollapsed)}
                    className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-md hover:bg-emerald-600 bg-gray-700 text-gray-300 hover:text-white transition-colors"
                >
                    {isCanvasControlsCollapsed 
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    }
                </button>
            </Tooltip>
        </div>
        {!isCanvasControlsCollapsed && (
        <div className={`flex items-center gap-1 ${isVerticalView ? 'flex-col-reverse' : 'flex-row'}`}>
          <ToolButton
              title={t('toolbar.zoom')}
              onClick={() => onToolChange('zoom')}
              isActive={activeTool === 'zoom'}
              tooltipPosition={isVerticalView ? 'right' : 'top'}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
          </ToolButton>
          
          <div className={`flex items-center space-x-2 px-2 h-9 ${isVerticalView ? 'hidden' : ''}`}>
              <input type="range" min="-100" max="100" step="1" value={scaleToSliderValue(viewTransform.scale)} onChange={(e) => handleZoomChange(sliderValueToScale(parseFloat(e.target.value)))} className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              <Tooltip title={t('toolbar.resetZoom')} position="top">
                  <button onClick={() => handleZoomChange(1)} className="text-sm font-semibold text-gray-300 hover:text-white w-12 text-center hover:bg-emerald-600 rounded-md py-1 transition-colors" >{Math.round(viewTransform.scale * 100)}%</button>
              </Tooltip>
          </div>
          
          {isVerticalView && (
               <ToolButton
                  title={t('toolbar.resetZoom')}
                  onClick={() => handleZoomChange(1)}
                  isActive={false}
                  tooltipPosition={isVerticalView ? 'right' : 'top'}
              >
                 <span className="text-xs font-bold">{Math.round(viewTransform.scale * 100)}%</span>
              </ToolButton>
          )}

          <ToolButton
              title={t('toolbar.snapToGrid')}
              onClick={() => setIsSnapToGrid(prev => !prev)}
              isActive={isSnapToGrid}
              tooltipPosition={isVerticalView ? 'right' : 'top'}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="4" cy="4" r="1.5" /><circle cx="10" cy="4" r="1.5" /><circle cx="16" cy="4" r="1.5" />
                  <circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="16" cy="10" r="1.5" />
                  <circle cx="4" cy="16" r="1.5" /><circle cx="10" cy="16" r="1.5" /><circle cx="16" cy="16" r="1.5" />
              </svg>
          </ToolButton>
          <ToolButton
              title={t('toolbar.lineStyleSpaghetti')}
              onClick={() => setLineStyle('spaghetti')}
              isActive={lineStyle === 'spaghetti'}
              tooltipPosition={isVerticalView ? 'right' : 'top'}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6C6 12, 18 12, 18 18" /></svg>
          </ToolButton>
          <ToolButton
              title={t('toolbar.lineStyleOrthogonal')}
              onClick={() => setLineStyle('orthogonal')}
              isActive={lineStyle === 'orthogonal'}
              tooltipPosition={isVerticalView ? 'right' : 'top'}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 8h6v8h6" /></svg>
          </ToolButton>
          <ToolButton
              title={t('toolbar.clearCanvas')}
              onClick={handleClearCanvas}
              customClasses="bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white"
              tooltipPosition={isVerticalView ? 'right' : 'top'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </ToolButton>
        </div>
        )}
      </div>
    </>
  );
};

export default React.memo(Toolbar);
