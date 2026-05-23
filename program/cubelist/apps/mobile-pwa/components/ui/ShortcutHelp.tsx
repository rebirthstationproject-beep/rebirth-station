'use client';

import { useEffect, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { formatShortcut, type ShortcutBinding } from '@/lib/hooks/useShortcuts';
import { useTranslation } from '@/lib/i18n/useTranslation';

const HELP_COPY = {
  ko: {
    title: '키보드 단축키',
    disabledBanner: '현재 시트·모달이 열려 있어 단축키가 잠시 잠겨 있습니다. 닫고 다시 사용하세요.',
    footerHint: '입력 상자에 포커스가 있거나 모달이 열려 있으면 단축키가 비활성화됩니다.',
    srKeyPrefix: '키 조합',
  },
  en: {
    title: 'Keyboard shortcuts',
    disabledBanner: 'Shortcuts are paused while a sheet or modal is open. Close it and try again.',
    footerHint: 'Shortcuts are disabled when an input is focused or a modal is open.',
    srKeyPrefix: 'Key combination',
  },
  ja: {
    title: 'キーボード ショートカット',
    disabledBanner: 'シートやモーダルが開いているため、ショートカットは一時的に無効です。閉じてから再度お試しください。',
    footerHint: '入力欄にフォーカスがある場合や、モーダルが開いている場合はショートカットが無効になります。',
    srKeyPrefix: 'キー組み合わせ',
  },
} as const;

interface ShortcutHelpProps {
  open: boolean;
  onClose: () => void;
  bindings: ShortcutBinding[];
  /**
   * 현재 단축키 일시 정지된 상태 — 시트·모달이 열려 있어 useShortcuts가 비활성일 때 true.
   * 미지정 시 도움말 마운트 시 DOM에서 다른 `[role=dialog][aria-modal=true]` 존재를 자동 감지.
   */
  disabled?: boolean;
}

export function ShortcutHelp({ open, onClose, bindings, disabled }: ShortcutHelpProps) {
  const [autoDisabled, setAutoDisabled] = useState(false);
  const { locale } = useTranslation();
  const c = HELP_COPY[locale] ?? HELP_COPY.ko;

  // disabled prop 미지정 시 DOM 자동 감지 — open 시점에 다른 dialog 존재 여부 확인
  useEffect(() => {
    if (!open || disabled !== undefined) return;
    if (typeof document === 'undefined') return;
    const others = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
    // ShortcutHelp 자신을 제외하고 다른 dialog가 있으면 disabled
    setAutoDisabled(others.length > 1);
  }, [open, disabled]);

  const effectiveDisabled = disabled ?? autoDisabled;
  return (
    <BottomSheet open={open} onClose={onClose} title={c.title}>
      {effectiveDisabled && (
        <div
          role="note"
          className="mb-3 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 text-xs text-yellow-900 dark:text-yellow-200"
        >
          {c.disabledBanner}
        </div>
      )}
      <ul className="flex flex-col divide-y">
        {[...bindings]
          .map((b, idx) => ({ b, idx }))
          .sort((a, b) => {
            const pa = a.b.priority ?? 0;
            const pb = b.b.priority ?? 0;
            if (pa !== pb) return pb - pa; // 높은 priority 위로
            return a.idx - b.idx; // 동률이면 등록 순서
          })
          .map(({ b }) => (
          <li
            key={`${b.key}-${b.mod ? 'm' : ''}-${b.shift ? 's' : ''}`}
            className={`py-2 flex items-center justify-between ${
              effectiveDisabled ? 'opacity-50' : ''
            }`}
          >
            <span className="text-sm flex items-center gap-1.5">
              {b.label}
              {(b.priority ?? 0) > 0 && (
                <span
                  className="text-[9px] px-1 py-0.5 rounded bg-rbs-accent-soft text-rbs-accent font-mono"
                  title="우선순위"
                >
                  P{b.priority}
                </span>
              )}
            </span>
            <kbd
              className={`px-2 py-1 rounded-md text-xs font-mono ${
                effectiveDisabled ? 'bg-surface-2 text-ink-muted' : 'bg-gray-100'
              }`}
              aria-label={`${c.srKeyPrefix}: ${formatShortcut(b)}`}
            >
              {formatShortcut(b)}
            </kbd>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-muted mt-4">{c.footerHint}</p>
    </BottomSheet>
  );
}
