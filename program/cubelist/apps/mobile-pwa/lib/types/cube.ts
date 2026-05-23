/**
 * 큐브·리스트 도메인 타입 — DB `mylist_boards` / `mylist_items` 와 1:1.
 *
 * **권위 spec (영구 동기화)** (SD-CR, 2026-05-23):
 * - `docs/site/cube-action-types-spec.md` §A — 10 enum 정의 (사용자 권위)
 * - `docs/site/cube-action-types-spec.md` §B — payload TypeScript
 * - `docs/site/cube-action-types-spec.md` §D — 코드 ↔ spec 동기화 표
 *
 * 변경 시 spec + 본 파일 + `apps/web/types/protocol.ts` `ActionPayload` 동시 갱신.
 * 자동 검증: `scripts/validate-plugin-manifests.mjs` (10 enum + 역도메인 UUID).
 */

import type { ActionPayload } from '@/types/protocol';

export interface CubeBoard {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  /** 소속 워크스페이스 (Stream Deck Profile 대응). null = 기본 워크스페이스 */
  workspace_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  /** 클라이언트 측 hydrated 필드 (server에는 별도 쿼리) */
  items: CubeItem[];
}

/**
 * 워크스페이스 — 보드 묶음 (Stream Deck Profile 대응).
 * 작업 컨텍스트별 분리 (예: "주소모아 라이브러리", "개인", "업무").
 */
export interface Workspace {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  /** 활성화 트리거 메타 (Smart Profile 대응 — Stage 2) */
  metadata?: Record<string, unknown>;
}

/**
 * 큐브 (CubeItem) — Stream Deck Action 대응.
 *
 * **SD-G (2026-05-23 영구 결정): 1D `sort_order` 유지 — Stream Deck 2D `"row,col"` 대신**
 * Stream Deck 7.4.2 분석 결과 (docs/streamdeck-analysis.md):
 *   - SD = `Controllers[0].Actions["row,col"]` 2D 좌표 매핑 (디바이스별 그리드 크기 고정)
 *   - 큐브 리스트 = `sort_order` (real) 1D + `cols` 사용자 동적 (3~8)
 * 결정 사유:
 *   - 모바일 다양한 화면 폭 대응 (cols 3/4/5/6/7/8 자유 전환)
 *   - 큐브 reorder 시 sort_order 사이값 보간 (0.5 → 재인덱싱)이 row/col 변경보다 효율
 *   - 폴더 진입 시 cube_ids[] 순서 = 그리드 동일 모델 (시각 일관성)
 * 변경 시: docs/streamdeck-analysis.md §6.5 + docs/file-format-spec.md 동시 갱신.
 *
 * **SD-F (2026-05-23 영구 결정): Controller Type = Keypad 전용 (Stage 1)**
 * Stream Deck Controllers: ["Keypad" / "Encoder" / "Touch"]
 *   - Keypad = 일반 키 버튼 (큐브 리스트 = 이것)
 *   - Encoder = 다이얼/노브 (Stream Deck Plus 전용, Stage 2+)
 *   - Touch = 터치 스트립 (Plus 전용, Stage 2+)
 * Stage 1 = Keypad만. Encoder/Touch는 별도 metadata.controller_type 도입 후 진입.
 */
export interface CubeItem {
  id: string;
  board_id: string;
  /** flow 레이아웃 순서 (작은 값이 먼저). 드래그 reorder 시 사이값 보간 가능 (SD-G 영구) */
  sort_order: number;
  label: string;
  icon_url: string | null;
  /**
   * action_type — Stage 1.5 enum 10종 (SD-AQ~AV 2026-05-23 확장).
   *
   * docs/site/cube-action-types-spec.md (사용자 권위) 정합:
   * - link/shortcut/macro/folder (Stage 1 기본 4종)
   * - text_insert/clipboard_copy (Tier 1, env3)
   * - app_launch/focus_window/mouse_click (Tier 2, env3)
   * - plugin_action (Tier 1~3, 플러그인 정의)
   * `delay`는 macro.steps[] 내부 sub-step 전용 (top-level enum 아님).
   *
   * Stage 1 LOCAL_MODE = 10종 모두 저장 가능. 실 발화는 PC helper Tier 정책에 따름.
   * BLOCKED SD-AX: DB 마이그레이션 0008 (mylist_items.action_type CHECK 확장) — Supabase DB 모드 진입 시점.
   */
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
  /** 직렬화된 jsonb — typed `ActionPayload`로 변환 후 사용 */
  action_payload: Record<string, unknown>;
  /** 큐브 메타 (bg_color 등) — 0005 마이그레이션.
   * Stream Deck 호환 필드 (SD-C/D/E 후속):
   * - `action_uuid`: 역도메인 식별자 `com.cubelist.{kind}` (SD-C, 후속)
   * - `states[]`: multi-state 토글/진행률 (SD-D, 후속)
   * - `linked_title`: 라벨 자동 동기화 마커 (SD-E)
   * - `hotkey`: 단일 키 (TVH)
   * - `bg_color`: 5색 preset (ver.주소모아 색상)
   */
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** 큐브 배경색 프리셋 (Stage 1) — label은 ko 기본, 다국어는 cubeBgPresetLabel(locale) */
// Stream Deck 톤 (2026-05-23): 큐브 셀은 배경(surface)보다 한 단계 밝게 (surface-2)
// 라이트: #F9FAFB / 다크: #23272A — 키 셀이 패널 위에 떠 있는 느낌
/**
 * 큐브 5색 preset.
 *
 * 2026-05-23 사용자 명시 "분홍색 모두 없애": pink/midnight 값은 슬레이트 그레이로 비활성.
 * ver.주소모아 콜라보 진입 시 className만 원래 복구 (값은 보존).
 */
export const CUBE_BG_PRESETS = [
  { value: 'default', label: '기본', className: 'bg-surface-2 border-border' },
  { value: 'pink', label: '슬레이트', className: 'bg-rbs-accent-soft border-rbs-accent/30' },
  { value: 'midnight', label: '다크 슬레이트', className: 'bg-rbs-accent-strong text-white border-rbs-accent-strong' },
  { value: 'green', label: '그린', className: 'bg-green-50 dark:bg-green-950/40 border-green-200' },
  { value: 'yellow', label: '옐로', className: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200' },
] as const;

export type CubeBgPreset = (typeof CUBE_BG_PRESETS)[number]['value'];

/**
 * 큐브 multi-state 엔트리 (SD-Q, 2026-05-23) — Stream Deck `States[]` 대응.
 *
 * 사용 케이스 (예: 음소거 토글, 진행률 표시):
 * - 큐브 1회 누름 → state 인덱스 +1 (배열 길이 mod), label/icon 갱신
 * - state별 다른 액션 payload (예: state 0 = 음소거 ON, state 1 = OFF)
 *
 * 저장 위치: `CubeItem.metadata.states: CubeStateEntry[]`
 * 현재 active state: `CubeItem.metadata.state: number` (0부터)
 * states 미정의 시 = 단일 상태 (기본 동작)
 */
export interface CubeStateEntry {
  /** state 인덱스 (0부터, sort_order와 별개) */
  index: number;
  /** state별 라벨 — undefined 시 CubeItem.label fallback */
  label?: string;
  /** state별 아이콘 URL — undefined 시 CubeItem.icon_url fallback */
  icon_url?: string | null;
  /** state별 액션 payload 오버라이드 — undefined 시 CubeItem.action_payload fallback */
  action_payload?: Record<string, unknown>;
}

/** 큐브의 현재 active state 인덱스 (SD-Q) — metadata.state 또는 0 fallback */
export function getCubeActiveState(item: CubeItem): number {
  const s = item.metadata?.state;
  if (typeof s === 'number' && Number.isFinite(s) && s >= 0) return Math.floor(s);
  return 0;
}

/** 큐브의 state 배열 (SD-Q) — metadata.states 또는 빈 배열 */
export function getCubeStates(item: CubeItem): CubeStateEntry[] {
  const arr = item.metadata?.states;
  if (!Array.isArray(arr)) return [];
  return arr.filter((s): s is CubeStateEntry => typeof s === 'object' && s !== null && typeof (s as CubeStateEntry).index === 'number');
}

/** 현재 state의 effective label (SD-Q) — state.label > item.label */
export function getCubeEffectiveLabel(item: CubeItem): string {
  const states = getCubeStates(item);
  if (states.length === 0) return item.label;
  const active = getCubeActiveState(item);
  const cur = states.find((s) => s.index === active);
  return cur?.label ?? item.label;
}

/** 현재 state의 effective icon (SD-Q) — state.icon_url > item.icon_url */
export function getCubeEffectiveIcon(item: CubeItem): string | null {
  const states = getCubeStates(item);
  if (states.length === 0) return item.icon_url;
  const active = getCubeActiveState(item);
  const cur = states.find((s) => s.index === active);
  return cur?.icon_url ?? item.icon_url;
}

/**
 * 현재 state의 effective payload (SD-CH, 2026-05-23).
 * state별 payload 오버라이드가 있으면 사용, 없으면 item.action_payload fallback.
 * helper.sendPressItem에 전달할 payload — multi-state 큐브가 state별로 다른 동작하도록.
 */
export function getCubeEffectivePayload(item: CubeItem): Record<string, unknown> {
  const states = getCubeStates(item);
  if (states.length === 0) return item.action_payload;
  const active = getCubeActiveState(item);
  const cur = states.find((s) => s.index === active);
  return cur?.action_payload ?? item.action_payload;
}

const BG_LABELS_BY_LOCALE: Record<'ko' | 'en' | 'ja', Record<CubeBgPreset, string>> = {
  ko: { default: '기본', pink: '핑크', midnight: '미드나잇', green: '그린', yellow: '옐로' },
  en: { default: 'Default', pink: 'Pink', midnight: 'Midnight', green: 'Green', yellow: 'Yellow' },
  ja: { default: '基本', pink: 'ピンク', midnight: 'ミッドナイト', green: 'グリーン', yellow: 'イエロー' },
};

export function cubeBgPresetLabel(value: CubeBgPreset, locale: 'ko' | 'en' | 'ja' = 'ko'): string {
  return BG_LABELS_BY_LOCALE[locale]?.[value] ?? BG_LABELS_BY_LOCALE.ko[value] ?? value;
}

/**
 * 큐브 메타데이터 검증된 값 추출.
 *
 * 정착본 §7 — confirm_double_press / double_press_window_ms / long_press_ms / badge / bg_color
 * 모두 사용자 입력이므로 범위 검증 후 안전한 기본값으로 폴백.
 */
export interface CubeMetaSettings {
  confirmDoublePress: boolean;
  doublePressWindowMs: number; // 300~700, 기본 400
  longPressMs: number; // 400~900, 기본 600
  badge: string | null;
  bgColor: CubeBgPreset;
}

export function readCubeMeta(metadata?: Record<string, unknown>): CubeMetaSettings {
  const confirmDoublePress = Boolean(metadata?.confirm_double_press);

  const rawWindow = metadata?.double_press_window_ms;
  const doublePressWindowMs =
    typeof rawWindow === 'number' && rawWindow >= 300 && rawWindow <= 700 ? rawWindow : 400;

  const rawLong = metadata?.long_press_ms;
  const longPressMs =
    typeof rawLong === 'number' && rawLong >= 400 && rawLong <= 900 ? rawLong : 600;

  const badge = cleanBadge(metadata?.badge);

  const rawBg = metadata?.bg_color;
  const bgColor: CubeBgPreset =
    typeof rawBg === 'string' && CUBE_BG_PRESETS.some((p) => p.value === rawBg)
      ? (rawBg as CubeBgPreset)
      : 'default';

  return { confirmDoublePress, doublePressWindowMs, longPressMs, badge, bgColor };
}

/**
 * 배지 텍스트 정규화 — trim + 4자 cap + 빈/공백만은 null.
 *
 * 정착본 §7: 배지는 우상단 4자 한정 (NEW/HOT/PRO 등). 공백·제어문자 차단.
 * 정규식은 RegExp 생성자로 작성 — 소스 파일에 raw 제어문자 저장 방지.
 */
export function cleanBadge(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  //  - (ASCII control) +  (DEL) 제거
  const CONTROL_RE = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');
  const cleaned = raw.replace(CONTROL_RE, '').trim().slice(0, 4);
  return cleaned.length > 0 ? cleaned : null;
}

export function getCubeBgClassName(metadata?: Record<string, unknown>): string {
  const bg = metadata?.bg_color as string | undefined;
  if (!bg) return 'bg-surface-2 border-border';
  const preset = CUBE_BG_PRESETS.find((p) => p.value === bg);
  return preset?.className ?? 'bg-surface-2 border-border';
}

/**
 * Action UUID 역도메인 호환 매핑 (SD-C, 2026-05-23).
 *
 * Stream Deck 7.4.2 Plugin manifest는 `UUID` 필드로 액션 식별:
 *   - `com.elgato.streamdeck.system.website` / `openurl` → link
 *   - `com.elgato.streamdeck.system.hotkey` → shortcut
 *   - `com.elgato.streamdeck.multiactions` → macro
 *   - `com.elgato.streamdeck.profile.openchild` / `backtoparent` → folder
 *
 * 우리 큐브 자체 액션:
 *   - `com.cubelist.link` ↔ action_type='link'
 *   - `com.cubelist.shortcut` ↔ action_type='shortcut'
 *   - `com.cubelist.macro` ↔ action_type='macro'
 *   - `com.cubelist.folder` ↔ action_type='folder'
 *
 * 변경 시: docs/streamdeck-analysis.md §4 참조.
 */
const SD_UUID_TO_ACTION_TYPE: Record<string, CubeItem['action_type']> = {
  'com.cubelist.link': 'link',
  'com.cubelist.shortcut': 'shortcut',
  'com.cubelist.macro': 'macro',
  'com.cubelist.folder': 'folder',
  // SD-AQ~AV (2026-05-23): 10 enum 확장
  'com.cubelist.text_insert': 'text_insert',
  'com.cubelist.clipboard_copy': 'clipboard_copy',
  'com.cubelist.app_launch': 'app_launch',
  'com.cubelist.focus_window': 'focus_window',
  'com.cubelist.mouse_click': 'mouse_click',
  'com.cubelist.plugin_action': 'plugin_action',
  // Stream Deck 호환 (Plugin import 시 자동 매핑)
  'com.elgato.streamdeck.system.website': 'link',
  'com.elgato.streamdeck.system.openurl': 'link',
  'com.elgato.streamdeck.system.hotkey': 'shortcut',
  'com.elgato.streamdeck.multiactions': 'macro',
  'com.elgato.streamdeck.system.text': 'text_insert',
  'com.elgato.streamdeck.system.openapp': 'app_launch',
  'com.elgato.streamdeck.system.mouse': 'mouse_click',
  'com.elgato.streamdeck.system.close': 'shortcut',
  'com.elgato.streamdeck.profile.openchild': 'folder',
  'com.elgato.streamdeck.profile.backtoparent': 'folder',
};

const ACTION_TYPE_TO_DEFAULT_UUID: Record<CubeItem['action_type'], string> = {
  link: 'com.cubelist.link',
  shortcut: 'com.cubelist.shortcut',
  macro: 'com.cubelist.macro',
  folder: 'com.cubelist.folder',
  text_insert: 'com.cubelist.text_insert',
  clipboard_copy: 'com.cubelist.clipboard_copy',
  app_launch: 'com.cubelist.app_launch',
  focus_window: 'com.cubelist.focus_window',
  mouse_click: 'com.cubelist.mouse_click',
  plugin_action: 'com.cubelist.plugin_action',
};

/** SD UUID → 우리 action_type. 매핑 없으면 link 폴백 (가장 무해). */
export function actionTypeFromUuid(uuid: string): CubeItem['action_type'] {
  return SD_UUID_TO_ACTION_TYPE[uuid] ?? 'link';
}

/** 우리 action_type → 기본 UUID (외부 export 시 사용) */
export function defaultUuidForActionType(actionType: CubeItem['action_type']): string {
  return ACTION_TYPE_TO_DEFAULT_UUID[actionType];
}

/** 큐브의 effective UUID — metadata.action_uuid 우선, 없으면 action_type 기본값 */
export function getCubeActionUuid(item: CubeItem): string {
  const explicit = item.metadata?.action_uuid;
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;
  return defaultUuidForActionType(item.action_type);
}

/** DB row → typed ActionPayload 변환 (SD-AQ~AV 2026-05-23: 10 enum 지원) */
export function parseActionPayload(item: CubeItem): ActionPayload {
  const p = item.action_payload as Record<string, unknown>;
  switch (item.action_type) {
    case 'link':
      return { action_type: 'link', url: String(p.url ?? '') };
    case 'shortcut':
      return { action_type: 'shortcut', keys: Array.isArray(p.keys) ? (p.keys as string[]) : [] };
    case 'macro':
      return {
        action_type: 'macro',
        steps: Array.isArray(p.steps) ? (p.steps as ActionPayload extends { action_type: 'macro'; steps: infer S } ? S : never) : [],
      };
    case 'folder':
      return { action_type: 'folder', cube_ids: Array.isArray(p.cube_ids) ? (p.cube_ids as string[]) : [] };
    // SD-AQ
    case 'text_insert':
      return { action_type: 'text_insert', text: String(p.text ?? '') };
    // SD-AR
    case 'clipboard_copy':
      return { action_type: 'clipboard_copy', text: String(p.text ?? '') };
    // SD-AS
    case 'app_launch':
      return {
        action_type: 'app_launch',
        path: String(p.path ?? ''),
        args: Array.isArray(p.args) ? (p.args as string[]) : undefined,
      };
    // SD-AT
    case 'focus_window':
      return { action_type: 'focus_window', title_pattern: String(p.title_pattern ?? '') };
    // SD-AU
    case 'mouse_click':
      return {
        action_type: 'mouse_click',
        x: typeof p.x === 'number' ? p.x : 0,
        y: typeof p.y === 'number' ? p.y : 0,
        button: (p.button === 'right' || p.button === 'middle' ? p.button : 'left') as
          | 'left'
          | 'right'
          | 'middle',
        relative: Boolean(p.relative),
      };
    // SD-AV
    case 'plugin_action':
      return {
        action_type: 'plugin_action',
        plugin_uuid: String(p.plugin_uuid ?? ''),
        payload: (typeof p.payload === 'object' && p.payload !== null ? p.payload : {}) as Record<string, unknown>,
      };
  }
}
