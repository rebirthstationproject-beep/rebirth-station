/**
 * 동적 큐브 시스템 (Phase 5 P2, 2026-05-31).
 *
 * 시계 / 타이머 / 게이지 / 배터리 등 라이브 업데이트 큐브.
 *
 * 동작:
 *   1. action_type 이 'live_*' 인 큐브는 tick 으로 라벨/이미지 갱신
 *   2. DynamicCubeRegistry 가 큐브 ID 별 tick 함수 보관
 *   3. tickAll() 을 매 1초 호출 (setInterval) 또는 RAF 로 호출
 *   4. tick 함수는 cube.label / cube.icon_url 을 새 값으로 반환
 *
 * 사용 예시:
 *   const reg = createDynamicCubeRegistry();
 *   reg.register('cube-id-1', liveClock({ format: 'HH:MM:SS' }));
 *   const updates = reg.tickAll(Date.now());
 *   // updates = [{ id: 'cube-id-1', label: '14:23:45', icon_url: null }, ...]
 */

import type { Cube } from '../types/cube';

export interface DynamicCubeTick {
  /** 매 tick 호출 — 새 라벨/이미지 반환. */
  (nowMs: number, payload: Record<string, unknown>): {
    label?: string;
    icon_url?: string | null;
  };
}

export interface DynamicCubeUpdate {
  readonly id: string;
  readonly label?: string;
  readonly icon_url?: string | null;
}

export interface DynamicCubeRegistry {
  register(cubeId: string, tick: DynamicCubeTick, payload: Record<string, unknown>): void;
  unregister(cubeId: string): void;
  tickAll(nowMs: number): DynamicCubeUpdate[];
  has(cubeId: string): boolean;
  size(): number;
}

export function createDynamicCubeRegistry(): DynamicCubeRegistry {
  const entries = new Map<string, { tick: DynamicCubeTick; payload: Record<string, unknown> }>();

  return {
    register(cubeId, tick, payload) {
      entries.set(cubeId, { tick, payload });
    },
    unregister(cubeId) {
      entries.delete(cubeId);
    },
    tickAll(nowMs) {
      const updates: DynamicCubeUpdate[] = [];
      for (const [id, { tick, payload }] of entries) {
        try {
          const result = tick(nowMs, payload);
          updates.push({ id, label: result.label, icon_url: result.icon_url });
        } catch {
          // tick 실패 → skip (이번 사이클만)
        }
      }
      return updates;
    },
    has(id) {
      return entries.has(id);
    },
    size() {
      return entries.size;
    },
  };
}

// === 동적 큐브 tick 구현 ===

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * live_clock — 시계 큐브.
 * payload: { format: 'HH:MM:SS' | 'HH:MM' | 'h:MM AM/PM', timezone?: string }
 */
export const liveClockTick: DynamicCubeTick = (nowMs, payload) => {
  const d = new Date(nowMs);
  const format = (payload.format as string) || 'HH:MM:SS';
  let h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  let label: string;
  switch (format) {
    case 'HH:MM':
      label = `${pad2(h)}:${pad2(m)}`;
      break;
    case 'h:MM AM/PM': {
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      label = `${h}:${pad2(m)} ${ampm}`;
      break;
    }
    case 'HH:MM:SS':
    default:
      label = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
      break;
  }
  return { label };
};

/**
 * live_timer — 카운트다운 타이머 큐브.
 * payload: { target_ms: number, label_format?: 'MM:SS' | 'HH:MM:SS' }
 * 남은 시간 = max(0, target_ms - nowMs)
 */
export const liveTimerTick: DynamicCubeTick = (nowMs, payload) => {
  const target = Number(payload.target_ms) || 0;
  const remaining = Math.max(0, target - nowMs);
  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const format = (payload.label_format as string) || 'MM:SS';
  const label =
    format === 'HH:MM:SS' || h > 0
      ? `${pad2(h)}:${pad2(m)}:${pad2(s)}`
      : `${pad2(m)}:${pad2(s)}`;
  return { label };
};

/**
 * live_gauge — 게이지 큐브 (라벨만 갱신).
 * payload: { value: number, min: number, max: number, unit?: string, label_prefix?: string }
 * R1-4: icon_url SVG 생성 경로 제거 (LiveCubeVisual 이 직접 렌더).
 */
export const liveGaugeTick: DynamicCubeTick = (_nowMs, payload) => {
  const value = Number(payload.value) || 0;
  const min = Number(payload.min) || 0;
  const max = Number(payload.max) || 100;
  const unit = (payload.unit as string) || '%';
  const prefix = (payload.label_prefix as string) || '';
  void min; void max;
  return {
    label: prefix ? `${prefix} ${Math.round(value)}${unit}` : `${Math.round(value)}${unit}`,
  };
};

/**
 * live_battery — 배터리 잔량 큐브 (라벨만 갱신).
 * payload: { source: 'system' | 'manual', manual_level?: number }
 * R1-4: icon_url SVG 생성 경로 제거 (LiveCubeVisual 이 직접 렌더).
 */
export const liveBatteryTick: DynamicCubeTick = (_nowMs, payload) => {
  const source = (payload.source as string) || 'manual';
  let level = 0;
  if (source === 'manual') {
    level = Number(payload.manual_level) || 0;
  } else if (source === 'system') {
    level = Number(payload._cached_level) || 0;
  }
  const percent = Math.round(Math.max(0, Math.min(1, level)) * 100);
  return { label: `${percent}%` };
};

// === 큐브 → tick 매핑 ===

/**
 * Cube 의 action_type 에 맞는 tick 함수 + 초기 payload 를 반환.
 * Cube 가 동적이 아니면 null 반환.
 */
export function getDynamicTick(cube: Cube): {
  tick: DynamicCubeTick;
  payload: Record<string, unknown>;
} | null {
  switch (cube.action_type) {
    case 'live_clock':
      return { tick: liveClockTick, payload: cube.action_payload };
    case 'live_timer':
      return { tick: liveTimerTick, payload: cube.action_payload };
    case 'live_gauge':
      return { tick: liveGaugeTick, payload: cube.action_payload };
    case 'live_battery':
      return { tick: liveBatteryTick, payload: cube.action_payload };
    default:
      return null;
  }
}

/**
 * tick interval 의 권장 ms.
 * - live_clock (HH:MM:SS): 1000ms
 * - live_clock (HH:MM): 30000ms
 * - live_timer (MM:SS): 1000ms
 * - live_gauge / live_battery: 5000ms
 */
export function recommendedTickInterval(cube: Cube): number {
  if (cube.action_type === 'live_clock') {
    const fmt = (cube.action_payload.format as string) || 'HH:MM:SS';
    return fmt.includes(':SS') ? 1000 : 30000;
  }
  if (cube.action_type === 'live_timer') return 1000;
  if (cube.action_type === 'live_gauge' || cube.action_type === 'live_battery') return 5000;
  return 1000;
}
