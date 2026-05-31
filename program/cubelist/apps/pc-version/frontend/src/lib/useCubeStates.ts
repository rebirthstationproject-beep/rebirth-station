/**
 * 큐브 state 변경 watch hook (v0.1.2).
 *
 * states 가 있는 큐브들의 라벨/이미지 갱신을 watch.
 * advanceStateIndex 호출 시 notifyStateChange 발생 → 본 hook 이 re-render 트리거.
 */

import { useEffect, useState, useMemo } from 'react';
import type { Cube } from '../types/cube';
import { applyCurrentState, listenStateChange } from './cube-states';

/** 큐브 배열 → cubeId → 적용된 cube map. state 변경 시 자동 갱신. */
export function useCubeStates(cubes: readonly Cube[]): Map<string, Cube> {
  const hasStatesCubes = useMemo(
    () => cubes.filter((c) => c.states && c.states.length > 1),
    [cubes],
  );

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (hasStatesCubes.length === 0) return;
    const watchedIds = new Set(hasStatesCubes.map((c) => c.id));
    const unsubscribe = listenStateChange((cubeId) => {
      if (watchedIds.has(cubeId)) setTick((t) => t + 1);
    });
    return unsubscribe;
  }, [hasStatesCubes.map((c) => c.id).join('|')]);

  return useMemo(() => {
    const map = new Map<string, Cube>();
    for (const cube of hasStatesCubes) {
      map.set(cube.id, applyCurrentState(cube));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStatesCubes, tick]);
}
