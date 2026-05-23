'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ThemeChoice = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'cubelist:theme';

interface ThemeContextValue {
  choice: ThemeChoice;
  resolved: ResolvedTheme;
  setChoice: (c: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * 라이트/다크/자동 테마 Provider.
 *
 * 정착본 §7
 * - light: 항상 라이트
 * - dark: 항상 다크 (거치 모드 OLED 검정)
 * - auto: 시스템 prefers-color-scheme + 거치 모드 야간 시간대(18~6시) 자동 dim 가능
 *
 * Tailwind darkMode='class'와 연동 — html 요소에 'dark' 클래스 부여.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // default = 'dark' (사용자 결정 2026-05-22 Stream Deck 톤 반영)
  // — localStorage 저장된 선호가 있으면 그것을 우선
  const [choice, setChoiceState] = useState<ThemeChoice>('dark');
  const [systemDark, setSystemDark] = useState(true);

  // 초기 로드: localStorage + 시스템 선호
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      setChoiceState(stored);
    }
    // 미저장 시 default 'dark' 유지 (위 useState 초기값)

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mql.matches);
    const onChange = (e: MediaQueryListEvent): void => setSystemDark(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // auto일 때만 시스템 따름, 그 외는 사용자 선택 (default dark)
  const resolved: ResolvedTheme =
    choice === 'auto' ? (systemDark ? 'dark' : 'light') : choice;

  // html class + meta[name=theme-color] 동기화
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // PWA·모바일 OS 상태바 색상 — 라이트: 슬레이트 / 다크: Stream Deck 톤 #1a1d20 (2026-05-23 사용자 명시)
    const themeColor = resolved === 'dark' ? '#1a1d20' : '#64748B';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = themeColor;
  }, [resolved]);

  const setChoice = useCallback((c: ThemeChoice): void => {
    setChoiceState(c);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, c);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ choice, resolved, setChoice }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      choice: 'dark',
      resolved: 'dark',
      setChoice: () => undefined,
    };
  }
  return ctx;
}
