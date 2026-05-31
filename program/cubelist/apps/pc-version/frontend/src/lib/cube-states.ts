/**
 * Cube.states[] 멀티 상태 시스템 (v0.1.2 신규).
 *
 * P0 영구 lock 필드 Cube.states 의 실 활용:
 *   - hotkey_toggle: states[0] = on (켜기 키) / states[1] = off (끄기 키)
 *   - 일반 토글 (audio_play 재생/정지 등) — 확장 가능
 *
 * 동작:
 *   1. 큐브 실행 시 current_state_index 의 state 선택
 *   2. state.action_payload override 가 있으면 사용
 *   3. 실행 후 (states.length 안) 다음 index 로 자동 전환
 *   4. 라벨/이미지도 active state 가 override
 *
 * localStorage 영속:
 *   cubelist:cube_states = { [cubeId]: state_index }
 */

import type { Cube, CubeState } from '../types/cube';

const STORAGE_KEY = 'cubelist:cube_states';

function loadStateMap(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveStateMap(map: Record<string, number>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* localStorage unavailable */
  }
}

/** 현재 활성 state index 반환 (없으면 0). */
export function getCurrentStateIndex(cubeId: string): number {
  const map = loadStateMap();
  return map[cubeId] ?? 0;
}

/** 다음 state index 로 전환 후 새 index 반환. UI 자동 갱신을 위해 이벤트 발생. */
export function advanceStateIndex(cube: Cube): number {
  if (!cube.states || cube.states.length <= 1) return 0;
  const map = loadStateMap();
  const current = map[cube.id] ?? 0;
  const next = (current + 1) % cube.states.length;
  map[cube.id] = next;
  saveStateMap(map);
  // UI 가 watch 하는 이벤트 발생 (큐브 셀 라벨/이미지 즉시 갱신)
  setTimeout(() => notifyStateChange(cube.id), 0);
  return next;
}

/** 특정 state index 로 설정 (인스펙터에서 수동 설정 시). */
export function setStateIndex(cubeId: string, index: number): void {
  const map = loadStateMap();
  map[cubeId] = index;
  saveStateMap(map);
}

/** 큐브 + 현재 state 적용한 표시용 cube 반환 (라벨/아이콘 override). */
export function applyCurrentState(cube: Cube): Cube {
  if (!cube.states || cube.states.length === 0) return cube;
  const index = getCurrentStateIndex(cube.id);
  const state = cube.states[index];
  if (!state) return cube;
  return {
    ...cube,
    label: state.label ?? cube.label,
    icon_url: state.image ?? cube.icon_url,
    action_payload:
      state.action_payload !== undefined ? state.action_payload : cube.action_payload,
  };
}

/** 큐브 실행 시 호출 — 현재 state 의 action_payload 를 반환 + index 자동 advance. */
export function resolveActionForExecution(cube: Cube): {
  payload: Record<string, unknown>;
  stateIndex: number;
} {
  if (!cube.states || cube.states.length === 0) {
    return { payload: cube.action_payload, stateIndex: 0 };
  }
  const currentIndex = getCurrentStateIndex(cube.id);
  const currentState = cube.states[currentIndex];
  const payload =
    currentState && currentState.action_payload !== undefined
      ? currentState.action_payload
      : cube.action_payload;
  // 실행 후 다음 state 로 advance (hotkey_toggle 등)
  if (cube.action_type === 'hotkey_toggle' || cube.action_type === 'audio_play') {
    advanceStateIndex(cube);
  }
  return { payload, stateIndex: currentIndex };
}

/**
 * 큐브 state 변경 이벤트 — executeCube 가 advanceStateIndex 시 발생.
 * UI 가 listen 해서 라벨/이미지 갱신.
 */
const STATE_CHANGE_EVENT = 'cubelist:state-changed';

export function notifyStateChange(cubeId: string): void {
  window.dispatchEvent(new CustomEvent(STATE_CHANGE_EVENT, { detail: { cubeId } }));
}

export function listenStateChange(handler: (cubeId: string) => void): () => void {
  const onEvent = (e: Event): void => {
    const detail = (e as CustomEvent<{ cubeId: string }>).detail;
    if (detail?.cubeId) handler(detail.cubeId);
  };
  window.addEventListener(STATE_CHANGE_EVENT, onEvent);
  return () => window.removeEventListener(STATE_CHANGE_EVENT, onEvent);
}

/** hotkey_toggle 큐브에 기본 states 자동 생성 (인스펙터 첫 진입 시). */
export function ensureHotkeyToggleStates(cube: Cube): readonly CubeState[] {
  if (cube.action_type !== 'hotkey_toggle') return cube.states ?? [];
  const payload = cube.action_payload as { on_keys?: string[]; off_keys?: string[] };
  const on_keys = payload.on_keys ?? [];
  const off_keys = payload.off_keys ?? [];
  return [
    { label: 'ON', action_payload: { keys: on_keys } },
    { label: 'OFF', action_payload: { keys: off_keys } },
  ];
}
