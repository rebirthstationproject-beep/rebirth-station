/**
 * 큐브 리스트 파일 형식 v3 — 타입 정의
 *
 * 정착본: docs/file-format-spec.md (v3 ZIP 컨테이너)
 * 확장자: .cubeone (단일) / .cubelist (한 장) / .cubepack (묶음)
 *
 * v3 변경:
 * - 모든 파일이 ZIP 컨테이너 (manifest.json + 자원)
 * - .cubelist는 cubes/*.cubeone + order 배열 (참조)
 * - .cubepack은 lists/*.cubelist + order 배열
 * - 큐브 안에 icon_ref(ZIP 내부 경로) 또는 icon_url(외부) 사용
 */

import type { ActionPayload } from '@/types/protocol';

export const RBS_FORMAT_VERSION = 3 as const;
export const RBS_MIN_VERSION = '0.1.0';

export type CubeFileKind = 'cubeone' | 'cubelist' | 'cubepack';

export type LicenseKind = 'free' | 'personal' | 'commercial' | 'proprietary';

interface CommonHeader {
  /** JSON Schema URL (선택) */
  $schema?: string;
  /** v1, v2, v3 모두 import 지원 (export는 v3) */
  rbs_format_version: 1 | 2 | 3;
  kind: CubeFileKind;
  id: string;
  author?: string;
  license: LicenseKind;
  created_at: string;
  updated_at: string;
  rbs_min_version: string;
}

export interface CubeBodyDto {
  label: string;
  /** v3: ZIP 내부 자원 참조 (예: "icon.webp") */
  icon_ref?: string;
  /** v2 호환 또는 외부 URL 사용 시 */
  icon_url?: string | null;
  // SD-AQ~AV (2026-05-23): 4 enum → 10 enum 확장
  action_type:
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
  action_payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/** .cubeone manifest.json (ZIP 안) */
export interface CubeOneFile extends CommonHeader {
  kind: 'cubeone';
  cube: CubeBodyDto;
}

/** .cubelist manifest.json (ZIP 안) */
export interface CubeListBody {
  name: string;
  description?: string;
  /**
   * v3: cubes/*.cubeone 참조 + sort_order
   * v2 호환: cubes 배열 직접 임베드 (legacy import 지원)
   */
  order?: Array<{ ref: string; sort_order: number }>;
  /** v2 호환 (import 시 자동 v3 변환) */
  cubes?: CubeBodyDto[];
}

export interface CubeListFile extends CommonHeader {
  kind: 'cubelist';
  list: CubeListBody;
}

/** .cubepack manifest.json (ZIP 안) */
export interface CubePackBody {
  name: string;
  description?: string;
  target_persona?: string[];
  /** v3: lists/*.cubelist 참조 + sort_order */
  order?: Array<{ ref: string; sort_order: number }>;
  /** v2 호환 */
  lists?: CubeListBody[];
}

export interface CubePackFile extends CommonHeader {
  kind: 'cubepack';
  pack: CubePackBody;
}

export type AnyCubeFile = CubeOneFile | CubeListFile | CubePackFile;

/** 확장자 → kind 매핑 */
export function kindFromExtension(filename: string): CubeFileKind | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.cubeone')) return 'cubeone';
  if (lower.endsWith('.cubelist')) return 'cubelist';
  if (lower.endsWith('.cubepack')) return 'cubepack';
  return null;
}

/** kind → MIME 타입 (서버 응답 헤더) — ZIP 컨테이너라 application/zip이 정석이지만 vendor 식별 유지 */
export function mimeFromKind(kind: CubeFileKind): string {
  return `application/vnd.rebirthstation.${kind}+zip`;
}

/** payload → typed ActionPayload 변환 (CubeListView에서 사용, SD-AQ~AV 10 enum 확장) */
export function asActionPayload(c: CubeBodyDto): ActionPayload {
  const p = c.action_payload as Record<string, unknown>;
  switch (c.action_type) {
    case 'link':
      return { action_type: 'link', url: String(p.url ?? '') };
    case 'shortcut':
      return { action_type: 'shortcut', keys: Array.isArray(p.keys) ? (p.keys as string[]) : [] };
    case 'macro':
      return { action_type: 'macro', steps: Array.isArray(p.steps) ? (p.steps as ActionPayload extends { action_type: 'macro'; steps: infer S } ? S : never) : [] };
    case 'folder':
      return { action_type: 'folder', cube_ids: Array.isArray(p.cube_ids) ? (p.cube_ids as string[]) : [] };
    // SD-AQ~AV
    case 'text_insert':
      return { action_type: 'text_insert', text: String(p.text ?? '') };
    case 'clipboard_copy':
      return { action_type: 'clipboard_copy', text: String(p.text ?? '') };
    case 'app_launch':
      return { action_type: 'app_launch', path: String(p.path ?? ''), args: Array.isArray(p.args) ? (p.args as string[]) : undefined };
    case 'focus_window':
      return { action_type: 'focus_window', title_pattern: String(p.title_pattern ?? '') };
    case 'mouse_click':
      return {
        action_type: 'mouse_click',
        x: typeof p.x === 'number' ? p.x : 0,
        y: typeof p.y === 'number' ? p.y : 0,
        button: (p.button === 'right' || p.button === 'middle' ? p.button : 'left') as 'left' | 'right' | 'middle',
        relative: Boolean(p.relative),
      };
    case 'plugin_action':
      return {
        action_type: 'plugin_action',
        plugin_uuid: String(p.plugin_uuid ?? ''),
        payload: (typeof p.payload === 'object' && p.payload !== null ? p.payload : {}) as Record<string, unknown>,
      };
  }
}
