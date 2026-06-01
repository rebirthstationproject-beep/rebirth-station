/**
 * Icon Library Pool — sd_uuid → icon_url 영구 매핑 풀 (C 옵션, 2026-06-01).
 *
 * 사용 시나리오:
 * - 사용자가 CUBE 라이브러리 폴더 (231 .cubeone, icon 포함) 등록 시 풀 자동 구축
 * - .cubepack 가져오기 (Profile 변환 결과, icon=null) 시 풀에서 sd_uuid 매칭하여 icon_url 자동 보완
 *
 * localStorage 영구 저장.
 */

import type { Cube } from '../types/cube';

const STORAGE_KEY = 'cubelist:icon_library';
const MAX_ENTRIES = 1000; // 메모리/localStorage 한도

interface IconLibraryEntry {
  readonly sd_uuid: string;
  readonly icon_url: string;
  readonly icon_source: string; // state.svg / state@2x.png 등
  readonly icon_size_bytes: number;
  readonly added_at: string;
}

let memCache: Map<string, IconLibraryEntry> | null = null;

function loadFromStorage(): Map<string, IconLibraryEntry> {
  if (memCache) return memCache;
  memCache = new Map();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return memCache;
    const arr = JSON.parse(raw) as IconLibraryEntry[];
    if (!Array.isArray(arr)) return memCache;
    for (const e of arr) {
      if (e?.sd_uuid && e?.icon_url) memCache.set(e.sd_uuid, e);
    }
  } catch {
    /* 손상된 localStorage 무시 */
  }
  return memCache;
}

function persistToStorage(): void {
  if (!memCache) return;
  try {
    const arr = Array.from(memCache.values());
    // 오래된 entry 우선 잘라내기
    const sliced = arr.slice(-MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sliced));
  } catch {
    /* QuotaExceededError 등 무시 */
  }
}

/**
 * 큐브에서 icon_url 추출 → 풀에 추가.
 * sd_uuid 없거나 icon_url null/placeholder 면 skip.
 */
export function registerCubeIcon(cube: Cube): void {
  const meta = (cube.metadata ?? {}) as Record<string, unknown>;
  const sdUuid = meta.sd_uuid as string | undefined;
  if (!sdUuid) return;
  if (!cube.icon_url) return;
  if (meta.icon_is_placeholder === true) return;

  const pool = loadFromStorage();
  // 이미 있고 더 큰 사이즈면 유지, 새 entry 가 더 좋으면 갱신
  const existing = pool.get(sdUuid);
  const newSize = (meta.icon_size_bytes as number) ?? 0;
  if (existing && existing.icon_size_bytes >= newSize) return;

  pool.set(sdUuid, {
    sd_uuid: sdUuid,
    icon_url: cube.icon_url,
    icon_source: (meta.icon_source as string) ?? 'unknown',
    icon_size_bytes: newSize,
    added_at: new Date().toISOString(),
  });
}

/**
 * 큐브 배열 일괄 등록.
 */
export function registerCubes(cubes: ReadonlyArray<Cube>): void {
  for (const c of cubes) registerCubeIcon(c);
  persistToStorage();
}

/**
 * 큐브의 icon_url 이 비어있을 때 sd_uuid 기준으로 풀에서 가져오기.
 * 매칭 성공 시 새 cube 반환 (icon_url + metadata 보완).
 */
export function applyIconFallback(cube: Cube): Cube {
  if (cube.icon_url) return cube;
  const meta = (cube.metadata ?? {}) as Record<string, unknown>;
  const sdUuid = meta.sd_uuid as string | undefined;
  if (!sdUuid) return cube;
  const pool = loadFromStorage();
  const entry = pool.get(sdUuid);
  if (!entry) return cube;
  return {
    ...cube,
    icon_url: entry.icon_url,
    metadata: {
      ...meta,
      icon_source: entry.icon_source,
      icon_size_bytes: entry.icon_size_bytes,
      icon_is_tiny: entry.icon_size_bytes > 0 && entry.icon_size_bytes < 800,
      icon_is_placeholder: false,
      icon_from_pool: true,
    },
  };
}

/** 풀 통계 (UI 표시용) */
export function getPoolStats(): { total: number; sample: string[] } {
  const pool = loadFromStorage();
  return {
    total: pool.size,
    sample: Array.from(pool.keys()).slice(0, 5),
  };
}

/** 풀 초기화 (사용자 명시 액션) */
export function clearPool(): void {
  memCache = new Map();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
