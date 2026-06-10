/**
 * 변환 폴백 아이콘 중복 감지 (2026-06-10).
 *
 * StreamDeck 변환기가 액션별 이미지를 못 찾으면 플러그인 공용 이미지로 폴백
 * → 한 리스트 안에 동일 아이콘이 라벨만 다른 큐브 여러 개에 반복 (예: PS "Merge Layers" ×5).
 *
 * 규칙: 같은 리스트 안에서 동일 icon_url 이 3회 이상 → 첫 큐브만 원본 유지,
 * 나머지는 metadata.icon_is_duplicate = true 마킹 → CubeCell 이 라벨 기반 생성 글리프로 렌더.
 * icon_url 자체는 보존 (원본 불변 — 렌더 판단 플래그만).
 */

import type { Cube } from '../types/cube';

const DUPLICATE_THRESHOLD = 3;

export function markDuplicateIcons(cubes: Cube[]): Cube[] {
  const counts = new Map<string, number>();
  for (const c of cubes) {
    if (!c.icon_url) continue;
    counts.set(c.icon_url, (counts.get(c.icon_url) ?? 0) + 1);
  }

  const seen = new Map<string, number>();
  return cubes.map((c) => {
    if (!c.icon_url) return c;
    const total = counts.get(c.icon_url) ?? 0;
    if (total < DUPLICATE_THRESHOLD) return c;
    const nth = (seen.get(c.icon_url) ?? 0) + 1;
    seen.set(c.icon_url, nth);
    if (nth === 1) return c; // 첫 등장은 원본 아이콘 유지
    const meta = (c.metadata ?? {}) as Record<string, unknown>;
    if (meta.icon_is_duplicate === true) return c;
    return { ...c, metadata: { ...meta, icon_is_duplicate: true } };
  });
}
