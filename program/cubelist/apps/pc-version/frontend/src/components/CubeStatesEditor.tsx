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
import { useTranslation } from '../lib/i18n/useTranslation';

interface CubeStatesEditorProps {
  readonly cube: Cube;
  readonly onStatesChange: (states: readonly CubeState[]) => void;
}

export function CubeStatesEditor({ cube, onStatesChange }: CubeStatesEditorProps) {
  const { t } = useTranslation();
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

  // Phase 3 (2026-06-01): 빠른 사이클 — wrap-around (←/→)
  function cyclePrev(): void {
    if (states.length === 0) return;
    const next = currentIndex <= 0 ? states.length - 1 : currentIndex - 1;
    activateState(next);
  }

  function cycleNext(): void {
    if (states.length === 0) return;
    const next = (currentIndex + 1) % states.length;
    activateState(next);
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
        <div className="muted small">{t('inspector.states_edit')}</div>
        <button type="button" className="btn-ghost states-add-btn" onClick={addState}>
          {t('inspector.state_add')}
        </button>
      </div>
    );
  }

  return (
    <div className="states-editor">
      <h4 className="inspector-subtitle">{t('inspector.states_edit')} ({states.length})</h4>
      <div className="muted small" style={{ marginBottom: 8 }}>
        {t('inspector.states_hint')}
      </div>
      {/* Phase 3 빠른 사이클 (state 2개 이상일 때만) */}
      {states.length >= 2 && (
        <div className="state-cycle-row" style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={cyclePrev}
            title="이전 state"
            aria-label="이전 state"
            style={{ minWidth: 36 }}
          >
            ←
          </button>
          <div className="muted small" style={{ flex: 1, textAlign: 'center' }}>
            {currentIndex + 1} / {states.length}
            {states[currentIndex]?.label && (
              <span style={{ marginLeft: 6 }}>· {states[currentIndex].label}</span>
            )}
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={cycleNext}
            title="다음 state"
            aria-label="다음 state"
            style={{ minWidth: 36 }}
          >
            →
          </button>
        </div>
      )}
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
                title={isActive ? t('inspector.current_state') : t('inspector.state_add')}
                aria-label={`state ${index + 1}`}
              >
                ●
              </button>
              <input
                type="text"
                value={state.label ?? ''}
                placeholder={`state ${index + 1}`}
                onChange={(e) => updateState(index, { label: e.target.value })}
                className="state-label-input"
              />
              <button
                type="button"
                className="state-remove-btn"
                onClick={() => removeState(index)}
                disabled={states.length <= 1}
                title={t('inspector.state_remove')}
                aria-label={t('inspector.state_remove')}
              >
                ×
              </button>
            </div>
            {cube.action_type === 'hotkey_toggle' && (
              <div className="state-row-keys">
                <span className="state-keys-label">{t('inspector.state_keys')}</span>
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
        {t('inspector.state_add')}
      </button>
    </div>
  );
}
