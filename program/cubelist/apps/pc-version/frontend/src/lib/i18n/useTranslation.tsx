/**
 * useTranslation hook + I18nProvider (M8 cron #22).
 *
 * 모바일 PWA `apps/mobile-pwa/lib/i18n/useTranslation.tsx` 패턴 이식 — Next.js 'use client'
 * 지시자만 제거 (Vite 단독 환경).
 *
 * 흐름:
 * 1. main.tsx 가 <I18nProvider> 로 <App /> 감쌈
 * 2. 컴포넌트에서 `const { t, locale, setLocale } = useTranslation()`
 * 3. localStorage `cubelist:locale` 영속, <html lang> 동기 갱신
 */

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

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Provider 외부에서 호출 시 ko fallback (테스트/HMR 안전)
    return {
      locale: 'ko',
      setLocale: () => undefined,
      t: (key) => MESSAGES.ko[key] ?? key,
    };
  }
  return ctx;
}
