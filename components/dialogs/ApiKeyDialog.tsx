
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../localization';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onSave: (apiKey: string, useFreeKey: boolean) => void;
  onClose: () => void;
  onClear: () => void;
  hasExistingKey: boolean;
  initialUseFreeKey: boolean;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ isOpen, onSave, onClose, onClear, hasExistingKey, initialUseFreeKey }) => {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState('');
  const [useFreeKey, setUseFreeKey] = useState(initialUseFreeKey);
  // Store the generated mask to compare against later
  const [currentMask, setCurrentMask] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Check local storage directly to determine mask length
      const storedKey = localStorage.getItem('gemini-api-key');
      
      if (storedKey) {
          // Create a mask that matches the length of the key
          const mask = '●'.repeat(storedKey.length);
          setApiKey(mask);
          setCurrentMask(mask);
      } else {
          setApiKey('');
          setCurrentMask('');
      }
      
      setUseFreeKey(initialUseFreeKey);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialUseFreeKey]);

  const handleSave = () => {
    // If the value matches our generated mask, send empty string (no change)
    const keyToSend = (currentMask && apiKey === currentMask) ? '' : apiKey.trim();
    onSave(keyToSend, useFreeKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 cursor-default"
      onMouseDown={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700 flex flex-col"
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-emerald-400">{t('dialog.apiKey.title')}</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-300">
            {t('dialog.apiKey.description')}
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-emerald-400 hover:text-emerald-300 hover:underline"
          >
            {t('dialog.settings.getApiKeyLink')}
          </a>
          {hasExistingKey && (
            <div className="text-sm text-emerald-300 bg-emerald-900/50 p-3 rounded-md border border-emerald-700">
              {t('dialog.apiKey.keyExists')}
            </div>
          )}
          <div>
            <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-300 mb-2">
              {hasExistingKey ? t('dialog.apiKey.update') : t('dialog.settings.apiKeyLabel')}
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
              {t('dialog.apiKey.useFreeKey')}
            </label>
          </div>
        </div>
        <div className="p-3 border-t border-gray-700 flex justify-between items-center bg-gray-800/50 rounded-b-lg">
          {hasExistingKey ? (
            <button
              onClick={onClear}
              className="px-4 py-2 font-semibold text-white bg-gray-700 rounded-md hover:bg-red-700 transition-colors"
            >
              {t('dialog.apiKey.clear')}
            </button>
          ) : <div />}
          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                {t('dialog.rename.cancel')}
            </button>
            <button onClick={handleSave} className="px-4 py-2 font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors">
              {hasExistingKey ? t('dialog.apiKey.update') : t('dialog.apiKey.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyDialog;
