'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Locale } from '@/lib/i18n/messages';

const LABELS: Record<Locale, string> = { ko: 'KO', en: 'EN', ja: 'JA' };

const ARIA_LABEL: Record<Locale, string> = {
  ko: '언어 선택',
  en: 'Select language',
  ja: '言語選択',
};

interface LocaleSwitcherProps {
  /** "compact"는 헤더용 작은 크기, "default"는 페이지 본문용 */
  size?: 'compact' | 'default';
}

/**
 * 재사용 가능한 언어 선택 위젯.
 *
 * 정착본
 * - 3-way 토글 (ko / en / ja)
 * - useTranslation 컨텍스트와 직접 연결 — props 없이 어디서나 동일하게 동작
 * - aria-pressed로 현재 선택 표시
 */
export function LocaleSwitcher({ size = 'default' }: LocaleSwitcherProps) {
  const { locale, setLocale } = useTranslation();
  const isCompact = size === 'compact';
  return (
    <div
      role="group"
      aria-label={ARIA_LABEL[locale] ?? ARIA_LABEL.ko}
      className={`inline-flex items-center rounded-lg border border-border bg-surface overflow-hidden font-mono ${
        isCompact ? 'text-[10px] sm:text-[11px]' : 'text-xs'
      }`}
    >
      {(['ko', 'en', 'ja'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`${isCompact ? 'px-1.5 sm:px-2 py-1' : 'px-2.5 py-1.5'} ${
            locale === l
              ? 'bg-rbs-accent text-white'
              : 'text-ink-muted hover:text-rbs-accent'
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
