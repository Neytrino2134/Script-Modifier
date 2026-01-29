
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../localization';
import { useAppContext } from '../../contexts/Context';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (options: { key: string, useFree: boolean }) => void;
  currentApiKey: string;
  useFreeKeyProp: boolean;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, onSave, currentApiKey, useFreeKeyProp }) => {
  const { t } = useLanguage();
  const context = useAppContext();
  
  // Safe destructuring with fallbacks for critical props
  // Note: we now access googleDrive from context
  const { 
      googleDrive
  } = context || {};

  // General State
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [useFreeKey, setUseFreeKey] = useState(useFreeKeyProp);
  const [downloadPath, setDownloadPath] = useState('');
  
  // Cloud State - Consume from Context
  const [googleClientId, setGoogleClientId] = useState(googleDrive?.clientId || '');

  // Dragging
  const dialogRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Animation State
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setApiKey(currentApiKey);
      setUseFreeKey(useFreeKeyProp);
      // Sync client ID from context state if available
      if (googleDrive) {
          setGoogleClientId(googleDrive.clientId);
      }
      
      // Position Logic
      try {
          const savedPos = localStorage.getItem('script-modifier-settings-pos');
          if (savedPos) {
              setPosition(JSON.parse(savedPos));
          } else {
              // Attempt to align with the settings button
              const triggerBtn = document.getElementById('settings-button-trigger');
              if (triggerBtn) {
                  const rect = triggerBtn.getBoundingClientRect();
                  // Position below the button, slightly offset to the left to align
                  const left = Math.max(10, rect.right - 400); // 400 is new width
                  setPosition({ x: left, y: rect.bottom + 10 });
              } else {
                  // Fallback Center
                  const x = (window.innerWidth - 400) / 2;
                  const y = (window.innerHeight - 600) / 2;
                  setPosition({ x, y });
              }
          }
      } catch (e) {
          console.error("Failed to load settings position", e);
          const x = (window.innerWidth - 400) / 2;
          const y = (window.innerHeight - 600) / 2;
          setPosition({ x, y });
      }
      
      // Trigger animation frame for smooth entry
      requestAnimationFrame(() => {
          setIsVisible(true);
      });

    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
          setShouldRender(false);
      }, 300); // Wait for transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentApiKey, useFreeKeyProp, googleDrive?.clientId]);

  const handleSave = () => {
    // Save Position
    localStorage.setItem('script-modifier-settings-pos', JSON.stringify(position));

    onSave({ key: apiKey, useFree: useFreeKey });
    
    // Update Client ID in context
    if (googleDrive) {
        googleDrive.setClientId(googleClientId);
    }
    
    // Send download path to Electron if available
    if ((window as any).electronAPI) {
        (window as any).electronAPI.setDownloadPath(downloadPath);
    }
    
    // Animate out then close
    setIsVisible(false);
    setTimeout(onClose, 300);
  };
  
  const handleCloseInternal = () => {
      // Save Position even on close without saving settings
      localStorage.setItem('script-modifier-settings-pos', JSON.stringify(position));
      setIsVisible(false);
      setTimeout(onClose, 300);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('.draggable-header')) {
          isDragging.current = true;
          const rect = dialogRef.current?.getBoundingClientRect();
          if (rect) {
              dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          }
          
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
  };

  const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current && dialogRef.current) {
          // Direct DOM manipulation for performance (avoids React re-renders during drag)
          const newX = e.clientX - dragOffset.current.x;
          const newY = e.clientY - dragOffset.current.y;
          dialogRef.current.style.left = `${newX}px`;
          dialogRef.current.style.top = `${newY}px`;
      }
  };

  const handleMouseUp = () => {
      if (isDragging.current) {
         isDragging.current = false;
         window.removeEventListener('mousemove', handleMouseMove);
         window.removeEventListener('mouseup', handleMouseUp);
         
         // Sync React state and LocalStorage after drag ends
         if (dialogRef.current) {
             const rect = dialogRef.current.getBoundingClientRect();
             const newPos = { x: rect.left, y: rect.top };
             setPosition(newPos);
             localStorage.setItem('script-modifier-settings-pos', JSON.stringify(newPos));
         }
      }
  };
  
  const handleSelectFolder = async () => {
      if ((window as any).electronAPI) {
          const path = await (window as any).electronAPI.selectFolder();
          if (path) {
              setDownloadPath(path);
          }
      }
  };

  if (!shouldRender || !googleDrive) return null;

  return (
    // Wrapper: Fixed, covers screen but allows clicks through (pointer-events-none)
    // Z-Index high to be above nodes
    <div className="fixed inset-0 z-[150] pointer-events-none">
      <div 
        ref={dialogRef}
        className={`fixed bg-gray-800 rounded-lg w-[400px] h-[600px] border border-gray-700 flex flex-col shadow-2xl pointer-events-auto cursor-default transition-opacity duration-200 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center draggable-header cursor-move bg-gray-900/50 rounded-t-lg select-none">
          <div className="flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-1.533 2.16-1.535.113-1.535 2.322 0 2.435 1.594.118 2.073 1.274 1.533 2.16-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.948c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.948c1.372.836 2.942-.734 2.106-2.106-.54-.886-.061-2.042 1.533-2.16 1.535-.113 1.535-2.322 0-2.435-1.594-.118-2.073-1.274-1.533-2.16.836-1.372-.734-2.942-2.106-2.106a1.533 1.533 0 01-2.287-.948zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
               </svg>
               <h2 className="text-lg font-bold text-white">{t('dialog.settings.title')}</h2>
          </div>
          <button onClick={handleCloseInternal} className="p-1 text-gray-400 rounded-full hover:bg-gray-600 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow p-4 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* GENERAL SETTINGS */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 pb-1 mb-2">
                    {t('settings.tab.general')}
                </h3>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('dialog.settings.apiKeyLabel')}
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder={t('dialog.settings.apiKeyPlaceholder')}
                        disabled={useFreeKey}
                        className="w-full px-3 py-2 bg-gray-900 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-800 disabled:text-gray-500 text-sm"
                    />
                     <div className="flex items-center space-x-2 mt-2">
                        <input
                            id="use-free-key-checkbox"
                            type="checkbox"
                            checked={useFreeKey}
                            onChange={(e) => setUseFreeKey(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-500 text-emerald-600 focus:ring-emerald-500 bg-gray-700"
                        />
                        <label htmlFor="use-free-key-checkbox" className="text-sm text-gray-300 select-none">
                        {t('dialog.settings.useFreeKey')}
                        </label>
                    </div>
                     <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline mt-1 block"
                    >
                        {t('dialog.settings.getApiKeyLink')}
                    </a>
                </div>
                
                {(window as any).electronAPI && (
                    <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                            Download Folder
                         </label>
                         <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={downloadPath} 
                                readOnly 
                                placeholder="Default Downloads"
                                className="flex-grow px-3 py-2 bg-gray-900 text-gray-400 rounded-md border border-gray-600 text-sm"
                            />
                            <button onClick={handleSelectFolder} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white text-sm">
                                Browse
                            </button>
                         </div>
                    </div>
                )}
            </div>

            {/* CLOUD SETTINGS */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 pb-1 mb-2">
                    {t('settings.tab.cloud')}
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('settings.cloud.clientId')}
                    </label>
                    <input
                        type="text"
                        value={googleClientId}
                        onChange={e => setGoogleClientId(e.target.value)}
                        placeholder="Google Client ID"
                        className="w-full px-3 py-2 bg-gray-900 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                </div>

                <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                     <div>
                         <h4 className="text-sm font-bold text-gray-200">Google Drive</h4>
                         <p className="text-xs text-gray-500">{googleDrive.isAuthenticated ? t('settings.cloud.connected') : "Not connected"}</p>
                     </div>
                     <button 
                        onClick={googleDrive.handleConnect}
                        disabled={!googleClientId || googleDrive.isAuthenticated}
                        className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors ${googleDrive.isAuthenticated ? 'bg-green-900/50 text-green-400 cursor-default border border-green-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                     >
                         {googleDrive.isAuthenticated ? "Connected" : t('settings.cloud.connect')}
                     </button>
                </div>

                {googleDrive.isAuthenticated && (
                    <div className="space-y-2">
                        <button 
                            onClick={googleDrive.handleSyncCatalogs}
                            disabled={googleDrive.isSyncing}
                            className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-left flex items-center justify-between group transition-colors"
                        >
                            <div>
                                <div className="font-bold text-gray-200 text-sm">{t('settings.cloud.sync')}</div>
                                <div className="text-[10px] text-gray-400">Download from Drive</div>
                            </div>
                            {googleDrive.isSyncing ? <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div> : <svg className="w-4 h-4 text-gray-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                        </button>
                        
                        <button 
                            onClick={googleDrive.handleSaveToDrive}
                            disabled={googleDrive.isSyncing}
                            className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-left flex items-center justify-between group transition-colors"
                        >
                            <div>
                                <div className="font-bold text-gray-200 text-sm">{t('settings.cloud.saveProject')}</div>
                                <div className="text-[10px] text-gray-400">Backup full project</div>
                            </div>
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </button>
                        
                        <button 
                            onClick={googleDrive.handleCleanupDuplicates}
                            disabled={googleDrive.isSyncing}
                            className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-left flex items-center justify-between group transition-colors"
                        >
                            <div>
                                <div className="font-bold text-gray-200 text-sm">{t('settings.cloud.cleanup')}</div>
                                <div className="text-[10px] text-gray-400">Remove duplicate files</div>
                            </div>
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* APPEARANCE (Placeholder) */}
            <div className="space-y-4">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 pb-1 mb-2">
                    {t('settings.tab.appearance')}
                </h3>
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 text-center text-xs text-gray-500 italic">
                    Appearance settings coming soon.
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end items-center space-x-3 bg-gray-800/50 rounded-b-lg flex-shrink-0">
          <button onClick={handleCloseInternal} className="px-4 py-2 font-semibold text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors text-sm">
            {t('dialog.settings.close')}
          </button>
          <button onClick={handleSave} className="px-4 py-2 font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors text-sm">
            {t('dialog.settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
