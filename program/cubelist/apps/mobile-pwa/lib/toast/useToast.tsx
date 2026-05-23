'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const TOAST_LABELS = {
  ko: { region: '알림', close: '닫기' },
  en: { region: 'Notifications', close: 'Close' },
  ja: { region: '通知', close: '閉じる' },
} as const;

export type ToastLevel = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: number;
  level: ToastLevel;
  message: string;
  /** 자동 dismiss (ms). 0 = 수동 닫기만 */
  duration: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (input: { level?: ToastLevel; message: string; duration?: number }) => number;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3_500;
/**
 * 동시 표시 가능한 최대 Toast 개수. 초과 시 가장 오래된 것부터 자동 제거.
 * 시각 부담 + 모바일 화면 영역 보호.
 * Stage 2 user 옵션 확장 BLOCKED (OM·PA) — user_settings 인프라 + UI 설정 화면 도입 시 active.
 * VZ 동기화: BLOCKED 활성화 트리거는 `docs/night-auto-log.md` "Stage 2 BLOCKED 활성화 트리거" 표 참조.
 */
const MAX_VISIBLE_TOASTS = 5;

/**
 * level별 권장 default duration — docs/toast-guide.md 일치.
 * 명시적 duration 전달 시 본 값은 무시됩니다.
 */
const LEVEL_DEFAULT_DURATION: Record<ToastLevel, number> = {
  info: 3_500,
  success: 2_500,
  warning: 4_500,
  error: 6_000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounterRef = useRef(0);

  const dismissToast = useCallback((id: number): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Esc 키 → 가장 최근 토스트 dismiss (input 포커스 시 비활성)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (target.isContentEditable) return;
      }
      setToasts((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showToast = useCallback(
    ({ level = 'info', message, duration }: { level?: ToastLevel; message: string; duration?: number }): number => {
      // 개발 모드 가이드 경고 — docs/toast-guide.md "메시지 길이 가이드" 참조
      if (process.env.NODE_ENV !== 'production' && message.length > 120) {
        console.warn(
          `[cubelist] Toast 메시지가 120자(${message.length})를 초과합니다. 짧은 한 줄 + 자세한 안내는 모달/페이지로 분리하세요. message="${message.slice(0, 80)}…"`,
        );
      }
      // duration 미지정 시 level별 default 적용
      const resolvedDuration = duration ?? LEVEL_DEFAULT_DURATION[level];
      const id = ++idCounterRef.current;
      setToasts((prev) => {
        const next = [...prev, { id, level, message, duration: resolvedDuration }];
        // 최대치 초과 시 가장 오래된 것부터 제거
        if (next.length > MAX_VISIBLE_TOASTS) {
          return next.slice(next.length - MAX_VISIBLE_TOASTS);
        }
        return next;
      });
      if (resolvedDuration > 0) {
        setTimeout(() => dismissToast(id), resolvedDuration);
      }
      return id;
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

function ToastViewport() {
  const ctx = useContext(ToastContext);
  const { locale } = useTranslation();
  const labels = TOAST_LABELS[locale] ?? TOAST_LABELS.ko;
  if (!ctx || ctx.toasts.length === 0) return null;
  return (
    <div
      role="region"
      aria-label={labels.region}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 max-w-[90vw] w-fit pointer-events-none"
    >
      {ctx.toasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          onDismiss={() => ctx.dismissToast(t.id)}
          closeLabel={labels.close}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
  closeLabel,
}: {
  toast: Toast;
  onDismiss: () => void;
  closeLabel: string;
}) {
  useEffect(() => {
    // 자동 dismiss는 Provider에서 setTimeout 처리 — 여기서는 무시
  }, []);

  const palette = paletteFor(toast.level);
  return (
    <div
      role={toast.level === 'error' || toast.level === 'warning' ? 'alert' : 'status'}
      aria-live="polite"
      className={`pointer-events-auto rounded-xl shadow-lg px-4 py-2.5 text-sm flex items-start gap-3 ${palette}`}
    >
      <span aria-hidden className="mt-0.5 flex-shrink-0">{iconFor(toast.level)}</span>
      <span className="flex-1 break-words leading-relaxed">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={closeLabel}
        className="text-current opacity-70 hover:opacity-100 text-base leading-none"
      >
        ×
      </button>
    </div>
  );
}

function paletteFor(level: ToastLevel): string {
  switch (level) {
    case 'success':
      return 'bg-green-600 text-white';
    case 'warning':
      return 'bg-yellow-500 text-black';
    case 'error':
      return 'bg-red-600 text-white';
    case 'info':
    default:
      return 'bg-gray-900 text-white';
  }
}

function iconFor(level: ToastLevel): string {
  switch (level) {
    case 'success':
      return '✓';
    case 'warning':
      return '⚠';
    case 'error':
      return '✕';
    case 'info':
    default:
      return '●';
  }
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // RS: 개발 모드에서 Provider 누락 시 조용한 fallback이 진단 어려움을 만들므로 1회 경고.
    // production에서는 SSR/테스트 안전을 위해 무음 noop 유지.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[cubelist] useToast()가 ToastProvider 외부에서 호출되었습니다. showToast/dismissToast는 noop으로 동작합니다. layout에 <ToastProvider>를 추가하세요.',
      );
    }
    return {
      toasts: [],
      showToast: () => 0,
      dismissToast: () => undefined,
    };
  }
  return ctx;
}
