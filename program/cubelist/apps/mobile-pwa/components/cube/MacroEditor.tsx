'use client';

import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MacroKeyRecorder } from './MacroKeyRecorder';
import { useToast } from '@/lib/toast/useToast';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MacroStepDto } from '@/types/protocol';

const MACRO_COPY = {
  ko: {
    stagesLabel: '매크로 단계',
    maxReached: '최대치 도달',
    dragHint: '드래그 핸들로 순서 변경 가능',
    emptyHint: '단계가 없습니다. 아래에서 추가해주세요.',
    previewLabel: '시퀀스 미리보기',
    stepsUnit: '단계',
    copyBtn: '복사',
    copyAria: '시퀀스 텍스트 복사',
    copyTitle: '시퀀스 텍스트를 클립보드에 복사',
    copySuccess: '시퀀스를 클립보드에 복사했습니다',
    copyFail: '복사 실패',
    keyboardRecord: '🔴 키 녹화',
    recordTitle: '키 입력 캡처하여 단계 자동 추가',
    handleAria: (n: number) => `단계 ${n} 드래그 핸들`,
    handleTitle: '드래그하여 순서 변경',
    upAria: '위로',
    downAria: '아래로',
    duplicateAria: '단계 복제',
    duplicateTitle: '같은 단계를 바로 아래에 복사',
    deleteAria: '단계 삭제',
    tier2LaunchNote: 'Tier 2 — 첫 실행 시 PC 헬퍼가 사용자 동의를 요청합니다',
    tier2FocusNote: 'Tier 2 — 사용자 동의 필요',
    delayMaxLabel: '최대 5000ms',
    errorMaxStep: (max: number) => `step은 최대 ${max}개까지 추가할 수 있습니다`,
    errorTruncate: (added: number) => `최대치 제한으로 ${added}개만 추가되었습니다`,
    errorKeyMin: '최소 1개 키 필요',
    errorKeyMax: '키는 최대 6개',
    errorDelayMax: '딜레이 최대 5000ms',
    errorDelayMin: '딜레이는 0 이상',
    errorPathBlocked: (kw: string) => `보안 정책상 차단된 경로 (${kw}). Tier 3 토글 필요`,
    errorCoordsRange: '좌표 범위를 벗어났습니다',
    errorWinTitleLen: '창 제목 패턴이 너무 깁니다',
    coordXY: { x: 'x', y: 'y', ms: 'ms' },
    btnLeft: '좌',
    btnRight: '우',
    btnMiddle: '중',
    pathPlaceholder: 'C:\\path\\to\\app.exe',
    argsPlaceholder: '인자 (공백 구분)',
    winPatternPlaceholder: '창 제목 패턴 (예: Chrome)',
    keyPlaceholder: 'ctrl+c',
  },
  en: {
    stagesLabel: 'Macro steps',
    maxReached: 'Limit reached',
    dragHint: 'Drag the handle to reorder',
    emptyHint: 'No steps yet. Add one below.',
    previewLabel: 'Sequence preview',
    stepsUnit: 'steps',
    copyBtn: 'Copy',
    copyAria: 'Copy sequence text',
    copyTitle: 'Copy the sequence text to clipboard',
    copySuccess: 'Sequence copied to clipboard',
    copyFail: 'Copy failed',
    keyboardRecord: '🔴 Record keys',
    recordTitle: 'Capture key presses to add steps',
    handleAria: (n: number) => `Drag handle for step ${n}`,
    handleTitle: 'Drag to reorder',
    upAria: 'Move up',
    downAria: 'Move down',
    duplicateAria: 'Duplicate step',
    duplicateTitle: 'Duplicate this step below',
    deleteAria: 'Delete step',
    tier2LaunchNote: 'Tier 2 — PC helper will ask for consent on first run',
    tier2FocusNote: 'Tier 2 — user consent required',
    delayMaxLabel: 'max 5000ms',
    errorMaxStep: (max: number) => `Up to ${max} steps allowed`,
    errorTruncate: (added: number) =>
      `Truncated by the limit — only ${added} added`,
    errorKeyMin: 'At least 1 key required',
    errorKeyMax: 'Up to 6 keys',
    errorDelayMax: 'Delay must be ≤ 5000ms',
    errorDelayMin: 'Delay must be ≥ 0',
    errorPathBlocked: (kw: string) =>
      `Path blocked by policy (${kw}). Toggle Tier 3 to allow.`,
    errorCoordsRange: 'Coordinates out of range',
    errorWinTitleLen: 'Window title pattern is too long',
    coordXY: { x: 'x', y: 'y', ms: 'ms' },
    btnLeft: 'L',
    btnRight: 'R',
    btnMiddle: 'M',
    pathPlaceholder: 'C:\\path\\to\\app.exe',
    argsPlaceholder: 'Args (space separated)',
    winPatternPlaceholder: 'Window title pattern (e.g. Chrome)',
    keyPlaceholder: 'ctrl+c',
  },
  ja: {
    stagesLabel: 'マクロ ステップ',
    maxReached: '上限到達',
    dragHint: 'ハンドルをドラッグして並び替え',
    emptyHint: 'ステップがありません。下から追加してください。',
    previewLabel: 'シーケンス プレビュー',
    stepsUnit: 'ステップ',
    copyBtn: 'コピー',
    copyAria: 'シーケンス テキストをコピー',
    copyTitle: 'シーケンスをクリップボードにコピー',
    copySuccess: 'シーケンスをクリップボードにコピーしました',
    copyFail: 'コピー失敗',
    keyboardRecord: '🔴 キー録画',
    recordTitle: 'キー入力をキャプチャしてステップを自動追加',
    handleAria: (n: number) => `ステップ ${n} のドラッグ ハンドル`,
    handleTitle: 'ドラッグで並び替え',
    upAria: '上へ',
    downAria: '下へ',
    duplicateAria: 'ステップ複製',
    duplicateTitle: '同じステップをすぐ下に複製',
    deleteAria: 'ステップ削除',
    tier2LaunchNote: 'Tier 2 — 初回実行時に PC ヘルパーが同意を求めます',
    tier2FocusNote: 'Tier 2 — ユーザー同意が必要',
    delayMaxLabel: '最大 5000ms',
    errorMaxStep: (max: number) => `ステップは最大 ${max} 個まで追加できます`,
    errorTruncate: (added: number) => `上限制限により ${added} 個のみ追加されました`,
    errorKeyMin: '最低 1 つのキーが必要',
    errorKeyMax: 'キーは最大 6 つ',
    errorDelayMax: 'ディレイは 5000ms 以下',
    errorDelayMin: 'ディレイは 0 以上',
    errorPathBlocked: (kw: string) =>
      `セキュリティ ポリシーでブロックされたパス (${kw})。Tier 3 切替が必要`,
    errorCoordsRange: '座標が範囲外',
    errorWinTitleLen: 'ウィンドウ タイトル パターンが長すぎます',
    coordXY: { x: 'x', y: 'y', ms: 'ms' },
    btnLeft: '左',
    btnRight: '右',
    btnMiddle: '中',
    pathPlaceholder: 'C:\\path\\to\\app.exe',
    argsPlaceholder: '引数 (空白区切り)',
    winPatternPlaceholder: 'ウィンドウ タイトル パターン (例: Chrome)',
    keyPlaceholder: 'ctrl+c',
  },
};

interface MacroEditorProps {
  steps: MacroStepDto[];
  onChange: (steps: MacroStepDto[]) => void;
}

const MAX_STEPS = 20; // DB CHECK와 일치 (mylist_items 트리거)

type StepKind = MacroStepDto['kind'];

/**
 * 매크로 step 시퀀스 편집기.
 *
 * 정착본 §4, §6, actions/guard.rs
 * - 최대 20 step (DB CHECK)
 * - Tier 2 step(launch_app/focus_window)은 권한 안내
 * - Tier 3 키워드(cmd/powershell/regsvr32 등) 입력 시 즉시 차단 메시지
 */
export function MacroEditor({ steps, onChange }: MacroEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [recorderOpen, setRecorderOpen] = useState(false);
  const { showToast } = useToast();
  const { locale } = useTranslation();
  const mc = MACRO_COPY[locale] ?? MACRO_COPY.ko;

  function reportError(message: string): void {
    setError(message);
    showToast({ level: 'warning', message, duration: 4_000 });
  }

  // 안정 키 — drag reorder 후에도 같은 step에는 같은 id 유지
  // steps.length 변경 시에만 새 id 발급 (추가) 또는 잘라냄 (삭제 — 끝에서)
  const idCounterRef = useRef(0);
  const idsRef = useRef<string[]>([]);
  const stepIds = useMemo(() => {
    if (idsRef.current.length < steps.length) {
      while (idsRef.current.length < steps.length) {
        idsRef.current = [...idsRef.current, `step-${idCounterRef.current++}`];
      }
    } else if (idsRef.current.length > steps.length) {
      idsRef.current = idsRef.current.slice(0, steps.length);
    }
    return idsRef.current;
  }, [steps.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function update(idx: number, next: MacroStepDto): void {
    const v = validate(next, mc);
    if (v) {
      reportError(v);
      return;
    }
    setError(null);
    onChange(steps.map((s, i) => (i === idx ? next : s)));
  }

  function remove(idx: number): void {
    setError(null);
    onChange(steps.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1): void {
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function add(kind: StepKind): void {
    if (steps.length >= MAX_STEPS) {
      reportError(mc.errorMaxStep(MAX_STEPS));
      return;
    }
    setError(null);
    onChange([...steps, defaultStep(kind)]);
  }

  function appendRecorded(newSteps: MacroStepDto[]): void {
    const remaining = MAX_STEPS - steps.length;
    if (remaining <= 0) {
      reportError(mc.errorMaxStep(MAX_STEPS));
      return;
    }
    const truncated = newSteps.slice(0, remaining);
    if (truncated.length < newSteps.length) {
      reportError(mc.errorTruncate(truncated.length));
    } else {
      setError(null);
    }
    onChange([...steps, ...truncated]);
  }

  function duplicate(idx: number): void {
    if (steps.length >= MAX_STEPS) {
      reportError(mc.errorMaxStep(MAX_STEPS));
      return;
    }
    setError(null);
    const next = [...steps];
    next.splice(idx + 1, 0, structuredClone(steps[idx]));
    onChange(next);
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stepIds.indexOf(String(active.id));
    const newIndex = stepIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    // ids도 함께 reorder — 다음 렌더에서 step ↔ id 매핑 안정 유지
    idsRef.current = arrayMove(idsRef.current, oldIndex, newIndex);
    onChange(arrayMove(steps, oldIndex, newIndex));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <span>{mc.stagesLabel}</span>
          <span
            className={
              steps.length >= MAX_STEPS
                ? 'font-mono text-red-600'
                : steps.length >= MAX_STEPS * 0.8
                  ? 'font-mono text-yellow-600'
                  : 'font-mono text-ink-muted'
            }
            aria-live="polite"
          >
            ({steps.length}/{MAX_STEPS})
          </span>
          {steps.length >= MAX_STEPS && (
            <span className="text-[10px] text-red-600 font-medium">{mc.maxReached}</span>
          )}
        </span>
        {steps.length > 1 && (
          <span className="text-[10px] text-ink-muted">{mc.dragHint}</span>
        )}
      </div>

      {steps.length === 0 && (
        <p className="text-xs text-ink-muted py-3 text-center border border-dashed rounded-lg">
          {mc.emptyHint}
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-2">
            {steps.map((step, idx) => (
              <SortableStepRow
                key={stepIds[idx]}
                id={stepIds[idx]}
                step={step}
                index={idx}
                total={steps.length}
                locale={locale}
                canAdd={steps.length < MAX_STEPS}
                onMove={(dir) => move(idx, dir)}
                onRemove={() => remove(idx)}
                onDuplicate={() => duplicate(idx)}
                onUpdate={(next) => update(idx, next)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 pt-2">
        {(['key', 'click', 'delay', 'launch_app', 'focus_window'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => add(k)}
            disabled={steps.length >= MAX_STEPS}
            className="text-xs px-2 py-1 rounded-md border hover:bg-surface-2 disabled:opacity-40"
          >
            + {stepLabel(k, locale)}
          </button>
        ))}
        <span className="mx-1 text-ink-muted">|</span>
        <button
          type="button"
          onClick={() => setRecorderOpen(true)}
          disabled={steps.length >= MAX_STEPS}
          className="text-xs px-2 py-1 rounded-md border border-rbs-accent text-rbs-accent hover:bg-rbs-accent-soft disabled:opacity-40"
          title={mc.recordTitle}
        >
          {mc.keyboardRecord}
        </button>
      </div>

      {steps.length > 0 && (
        <details className="mt-2 px-2 py-1.5 rounded-md bg-surface-2 border border-border group">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-2">
            <span className="text-[10px] text-ink-muted">
              {mc.previewLabel}
              <span className="ml-2 font-mono text-ink">
                {steps.length}/{MAX_STEPS} {mc.stepsUnit}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(steps.map(summarizeStep).join(' → '));
                    showToast({ level: 'success', message: mc.copySuccess, duration: 2_500 });
                  } catch (err) {
                    showToast({ level: 'error', message: `${mc.copyFail}: ${(err as Error).message}` });
                  }
                }}
                className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:border-rbs-accent hover:text-rbs-accent"
                aria-label={mc.copyAria}
                title={mc.copyTitle}
              >
                📋 {mc.copyBtn}
              </button>
              <span className="text-[10px] text-ink-muted group-open:rotate-90 transition-transform">▶</span>
            </span>
          </summary>
          <p className="text-[11px] font-mono text-ink truncate mt-1" title={steps.map(summarizeStep).join(' → ')}>
            {steps.map(summarizeStep).join(' → ')}
          </p>
          <ol className="mt-2 flex flex-col gap-1 text-[11px]">
            {steps.map((s, i) => (
              <li key={`prev-${i}`} className="flex items-start gap-2">
                <span className="font-mono text-ink-muted">#{i + 1}</span>
                <span className="font-mono text-ink">{summarizeStep(s)}</span>
                {s.description && (
                  <span className="text-ink-muted truncate flex-1">— {s.description}</span>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}

      <MacroKeyRecorder
        open={recorderOpen}
        onClose={() => setRecorderOpen(false)}
        onCapture={appendRecorded}
      />
    </div>
  );
}

function summarizeStep(step: MacroStepDto): string {
  switch (step.kind) {
    case 'key':
      return step.keys.length > 0 ? `⌨${step.keys.join('+')}` : '⌨(빈)';
    case 'click':
      return `🖱${step.button[0]}@${step.x},${step.y}`;
    case 'delay':
      return `⏱${step.ms}ms`;
    case 'launch_app': {
      const name = step.path.split(/[\\/]/).pop() || step.path || '(빈)';
      return `▶${name}`;
    }
    case 'focus_window':
      return `🪟${step.title_pattern || '(빈)'}`;
  }
}

interface SortableStepRowProps {
  id: string;
  step: MacroStepDto;
  index: number;
  total: number;
  locale: 'ko' | 'en' | 'ja';
  canAdd: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onUpdate: (next: MacroStepDto) => void;
}

function SortableStepRow({
  id,
  step,
  index,
  total,
  locale,
  canAdd,
  onMove,
  onRemove,
  onDuplicate,
  onUpdate,
}: SortableStepRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="border rounded-lg p-3 bg-surface">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-ink-muted hover:text-ink select-none px-1"
            aria-label={`단계 ${index + 1} 드래그 핸들`}
            title="드래그하여 순서 변경"
          >
            ⋮⋮
          </button>
          <span className="text-xs font-mono text-ink-muted">
            #{index + 1} · {stepLabel(step.kind, locale)}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="text-xs px-1.5 py-0.5 rounded border disabled:opacity-30"
            aria-label="위로"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="text-xs px-1.5 py-0.5 rounded border disabled:opacity-30"
            aria-label="아래로"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            disabled={!canAdd}
            className="text-xs px-1.5 py-0.5 rounded border disabled:opacity-30"
            aria-label="단계 복제"
            title="같은 단계를 바로 아래에 복사"
          >
            ⎘
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs px-1.5 py-0.5 rounded border text-red-600"
            aria-label="단계 삭제"
          >
            ✕
          </button>
        </div>
      </div>
      <StepForm step={step} onChange={onUpdate} />
    </li>
  );
}

interface StepFormProps {
  step: MacroStepDto;
  onChange: (next: MacroStepDto) => void;
}

function StepForm({ step, onChange }: StepFormProps) {
  const { locale } = useTranslation();
  const placeholder =
    locale === 'en'
      ? 'Memo (optional, does not affect execution)'
      : locale === 'ja'
        ? 'メモ (任意、実行には影響しません)'
        : '메모 (선택, 매크로 실행에는 영향 없음)';
  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="text"
        value={step.description ?? ''}
        onChange={(e) => onChange({ ...step, description: e.target.value })}
        placeholder={placeholder}
        maxLength={64}
        className="w-full border border-border rounded-md px-2 py-1 text-[10px] text-ink-muted bg-surface-2"
      />
      <StepBody step={step} onChange={onChange} />
    </div>
  );
}

function StepBody({ step, onChange }: StepFormProps) {
  switch (step.kind) {
    case 'key':
      return (
        <input
          type="text"
          value={step.keys.join('+')}
          onChange={(e) =>
            onChange({
              kind: 'key',
              keys: e.target.value
                .split(/[+\s,]/)
                .map((k) => k.trim().toLowerCase())
                .filter(Boolean),
            })
          }
          className="w-full border rounded-md px-2 py-1.5 text-xs font-mono"
          placeholder="ctrl+c"
        />
      );

    case 'click':
      return (
        <div className="flex gap-2">
          <NumberInput label="x" value={step.x} onChange={(x) => onChange({ ...step, x })} />
          <NumberInput label="y" value={step.y} onChange={(y) => onChange({ ...step, y })} />
          <select
            value={step.button}
            onChange={(e) =>
              onChange({ ...step, button: e.target.value as MacroStepDto & { kind: 'click' } extends infer T ? T extends { button: infer B } ? B : never : never })
            }
            className="border rounded-md px-2 py-1 text-xs"
          >
            <option value="left">좌</option>
            <option value="right">우</option>
            <option value="middle">중</option>
          </select>
        </div>
      );

    case 'delay':
      return (
        <div className="flex items-center gap-2">
          <NumberInput
            label="ms"
            value={step.ms}
            min={0}
            max={5000}
            onChange={(ms) => onChange({ kind: 'delay', ms })}
          />
          <span className="text-xs text-ink-muted">최대 5000ms</span>
        </div>
      );

    case 'launch_app':
      return (
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={step.path}
            onChange={(e) => onChange({ ...step, path: e.target.value })}
            className="border rounded-md px-2 py-1 text-xs font-mono"
            placeholder="C:\\path\\to\\app.exe"
          />
          <input
            type="text"
            value={step.args.join(' ')}
            onChange={(e) =>
              onChange({ ...step, args: e.target.value.split(/\s+/).filter(Boolean) })
            }
            className="border rounded-md px-2 py-1 text-xs font-mono"
            placeholder="인자 (공백 구분)"
          />
          <p className="text-[10px] text-yellow-700">
            Tier 2 — 첫 실행 시 PC 헬퍼가 사용자 동의를 요청합니다
          </p>
        </div>
      );

    case 'focus_window':
      return (
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={step.title_pattern}
            onChange={(e) => onChange({ ...step, title_pattern: e.target.value })}
            className="border rounded-md px-2 py-1 text-xs"
            placeholder="창 제목 패턴 (예: Chrome)"
          />
          <p className="text-[10px] text-yellow-700">Tier 2 — 사용자 동의 필요</p>
        </div>
      );
  }
}

interface NumberInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

function NumberInput({ label, value, min, max, onChange }: NumberInputProps) {
  return (
    <label className="flex items-center gap-1 text-xs">
      <span className="text-ink-muted">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-16 border rounded-md px-1.5 py-0.5 text-xs"
      />
    </label>
  );
}

function defaultStep(kind: StepKind): MacroStepDto {
  switch (kind) {
    case 'key':
      return { kind: 'key', keys: ['ctrl', 'c'] };
    case 'click':
      return { kind: 'click', x: 0, y: 0, button: 'left' };
    case 'delay':
      return { kind: 'delay', ms: 100 };
    case 'launch_app':
      return { kind: 'launch_app', path: '', args: [] };
    case 'focus_window':
      return { kind: 'focus_window', title_pattern: '' };
  }
}

function stepLabel(k: StepKind, locale: 'ko' | 'en' | 'ja' = 'ko'): string {
  const table: Record<'ko' | 'en' | 'ja', Record<StepKind, string>> = {
    ko: { key: '키', click: '클릭', delay: '딜레이', launch_app: '앱 실행', focus_window: '창 포커스' },
    en: { key: 'Key', click: 'Click', delay: 'Delay', launch_app: 'Launch app', focus_window: 'Focus window' },
    ja: { key: 'キー', click: 'クリック', delay: 'ディレイ', launch_app: 'アプリ起動', focus_window: 'ウィンドウフォーカス' },
  };
  return table[locale][k];
}

const DANGEROUS_PATH_KEYWORDS = [
  'cmd.exe',
  'powershell',
  'wscript',
  'cscript',
  'regsvr32',
  'mshta',
  '/bin/sh',
  '/bin/bash',
];

type MacroCopy = typeof MACRO_COPY.ko;

function validate(step: MacroStepDto, mc: MacroCopy): string | null {
  switch (step.kind) {
    case 'key':
      if (step.keys.length === 0) return mc.errorKeyMin;
      if (step.keys.length > 6) return mc.errorKeyMax;
      return null;
    case 'delay':
      if (step.ms > 5000) return mc.errorDelayMax;
      if (step.ms < 0) return mc.errorDelayMin;
      return null;
    case 'launch_app': {
      const lower = step.path.toLowerCase();
      for (const kw of DANGEROUS_PATH_KEYWORDS) {
        if (lower.includes(kw)) return mc.errorPathBlocked(kw);
      }
      return null;
    }
    case 'click':
      if (step.x < -1000 || step.x > 16_000 || step.y < -1000 || step.y > 16_000) {
        return mc.errorCoordsRange;
      }
      return null;
    case 'focus_window':
      if (step.title_pattern.length > 256) return mc.errorWinTitleLen;
      return null;
  }
}
