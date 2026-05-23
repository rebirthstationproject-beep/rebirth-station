'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const CLOSE_LABEL: Record<'ko' | 'en' | 'ja', string> = {
  ko: '닫기',
  en: 'Close',
  ja: '閉じる',
};

const CLOSE_TITLE: Record<'ko' | 'en' | 'ja', string> = {
  ko: '닫기 (Esc)',
  en: 'Close (Esc)',
  ja: '閉じる (Esc)',
};

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** ESC + 백드롭 클릭 시 닫힘 (기본 true) */
  dismissible?: boolean;
}

/**
 * 모바일 친화 바텀 시트.
 *
 * 정착본 §7: 첫 화면 12자 이하, 설정 깊이 3단계 이하 — 시트로 깊이 절약.
 * 거치 모드 + 풀스크린 환경에서도 동작.
 *
 * 접근성 (정착본)
 * - role=dialog + aria-modal=true
 * - 열릴 때 시트 첫 focusable에 자동 포커스
 * - 닫힐 때 트리거 요소로 포커스 복원
 * - Tab 키 시트 내부에 trap (Shift+Tab 처음에서 마지막, Tab 마지막에서 처음)
 */
export function BottomSheet({ open, onClose, title, children, dismissible = true }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const { locale } = useTranslation();
  const closeLabel = CLOSE_LABEL[locale] ?? CLOSE_LABEL.ko;
  const closeTitle = CLOSE_TITLE[locale] ?? CLOSE_TITLE.ko;

  // ESC 닫기
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  // 포커스 관리: 열림 시 시트 첫 focusable로 이동, 닫힘 시 원래 위치 복원
  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = (document.activeElement as HTMLElement) ?? null;

    requestAnimationFrame(() => {
      const target = sheetRef.current?.querySelector<HTMLElement>(
        '[autofocus], input, textarea, button:not([data-bottomsheet-close])',
      );
      target?.focus();
    });

    return () => {
      previouslyFocusedRef.current?.focus();
    };
  }, [open]);

  // Tab focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusables = sheet.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-black/40"
        onClick={dismissible ? onClose : undefined}
        tabIndex={-1}
      />
      <div
        ref={sheetRef}
        className="relative bg-surface text-ink w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
      >
        {title && (
          <header className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold">{title}</h2>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                data-bottomsheet-close
                className="text-ink-muted hover:text-ink text-xl leading-none px-2 py-1 rounded -mr-2"
                aria-label={closeLabel}
                title={closeTitle}
              >
                ✕
              </button>
            )}
          </header>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
