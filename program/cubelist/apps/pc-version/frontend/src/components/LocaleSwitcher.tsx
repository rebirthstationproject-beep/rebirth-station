/**
 * LocaleSwitcher (M8 cron #23) — TopBar 우측 3-state 버튼.
 *
 * KO|EN|JA 인라인 버튼 (드롭다운 대신 즉시 토글).
 * useTranslation().setLocale 호출 → localStorage 영속 + <html lang> 동기.
 */

import { LOCALES, type Locale } from '../lib/i18n/messages';
import { useTranslation } from '../lib/i18n/useTranslation';

const LABEL: Record<Locale, string> = {
  ko: 'KO',
  en: 'EN',
  ja: 'JA',
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useTranslation();
  return (
    <div className="locale-switcher" role="group" aria-label="언어 선택">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          className={`locale-btn ${locale === l ? 'is-active' : ''}`}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          title={l}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
