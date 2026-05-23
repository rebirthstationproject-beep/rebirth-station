'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { detectLocale, MESSAGES, type Locale, type MessageKey } from './messages';

const STORAGE_KEY = 'cubelist:locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  /** SSR 시 강제 locale — 클라이언트에서 detectLocale로 덮어씀 */
  defaultLocale?: Locale;
}

export function I18nProvider({ children, defaultLocale = 'ko' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    const resolved =
      stored === 'ko' || stored === 'en' || stored === 'ja' ? stored : detectLocale();
    setLocaleState(resolved);
    // <html lang> 동기화 — 스크린리더·번역 도구가 정확히 인식하도록
    if (typeof document !== 'undefined') {
      document.documentElement.lang = resolved;
    }
  }, []);

  const setLocale = (l: Locale): void => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = l;
    }
  };

  const t = (key: MessageKey): string => MESSAGES[locale][key] ?? MESSAGES.ko[key] ?? key;

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: 'ko',
      setLocale: () => undefined,
      t: (key) => MESSAGES.ko[key] ?? key,
    };
  }
  return ctx;
}
