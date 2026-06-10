/**
 * 동적 큐브 hook — 라이브 큐브 (live_clock/timer/gauge/battery) 1초 tick.
 *
 * 사용:
 *   const dynUpdates = useDynamicCubes(cubes);
 *   // dynUpdates: Map<cubeId, { label?, icon_url? }>
 *   // 큐브 렌더링 시: const update = dynUpdates.get(cube.id);
 *   //                  const displayLabel = update?.label ?? cube.label;
 *   //                  const displayIcon = update?.icon_url ?? cube.icon_url;
 */

import { useEffect, useState, useMemo } from 'react';
import type { Cube } from '../types/cube';
import { createDynamicCubeRegistry, getDynamicTick, type DynamicCubeUpdate } from './dynamic-cube';
import { liveSync } from './LiveSyncBridge';

const DEFAULT_INTERVAL_MS = 1000;

export interface DynamicUpdate {
  readonly label?: string;
  readonly icon_url?: string | null;
}

export interface DynamicCubesResult {
  readonly updates: Map<string, DynamicUpdate>;
  /** 중앙 tick ms — LiveCubeVisual 에 전달해 내부 setInterval 없이 렌더 */
  readonly nowMs: number;
}

export function useDynamicCubes(cubes: readonly Cube[]): DynamicCubesResult {
  // 동적 큐브만 추출
  const dynamicCubes = useMemo(
    () => cubes.filter((c) => getDynamicTick(c) !== null),
    [cubes],
  );

  const [updates, setUpdates] = useState<Map<string, DynamicUpdate>>(new Map());
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (dynamicCubes.length === 0) {
      if (updates.size > 0) setUpdates(new Map());
      return;
    }

    const registry = createDynamicCubeRegistry();
    for (const cube of dynamicCubes) {
      const t = getDynamicTick(cube);
      if (t) registry.register(cube.id, t.tick, t.payload);
    }

    function applyTick(): void {
      const ts = Date.now();
      setNowMs(ts);
      const u = registry.tickAll(ts);
      const map = new Map<string, DynamicUpdate>();
      for (const item of u) {
        map.set(item.id, { label: item.label, icon_url: item.icon_url });
        // v0.1.4 사전: 모바일 PWA 등 외부 구독자에 cube_update 송신 (delta)
        liveSync.emitCubeUpdate(item.id, { label: item.label, icon_url: item.icon_url });
      }
      setUpdates(map);
    }

    // 즉시 1회 tick → 초기 라벨/이미지
    applyTick();

    const interval = setInterval(applyTick, DEFAULT_INTERVAL_MS);

    // battery: 비동기 system 값 1회 fetch (변경 시 payload 갱신)
    const batterySources = dynamicCubes.filter(
      (c) =>
        c.action_type === 'live_battery' &&
        (c.action_payload.source as string) === 'system',
    );
    if (batterySources.length > 0) {
      const navAny = navigator as unknown as { getBattery?: () => Promise<{ level: number }> };
      if (typeof navAny.getBattery === 'function') {
        navAny.getBattery().then((bm) => {
          for (const cube of batterySources) {
            const t = getDynamicTick(cube);
            if (t) {
              t.payload._cached_level = bm.level;
              registry.register(cube.id, t.tick, t.payload);
            }
          }
          applyTick();
        }).catch(() => {
          // 브라우저 미지원 — manual 폴백
        });
      }
    }

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicCubes.length, dynamicCubes.map((c) => `${c.id}-${c.action_type}-${JSON.stringify(c.action_payload)}`).join('|')]);

  return { updates, nowMs };
}

export type { DynamicCubeUpdate };
