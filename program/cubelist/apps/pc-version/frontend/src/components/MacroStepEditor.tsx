/**
 * MacroStepEditor (M7 cron #21) — macro.steps 비주얼 편집기.
 *
 * Inspector 에서 action_type === 'macro' 시 ActionPayloadForm 이 본 컴포넌트로 위임.
 * payload.steps 배열을 step 카드 리스트로 표시 + 추가/삭제/순서 변경 + 각 step 종류별 폼.
 *
 * Rust `MacroStepDto` (`protocol/messages.rs`) 와 wire 1:1 (kind tag).
 */

import {
  defaultMacroStep,
  MACRO_STEP_KINDS,
  type MacroStep,
  type MouseButton,
} from '../types/cube';

interface MacroStepEditorProps {
  steps: MacroStep[];
  onChange: (next: MacroStep[]) => void;
}

const KIND_LABEL: Record<MacroStep['kind'], string> = {
  key: '키 입력',
  click: '마우스 클릭',
  delay: '지연',
  launch_app: '앱 실행',
  focus_window: '창 포커스',
};

export function MacroStepEditor({ steps, onChange }: MacroStepEditorProps) {
  function addStep(kind: MacroStep['kind']): void {
    onChange([...steps, defaultMacroStep(kind)]);
  }

  function removeStep(idx: number): void {
    onChange(steps.filter((_, i) => i !== idx));
  }

  function moveStep(idx: number, dir: -1 | 1): void {
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function patchStep(idx: number, next: MacroStep): void {
    onChange(steps.map((s, i) => (i === idx ? next : s)));
  }

  return (
    <div className="macro-editor">
      <div className="macro-header">
        <span className="field-label">매크로 steps ({steps.length})</span>
        <div className="macro-add-row">
          {MACRO_STEP_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => addStep(kind)}
              title={`${KIND_LABEL[kind]} 추가`}
            >
              + {KIND_LABEL[kind]}
            </button>
          ))}
        </div>
      </div>

      {steps.length === 0 ? (
        <div className="macro-empty">step 없음 — 위 버튼으로 추가</div>
      ) : (
        <ol className="macro-step-list">
          {steps.map((step, idx) => (
            <li key={idx} className="macro-step">
              <div className="macro-step-meta">
                <span className="macro-step-idx">{idx + 1}</span>
                <span className="macro-step-kind">{KIND_LABEL[step.kind]}</span>
                <div className="macro-step-controls">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => moveStep(idx, -1)}
                    disabled={idx === 0}
                    title="위로"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => moveStep(idx, 1)}
                    disabled={idx === steps.length - 1}
                    title="아래로"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className="icon-btn btn-danger"
                    onClick={() => removeStep(idx)}
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <StepFields step={step} onPatch={(next) => patchStep(idx, next)} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

interface StepFieldsProps {
  step: MacroStep;
  onPatch: (next: MacroStep) => void;
}

function StepFields({ step, onPatch }: StepFieldsProps) {
  switch (step.kind) {
    case 'key':
      return (
        <input
          type="text"
          value={step.keys.join(', ')}
          placeholder="Ctrl, C / Alt, Tab / MediaPlayPause"
          onChange={(e) =>
            onPatch({
              kind: 'key',
              keys: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0),
            })
          }
        />
      );
    case 'delay':
      return (
        <input
          type="number"
          min={0}
          max={5000}
          value={step.ms}
          onChange={(e) =>
            onPatch({ kind: 'delay', ms: Math.max(0, Number(e.target.value)) })
          }
        />
      );
    case 'launch_app':
      return (
        <>
          <input
            type="text"
            value={step.path}
            placeholder="C:\Program Files\App\app.exe"
            onChange={(e) => onPatch({ ...step, path: e.target.value })}
          />
          <input
            type="text"
            value={step.args.join(', ')}
            placeholder="인자 (쉼표 구분)"
            onChange={(e) =>
              onPatch({
                ...step,
                args: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0),
              })
            }
          />
        </>
      );
    case 'focus_window':
      return (
        <input
          type="text"
          value={step.title_pattern}
          placeholder="* - Visual Studio Code"
          onChange={(e) => onPatch({ ...step, title_pattern: e.target.value })}
        />
      );
    case 'click':
      return (
        <div className="macro-step-grid">
          <input
            type="number"
            value={step.x}
            placeholder="X"
            onChange={(e) => onPatch({ ...step, x: Number(e.target.value) })}
          />
          <input
            type="number"
            value={step.y}
            placeholder="Y"
            onChange={(e) => onPatch({ ...step, y: Number(e.target.value) })}
          />
          <select
            value={step.button}
            onChange={(e) =>
              onPatch({ ...step, button: e.target.value as MouseButton })
            }
          >
            <option value="left">왼쪽</option>
            <option value="right">오른쪽</option>
            <option value="middle">가운데</option>
          </select>
        </div>
      );
  }
}
