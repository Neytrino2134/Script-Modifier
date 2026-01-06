
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage, supportedLanguages, availableLanguageCodes, LanguageCode } from '../../localization';
import Tooltip from './Tooltip';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  // Track the last selected non-English language to show on the right button
  // Initialize with current language if it's not EN, otherwise default to RU
  const [secondaryLangCode, setSecondaryLangCode] = useState<LanguageCode>(() => {
      return language === 'en' ? 'ru' : language;
  });

  // Sync secondary language if the global language changes to something that isn't EN
  useEffect(() => {
      if (language !== 'en') {
          setSecondaryLangCode(language);
      }
  }, [language]);

  const activeLanguages = useMemo(() => {
    const langs = supportedLanguages.filter(lang => 
      availableLanguageCodes.includes(lang.code as any) && lang.code !== 'en'
    );
    // Sort to put 'sys' at the bottom
    return langs.sort((a, b) => {
        if (a.code === 'sys') return 1;
        if (b.code === 'sys') return -1;
        return 0;
    });
  }, []);

  const secondaryLang = activeLanguages.find(l => l.code === secondaryLangCode) || activeLanguages[0];

  const handleSecondaryClick = () => {
      if (language !== secondaryLang.code) {
          setLanguage(secondaryLang.code as LanguageCode);
      }
  };

  const handleOptionClick = (code: string) => {
      setLanguage(code as LanguageCode);
      setIsOpen(false);
  };
  
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
        // Use capture phase (true) to detect clicks even if Canvas stops propagation
        document.addEventListener('mousedown', handleClickOutside, true);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);
  
  // Calculate menu position
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
      if (isOpen && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setMenuStyle({
              position: 'fixed',
              top: `${rect.bottom + 6}px`,
              // Align right edge of menu with right edge of trigger button
              right: `${window.innerWidth - rect.right}px`,
              minWidth: '140px',
              zIndex: 9999
          });
      }
  }, [isOpen]);

  return (
    <div className="flex items-center h-9 gap-1">
        {/* EN Button */}
        <Tooltip title="English" position="bottom" className="h-full">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-bold transition-colors h-full rounded-md min-w-[36px] ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-700 text-gray-300 hover:bg-emerald-600 hover:text-white'
              }`}
            >
              EN
            </button>
        </Tooltip>
        
        {/* Secondary Language Group */}
        <div className="flex items-center h-full relative group">
             {/* Main Secondary Button - Switches to last used non-English lang */}
             <Tooltip title={secondaryLang.name} position="bottom" className="h-full">
                <button
                    onClick={handleSecondaryClick}
                    className={`px-2 py-1 text-xs font-bold transition-colors h-full min-w-[36px] flex items-center justify-center rounded-l-md ${
                        language === secondaryLang.code
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-700 text-gray-300 hover:bg-emerald-600 hover:text-white'
                    }`}
                >
                    {secondaryLang.label}
                </button>
             </Tooltip>
             
             {/* Dropdown Trigger - Opens Menu */}
             <button
                ref={triggerRef}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`px-1 py-1 h-full rounded-r-md flex items-center justify-center transition-colors border-l ${
                    language === secondaryLang.code
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
                    : 'bg-gray-700 hover:bg-emerald-600 text-gray-400 hover:text-white border-gray-600/30'
                }`}
             >
                 <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
             </button>
             
             {/* Dropdown Menu Portal */}
             {isOpen && createPortal(
                 <div 
                    ref={menuRef}
                    style={menuStyle}
                    className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl py-1 flex flex-col animate-fade-in-up origin-top-right"
                    onWheel={e => e.stopPropagation()}
                 >
                     <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 mb-1 select-none">
                         Select Language
                     </div>
                     {activeLanguages.map(lang => (
                         <button
                            key={lang.code}
                            onClick={() => handleOptionClick(lang.code)}
                            className={`px-4 py-2 text-left text-sm hover:bg-gray-700 flex justify-between items-center group transition-colors ${
                                language === lang.code ? 'text-emerald-400 font-bold bg-gray-700/50' : 'text-gray-300'
                            }`}
                         >
                             <span className="truncate mr-4">{lang.name}</span>
                             <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${language === lang.code ? 'bg-emerald-900/30 text-emerald-400' : 'bg-gray-900 text-gray-500 group-hover:text-gray-400'}`}>
                                 {lang.label}
                             </span>
                         </button>
                     ))}
                 </div>,
                 document.body
             )}
        </div>
    </div>
  );
};

export default LanguageSelector;
