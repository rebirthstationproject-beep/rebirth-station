/**
 * 큐브 리스트 PC 트랙 — 최소 타입 정의 (M2)
 *
 * 모바일 PWA (`apps/mobile-pwa/lib/types/cube.ts`) 와 호환되는 핵심 부분만 발췌.
 * 향후 M2 후반에 `packages/cube-format/` 공유 패키지로 통합 예정.
 *
 * 권위 소스: `apps/mobile-pwa/lib/types/cube.ts` (변경 시 양쪽 동기 갱신).
 */

/**
 * 큐브 액션 타입 — Stage 1.5 enum 10종 (모바일 PWA spec 호환).
 *
 * Tier 1 (안전): link, text_insert, clipboard_copy
 * Tier 2 (동의 prompt): shortcut, macro, app_launch, focus_window, mouse_click
 * Tier 3 (영구 명시 토글): plugin_action (셸 명령류)
 * 폴더: folder (서브덱 진입)
 */
export type CubeActionType =
  | 'link'
  | 'shortcut'
  | 'macro'
  | 'folder'
  | 'text_insert'
  | 'clipboard_copy'
  | 'app_launch'
  | 'focus_window'
  | 'mouse_click'
  | 'plugin_action';

/**
 * 큐브 1개 = 1개의 기능 버튼.
 * 모바일 PWA `CubeItem` 의 PC 편집기 표현 부분 집합.
 */
export interface Cube {
  id: string;
  /** flow layout 정렬 순서. real 가능 (드래그 reorder 시 사이값 보간) */
  sort_order: number;
  label: string;
  icon_url: string | null;
  action_type: CubeActionType;
  action_payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * 큐브 리스트 = 탭 1개 분량의 큐브 묶음 (.cubelist).
 * 모바일 PWA `CubeBoard` 등가.
 */
export interface CubeList {
  id: string;
  name: string;
  sort_order: number;
  cubes: Cube[];
  /** grid 컬럼 수 (3~8 사용자 선택, 기본 5) */
  cols?: number;
  metadata?: Record<string, unknown>;
}

/**
 * 큐브 팩 = 리스트 묶음 = 앱 1개 분량 (.cubepack).
 * 모바일 PWA `Workspace` 등가.
 */
export interface CubePack {
  id: string;
  name: string;
  /** 큐브팩 카테고리 (생산성/미디어/개발/... — 시드 카탈로그와 매핑) */
  category?: string;
  lists: CubeList[];
  metadata?: Record<string, unknown>;
}

/**
 * 편집기 선택 상태 — UI 차원 (DB 저장 X).
 */
export interface EditorSelection {
  pack_id: string | null;
  list_id: string | null;
  cube_id: string | null;
}
