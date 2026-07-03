import React, { createContext, useContext, useState, ReactNode } from 'react';
import en from '../../locales/en.json';
import hi from '../../locales/hi.json';
import te from '../../locales/te.json';

type Language = 'en' | 'te' | 'hi';

const translations: Record<Language, any> = {
  en,
  hi,
  te,
};

interface I18nContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('language') as Language | null;
      if (stored === 'en' || stored === 'hi' || stored === 'te') {
        return stored;
      }
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const t = (key: string, replacements?: Record<string, string | number>) => {
    let text = translations[language]?.[key];
    
    // Fallback to English
    if (text === undefined || text === null) {
      text = translations['en']?.[key];
    }
    
    // Return key if missing
    if (text === undefined || text === null) {
      return key;
    }

    if (replacements) {
      let result = text;
      Object.entries(replacements).forEach(([k, v]) => {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
      return result;
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return { t: ctx.t, language: ctx.language, setLanguage: ctx.setLanguage };
};
