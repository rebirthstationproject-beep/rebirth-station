'use client';

import { useTheme, type ThemeChoice } from '@/lib/theme/useTheme';

const OPTIONS: Array<{ value: ThemeChoice; label: string; icon: string }> = [
  { value: 'light', label: '라이트', icon: '☀' },
  { value: 'auto', label: '자동', icon: '◐' },
  { value: 'dark', label: '다크', icon: '☾' },
];

export function ThemeToggle() {
  const { choice, setChoice } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="테마"
      className="inline-flex border border-border bg-surface rounded-full p-0.5"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={choice === o.value}
          onClick={() => setChoice(o.value)}
          className={`px-2.5 py-0.5 text-xs rounded-full transition ${
            choice === o.value
              ? 'bg-rbs-accent text-white'
              : 'text-ink-muted hover:text-ink'
          }`}
          title={o.label}
        >
          <span aria-hidden>{o.icon}</span>
          <span className="sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
