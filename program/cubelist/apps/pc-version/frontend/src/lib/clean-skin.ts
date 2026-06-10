/**
 * 클린 스킨 (2026-06-10) — 자체 제작 아이콘으로 리스트 일괄 교체.
 *
 * SD 변환 원본 아이콘은 이미지 안에 영어 텍스트가 박혀 있어 96px 타일에서 지저분
 * → 자체 글리프(Photoshop 72종 카탈로그 + 메타포 라이브러리 + 레터 폴백, 무채색)로
 *   리스트 전체를 한 번에 교체한다. W2 스킨 메커니즘 재사용 (pre_skin_icon 보존 → 해제 가능).
 *
 * 제외: live_* (라이브 비주얼이 본체) · folder (폴더 글리프 고정).
 */

import type { Cube } from '../types/cube';
import { generateIconDataUrl } from './icon-generator';
import type { SkinMatch } from './skin-pack';

export const CLEAN_SKIN_NAME = 'clean-skin-v1';

export function buildCleanSkinMatches(cubes: readonly Cube[]): SkinMatch[] {
  const out: SkinMatch[] = [];
  for (const c of cubes) {
    if (c.action_type.startsWith('live_')) continue;
    if (c.action_type === 'folder') continue;
    out.push({
      cubeId: c.id,
      iconDataUrl: generateIconDataUrl(c.label, c.action_type),
      packName: CLEAN_SKIN_NAME,
    });
  }
  return out;
}
