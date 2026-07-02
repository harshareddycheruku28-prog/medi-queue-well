import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Translations = Record<string, string>;

type Language = 'en' | 'te' | 'hi';

const translationFiles: Record<Language, string> = {
  en: '/translations/en.json',
  te: '/translations/te.json',
  hi: '/translations/hi.json',
};

interface I18nContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    const stored = localStorage.getItem('language') as Language | null;
    if (stored) setLanguage(stored);
  }, []);

  useEffect(() => {
    import(`./translations/${language}.json`)
      .then((mod) => setTranslations(mod.default))
      .catch(() => setTranslations({}));
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string) => translations[key] ?? key;

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
