/**
 * 큐브 states[] 편집 UI (v0.1.2).
 *
 * hotkey_toggle / audio_play / 토글성 큐브에서 사용.
 * - 각 state: label, action_payload (액션별 schema)
 * - 추가/삭제/순서 변경
 * - 현재 활성 state 토글 버튼
 */

import { useState } from 'react';
import type { Cube, CubeState } from '../types/cube';
import {
  getCurrentStateIndex,
  setStateIndex,
  notifyStateChange,
} from '../lib/cube-states';

interface CubeStatesEditorProps {
  readonly cube: Cube;
  readonly onStatesChange: (states: readonly CubeState[]) => void;
}

export function CubeStatesEditor({ cube, onStatesChange }: CubeStatesEditorProps) {
  const states = cube.states ?? [];
  const [, setRefresh] = useState(0);
  const currentIndex = getCurrentStateIndex(cube.id);

  function updateState(index: number, patch: Partial<CubeState>): void {
    const next = states.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onStatesChange(next);
  }

  function addState(): void {
    const newState: CubeState = {
      label: `state ${states.length + 1}`,
      action_payload: cube.action_type === 'hotkey_toggle' ? { keys: [] } : {},
    };
    onStatesChange([...states, newState]);
  }

  function removeState(index: number): void {
    if (states.length <= 1) return;
    const next = states.filter((_, i) => i !== index);
    onStatesChange(next);
  }

  function activateState(index: number): void {
    setStateIndex(cube.id, index);
    notifyStateChange(cube.id);
    setRefresh((r) => r + 1);
  }

  function updateStateKeys(index: number, keys: string[]): void {
    const state = states[index];
    if (!state) return;
    const payload = (state.action_payload ?? {}) as Record<string, unknown>;
    updateState(index, { action_payload: { ...payload, keys } });
  }

  if (states.length === 0) {
    return (
      <div className="states-editor states-editor-empty">
        <div className="muted small">states 없음 (단일 상태)</div>
        <button type="button" className="btn-ghost states-add-btn" onClick={addState}>
          + 첫 상태 추가
        </button>
      </div>
    );
  }

  return (
    <div className="states-editor">
      <h4 className="inspector-subtitle">상태 편집 ({states.length})</h4>
      <div className="muted small" style={{ marginBottom: 8 }}>
        실행 시 현재 상태의 payload 사용 → 자동으로 다음 상태로 전환
      </div>
      {states.map((state, index) => {
        const isActive = index === currentIndex;
        const payload = (state.action_payload ?? {}) as Record<string, unknown>;
        const keysArr = Array.isArray(payload.keys) ? (payload.keys as string[]) : [];
        return (
          <div key={index} className={`state-row ${isActive ? 'is-active' : ''}`}>
            <div className="state-row-head">
              <button
                type="button"
                className={`state-toggle-dot ${isActive ? 'is-active' : ''}`}
                onClick={() => activateState(index)}
                title={isActive ? '현재 활성 상태' : '클릭해서 이 상태로 설정'}
                aria-label={`상태 ${index + 1} ${isActive ? '활성' : '활성화'}`}
              >
                ●
              </button>
              <input
                type="text"
                value={state.label ?? ''}
                placeholder={`state ${index + 1} 라벨`}
                onChange={(e) => updateState(index, { label: e.target.value })}
                className="state-label-input"
              />
              <button
                type="button"
                className="state-remove-btn"
                onClick={() => removeState(index)}
                disabled={states.length <= 1}
                title="상태 삭제"
                aria-label="상태 삭제"
              >
                ✕
              </button>
            </div>
            {cube.action_type === 'hotkey_toggle' && (
              <div className="state-row-keys">
                <span className="state-keys-label">키 조합:</span>
                <input
                  type="text"
                  value={keysArr.join('+')}
                  placeholder="Ctrl+Shift+A"
                  onChange={(e) =>
                    updateStateKeys(
                      index,
                      e.target.value
                        .split('+')
                        .map((k) => k.trim())
                        .filter(Boolean),
                    )
                  }
                  className="state-keys-input"
                />
              </div>
            )}
          </div>
        );
      })}
      <button type="button" className="btn-ghost states-add-btn" onClick={addState}>
        + 상태 추가
      </button>
    </div>
  );
}
