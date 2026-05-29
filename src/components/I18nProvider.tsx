'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale } from '@/lib/i18n';
import { loadLocale, getTranslations } from '@/lib/i18n';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('en');
  const [ready, setReady] = useState(false);

  // Load translations for current locale
  useEffect(() => {
    loadLocale(locale).then(() => setReady(true));
  }, [locale]);

  // Detect browser language on mount
  useEffect(() => {
    const browserLang = navigator.language || (navigator as any).browserLanguage;
    if (browserLang.startsWith('zh')) {
      setLocale('zh');
    } else if (browserLang.startsWith('ja')) {
      setLocale('ja');
    } else if (browserLang.startsWith('ko')) {
      setLocale('ko');
    } else {
      setLocale('en');
    }
  }, []);

  const t = useCallback((path: string) => {
    const data = getTranslations(locale);
    if (!data) return path;
    const keys = path.split('.');
    let result: any = data;
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return path; // Fallback to path if not found
      }
    }
    return typeof result === 'string' ? result : path;
  }, [locale]);

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
