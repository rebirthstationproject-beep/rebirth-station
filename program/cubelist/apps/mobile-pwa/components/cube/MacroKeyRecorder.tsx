'use client';

import { useCallback, useEffect, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { MacroStepDto } from '@/types/protocol';
import { useTranslation } from '@/lib/i18n/useTranslation';

const REC_COPY = {
  ko: {
    title: '키 녹화',
    intro: '녹화를 시작한 뒤 추가하고 싶은 단축키를 누르세요.',
    escNotePre: '중지하려면',
    escNoteSuffix: '또는 우측 "중지" 버튼을 누르세요.',
    recordingPrefix: '녹화 중 ·',
    recordingSuffix: '개 캡처됨',
    idle: '대기',
    stop: '중지',
    start: '녹화 시작',
    emptyHint: '아직 캡처된 키가 없습니다',
    pcOnlyNote: '마우스 클릭·앱 실행 같은 단계는 PC 앱 측 녹화(향후)가 필요하며 본 시트에서는 캡처되지 않습니다.',
    clearBtn: '지우기',
    cancel: '취소',
    addToMacro: '매크로에 추가',
    escSheetHint: '대기 상태에서 Esc 로 시트를 닫습니다 (녹화 중에는 Esc 가 녹화 중지).',
  },
  en: {
    title: 'Record keys',
    intro: 'Start recording, then press the shortcuts you want to add.',
    escNotePre: 'To stop, press',
    escNoteSuffix: 'or the "Stop" button on the right.',
    recordingPrefix: 'Recording ·',
    recordingSuffix: 'captured',
    idle: 'Idle',
    stop: 'Stop',
    start: 'Start recording',
    emptyHint: 'No keys captured yet',
    pcOnlyNote:
      'Mouse clicks and app launches need PC-side recording (future) — this sheet captures keys only.',
    clearBtn: 'Clear',
    cancel: 'Cancel',
    addToMacro: 'Add to macro',
    escSheetHint: 'Esc closes the sheet when idle (Esc stops recording while active).',
  },
  ja: {
    title: 'キー録画',
    intro: '録画を開始してから、追加したいショートカットを押してください。',
    escNotePre: '停止するには',
    escNoteSuffix: 'または右の「停止」ボタンを押してください。',
    recordingPrefix: '録画中 ·',
    recordingSuffix: '個キャプチャ',
    idle: '待機中',
    stop: '停止',
    start: '録画開始',
    emptyHint: 'まだキャプチャされたキーはありません',
    pcOnlyNote:
      'マウス クリックやアプリ起動などのステップは PC アプリ側録画 (将来) が必要で、本シートではキャプチャされません。',
    clearBtn: 'クリア',
    cancel: 'キャンセル',
    addToMacro: 'マクロに追加',
    escSheetHint: '待機状態で Esc を押すとシートを閉じます (録画中は Esc で録画停止)。',
  },
} as const;

interface MacroKeyRecorderProps {
  open: boolean;
  onClose: () => void;
  /** 녹화 완료 → key step 1개 또는 시퀀스 반환 */
  onCapture: (steps: MacroStepDto[]) => void;
}

interface CapturedKey {
  keys: string[];
  raw: string;
}

/**
 * 키 녹화 시트 — 사용자가 누른 키 조합을 캡처해 key step으로 변환.
 *
 * 정착본
 * - actions/shortcut.rs 키 매핑(ctrl/shift/alt/meta/문자/F1-F12 등)과 동일 어휘
 * - 한 번 누름당 1 step
 * - 비-ASCII 키(한글 입력기 등)는 무시
 * - 안전: click·launch_app·focus_window는 PC 앱 측 W2 작업이므로 본 UI에서 제외
 */
export function MacroKeyRecorder({ open, onClose, onCapture }: MacroKeyRecorderProps) {
  const [captured, setCaptured] = useState<CapturedKey[]>([]);
  const [recording, setRecording] = useState(false);
  const { locale } = useTranslation();
  const r = REC_COPY[locale] ?? REC_COPY.ko;

  // 시트 열림/닫힘 시 상태 초기화
  useEffect(() => {
    if (open) {
      setCaptured([]);
      setRecording(false);
    }
  }, [open]);

  const stop = useCallback((): void => setRecording(false), []);

  // R 키 — 시트 열림 + 대기 상태에서 녹화 시작 (녹화 중에는 캡처 대상 키이므로 트리거 X)
  useEffect(() => {
    if (!open || recording) return;
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      }
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setRecording(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, recording]);

  useEffect(() => {
    if (!open || !recording) return;

    const onKey = (e: KeyboardEvent): void => {
      // ESC = 녹화 중지 (트랩보다 우선)
      if (e.key === 'Escape') {
        e.preventDefault();
        stop();
        return;
      }
      // modifier 단독은 캡처 X (조합 완성 시점에 캡처)
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];
      if (e.ctrlKey) keys.push('ctrl');
      if (e.shiftKey) keys.push('shift');
      if (e.altKey) keys.push('alt');
      if (e.metaKey) keys.push('win');

      const main = mapKey(e.key);
      if (main) keys.push(main);

      if (keys.length === 0) return;

      const raw = keys.join('+');
      setCaptured((prev) => [...prev, { keys, raw }]);
    };

    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, recording, stop]);

  function commit(): void {
    if (captured.length === 0) return;
    onCapture(captured.map((c): MacroStepDto => ({ kind: 'key', keys: c.keys })));
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={r.title}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">{r.intro}</p>
        {recording && (
          <div
            role="note"
            className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-900 dark:text-red-200 flex items-center gap-2"
          >
            <span>{r.escNotePre}</span>
            {/* VC (영구): kbd-style-guide §의도적 override 패턴 1 — 위험·경고 톤 빨간 배경.
                녹화 중 ESC 안내는 시각적 긴급성 필요 → 글로벌 kbd 스타일 override 정당. */}
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-red-900/40 border border-red-300 font-mono text-[11px]">
              ESC
            </kbd>
            <span>{r.escNoteSuffix}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            {recording ? (
              <>
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 cubelist-record-pulse"
                  aria-hidden
                />
                <span aria-live="polite">
                  {r.recordingPrefix} {captured.length} {r.recordingSuffix}
                </span>
              </>
            ) : (
              <span className="text-ink-muted">{r.idle}</span>
            )}
          </span>
          {recording ? (
            <button
              type="button"
              onClick={stop}
              className="px-3 py-1.5 rounded-lg text-xs bg-surface-2"
            >
              {r.stop}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRecording(true)}
              className="px-3 py-1.5 rounded-lg text-xs bg-rbs-accent text-white inline-flex items-center gap-1.5"
              title={
                locale === 'en'
                  ? 'Press R to start recording'
                  : locale === 'ja'
                    ? 'R キーで録画開始'
                    : 'R 키로 녹화 시작'
              }
            >
              {r.start}
              <kbd className="text-[10px]">R</kbd>
            </button>
          )}
        </div>

        <div className="border border-border bg-surface-2 rounded-lg p-3 min-h-[120px]">
          {captured.length === 0 ? (
            <p className="text-xs text-ink-muted text-center py-6">{r.emptyHint}</p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {captured.map((c, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-mono text-ink-muted">#{idx + 1}</span>
                  <kbd className="px-2 py-0.5 rounded bg-surface border border-border font-mono text-xs">
                    {c.raw}
                  </kbd>
                </li>
              ))}
            </ol>
          )}
        </div>

        <p className="text-[10px] text-ink-muted">{r.pcOnlyNote}</p>
        {!recording && (
          <p className="text-[10px] text-ink-muted text-right hidden sm:block">{r.escSheetHint}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setCaptured([])}
            disabled={captured.length === 0}
            className="px-3 py-2 rounded-lg text-sm border disabled:opacity-50"
          >
            {r.clearBtn}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-sm text-ink-muted hover:bg-gray-50"
          >
            {r.cancel}
          </button>
          <button
            type="button"
            onClick={commit}
            disabled={captured.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-rbs-accent text-white disabled:opacity-50"
          >
            {r.addToMacro} ({captured.length})
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

// actions/shortcut.rs::map_key와 동일 어휘 + 브라우저 KeyboardEvent.key 매핑
function mapKey(eventKey: string): string | null {
  const k = eventKey;

  // 단일 문자 (a, b, 1, ; 등) — ASCII만 허용
  if (k.length === 1) {
    return k.toLowerCase();
  }

  const lower = k.toLowerCase();
  switch (lower) {
    case 'tab':
    case 'enter':
    case 'escape':
    case 'space':
    case 'backspace':
    case 'delete':
    case 'home':
    case 'end':
      return lower;
    case 'arrowup':
      return 'up';
    case 'arrowdown':
      return 'down';
    case 'arrowleft':
      return 'left';
    case 'arrowright':
      return 'right';
    case 'pageup':
      return 'pageup';
    case 'pagedown':
      return 'pagedown';
    case ' ':
      return 'space';
    default:
      if (/^f([1-9]|1[0-2])$/i.test(k)) {
        return lower;
      }
      return null;
  }
}
