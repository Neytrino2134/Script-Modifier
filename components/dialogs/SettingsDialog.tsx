import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../localization';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (options: { key: string, useFree: boolean }) => void;
  currentApiKey: string;
  useFreeKeyProp: boolean;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, onSave, currentApiKey, useFreeKeyProp }) => {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [useFreeKey, setUseFreeKey] = useState(useFreeKeyProp);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(currentApiKey);
      setUseFreeKey(useFreeKeyProp);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentApiKey, useFreeKeyProp]);

  const handleSave = () => {
    onSave({ key: apiKey, useFree: useFreeKey });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div 
        className="bg-gray-800 rounded-lg w-full max-w-lg border border-gray-700 flex flex-col" 
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-emerald-400">{t('dialog.settings.title')}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 rounded-full hover:bg-gray-600 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-300 mb-2">
              {t('dialog.settings.apiKeyLabel')}
            </label>
            <input
              id="api-key-input"
              ref={inputRef}
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={t('dialog.settings.apiKeyPlaceholder')}
              disabled={useFreeKey}
              className="w-full px-3 py-2 bg-gray-900 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-800 disabled:text-gray-500"
            />
          </div>
          <div className="flex items-center space-x-2">
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
            className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline"
          >
            {t('dialog.settings.getApiKeyLink')}
          </a>
        </div>
        <div className="p-3 border-t border-gray-700 flex justify-end items-center space-x-3 bg-gray-800/50 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
            {t('dialog.settings.close')}
          </button>
          <button onClick={handleSave} className="px-4 py-2 font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors">
            {t('dialog.settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;