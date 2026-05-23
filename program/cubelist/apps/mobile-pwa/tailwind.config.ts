import type { Config } from 'tailwindcss';

/**
 * Tailwind 컬러 설정.
 *
 * 정착본: docs/design-tokens.md (CSS 변수 시스템)
 * 영구: 브랜드 컬러(핑크 #E91E63, 미드나이트 #1A237E) 절대 교체 금지
 *
 * RGB 채널을 CSS 변수로 보관하고 `rgb(var(--token) / <alpha-value>)` 패턴 사용 —
 * `bg-cubelist-pink/20` 같은 alpha 변형이 자동 동작.
 * `.dark` 클래스에서 시멘틱 토큰 자동 전환 (수동 `dark:` prefix 없이도 동작).
 */

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 브랜드 — ver.주소모아 콜라보 전용 (SD-A 2026-05-23: 코어 액센트는 rbs-accent 사용)
        cubelist: {
          pink: 'rgb(var(--rbs-pink) / <alpha-value>)',
          midnight: 'rgb(var(--rbs-midnight) / <alpha-value>)',
          'pink-soft': 'rgb(var(--rbs-pink-soft) / <alpha-value>)',
        },
        // 리버스 스테이션 코어 액센트 (SD-A 2026-05-23 신규) — 무채색 슬레이트
        rbs: {
          accent: 'rgb(var(--rbs-accent) / <alpha-value>)',
          'accent-strong': 'rgb(var(--rbs-accent-strong) / <alpha-value>)',
          'accent-soft': 'rgb(var(--rbs-accent-soft) / <alpha-value>)',
        },
        // 시멘틱 — 라이트/다크 자동 전환 (globals.css :root / .dark)
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          // 하위 호환: 기존 코드의 `dark:bg-surface-dark` 명시 사용
          dark: '#0a0a0a',
        },
        'surface-2': {
          DEFAULT: 'rgb(var(--surface-2) / <alpha-value>)',
          dark: '#171717',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          dark: '#f3f4f6',
        },
        'ink-muted': {
          DEFAULT: 'rgb(var(--ink-muted) / <alpha-value>)',
          dark: '#9ca3af',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          dark: '#262626',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
