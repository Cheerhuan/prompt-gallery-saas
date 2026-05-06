'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, translations } from '@/lib/i18n';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language || (navigator as any).browserLanguage;
    if (browserLang.startsWith('zh')) {
      setLocale('zh');
    } else {
      setLocale('en');
    }
  }, []);

  const t = (path: string) => {
    const keys = path.split('.');
    let result: any = translations[locale];
    for (const key of keys) {
      if (result[key]) {
        result = result[key];
      } else {
        return path; // Fallback to path if not found
      }
    }
    return result;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
};
