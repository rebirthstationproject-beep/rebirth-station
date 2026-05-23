'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * 디스플레이 설정 — 클라이언트 환경설정 (localStorage 기반).
 *
 * 정착본 (2026-05-22):
 * - 리스트 파일은 큐브 순서만 기록 (sort_order)
 * - 한 줄당 큐브 개수는 사용자 디스플레이 설정 (3~8 자유 입력)
 * - 디바이스 자동 감지 X — 사용자가 그때그때 변경
 */

const STORAGE_KEY = 'cubelist:display:cols';
const DEFAULT_COLS = 4;
const MIN_COLS = 3;
const MAX_COLS = 8;

interface DisplaySettings {
  cols: number;
  setCols: (next: number) => void;
  minCols: typeof MIN_COLS;
  maxCols: typeof MAX_COLS;
}

export function useDisplaySettings(): DisplaySettings {
  const [cols, setColsState] = useState<number>(DEFAULT_COLS);

  // 마운트 시 localStorage에서 복원 (SSR 안전 — useEffect 안에서만 접근)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed >= MIN_COLS && parsed <= MAX_COLS) {
      setColsState(parsed);
    }
  }, []);

  const setCols = useCallback((next: number): void => {
    const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.round(next)));
    setColsState(clamped);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(clamped));
    }
  }, []);

  return { cols, setCols, minCols: MIN_COLS, maxCols: MAX_COLS };
}
