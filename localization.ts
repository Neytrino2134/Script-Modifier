
import { createContext, useContext, Dispatch, SetStateAction } from 'react';
import { en } from './locales/en';
import { ru } from './locales/ru';
import { es } from './locales/es';
import { uz } from './locales/uz';
import { de } from './locales/de';
import { fr } from './locales/fr';
import { it } from './locales/it';
import { pt } from './locales/pt';
import { zh } from './locales/zh';

// --- Configuration ---

// 1. Register your translation files here
export const translations = {
  en,
  ru,
  es,
  uz,
  de,
  fr,
  it,
  pt,
  zh,
  sys: {}, // System language (empty object, handled logic-side)
  // Add other languages here as needed
};

// 2. Configure UI metadata for languages
export const supportedLanguages = [
  { code: 'en', name: 'English', englishName: 'English', label: 'EN' },
  { code: 'ru', name: 'Русский', englishName: 'Russian', label: 'RU' },
  { code: 'es', name: 'Español', englishName: 'Spanish', label: 'ES' },
  { code: 'de', name: 'Deutsch', englishName: 'German', label: 'DE' },
  { code: 'fr', name: 'Français', englishName: 'French', label: 'FR' },
  { code: 'it', name: 'Italiano', englishName: 'Italian', label: 'IT' },
  { code: 'pt', name: 'Português', englishName: 'Portuguese', label: 'PT' },
  { code: 'uz', name: 'Oʻzbek', englishName: 'Uzbek', label: 'UZ' },
  { code: 'zh', name: '中文', englishName: 'Chinese', label: 'ZH' },
  { code: 'sys', name: 'System (Keys)', englishName: 'System', label: 'SYS' },
] as const;

// --- Types & Logic ---

export type LanguageCode = keyof typeof translations;

// Helper to ensure type safety when iterating
export const availableLanguageCodes = Object.keys(translations) as LanguageCode[];

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: Dispatch<SetStateAction<LanguageCode>>;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Robust translation function with fallback
export const getTranslation = (lang: LanguageCode, key: string, options?: { [key: string]: string | number }): string => {
  // If System language is selected, return the raw key immediately
  if (lang === 'sys') {
      return key;
  }

  // @ts-ignore
  const primaryLang = translations[lang];
  const defaultLang = translations['en']; // Fallback language

  // 1. Try primary language, 2. Try fallback language, 3. Return key as last resort
  let translation = primaryLang?.[key] || defaultLang[key] || key;

  if (options && typeof translation === 'string') {
    Object.keys(options).forEach(optionKey => {
      translation = translation.replace(`{${optionKey}}`, String(options[optionKey]));
    });
  }
  
  return translation;
};
