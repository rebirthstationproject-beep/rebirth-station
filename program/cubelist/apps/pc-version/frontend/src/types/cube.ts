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
  // === 10 코어 (M3 완료) ===
  | 'link'
  | 'shortcut'
  | 'macro'
  | 'folder'
  | 'text_insert'
  | 'clipboard_copy'
  | 'app_launch'
  | 'focus_window'
  | 'mouse_click'
  | 'plugin_action'
  // === P1 11 신규 (Phase 3, 2026-05-31, 스트림덱 100% 호환) ===
  | 'media_key'                 // multimedia plugin (play/pause/next/prev/vol)
  | 'page_navigate'             // page 이동 액션 (system.pagination)
  | 'page_jump'                 // 특정 페이지 점프
  | 'folder_up'                 // profile.backtoparent
  | 'folder_open'               // profile.openchild
  | 'window_close'              // system.close (Alt+F4)
  | 'system_sleep'              // system.sleep
  | 'system_actionbar_toggle'   // system.actionbar
  | 'hotkey_toggle'             // system.hotkeyswitch (states 의존)
  | 'audio_play'                // soundboard
  | 'profile_rotate'            // 큐브 리스트 회전 (선택)
  // === P2 동적 큐브 (Phase 5) ===
  | 'live_clock'                // system.digitaltime
  | 'live_timer'                // timer
  | 'live_gauge'                // 자체 확장
  | 'live_battery'              // 자체 확장
  // === P3 동적 큐브 신규 (2026-06-01, 통합 모델 — 시계/모니터/알람/날씨) ===
  | 'live_weather'              // 날씨 (지역별 온도/조건/아이콘)
  | 'live_monitor'              // 시스템 모니터 (CPU/RAM/Disk/Network)
  | 'live_alarm'                // 알람 (목표 시각 도달 시 알림)
  | 'live_stock'                // 주가 / 환율 / 코인
  | 'live_calendar'             // 캘린더 이벤트 (다음 일정)
  | 'live_news'                 // 뉴스 헤드라인 (RSS/API)
  | 'live_network';             // 네트워크 (Wi-Fi 신호 / 핑 / 다운로드 속도)

/**
 * 매크로 step (M7 cron #21) — Rust `MacroStepDto` 와 1:1 (tag = "kind").
 * spec: `apps/pc-version/src/protocol/messages.rs`.
 */
export type MouseButton = 'left' | 'right' | 'middle';

export type MacroStep =
  | { kind: 'key'; keys: string[] }
  | { kind: 'click'; x: number; y: number; button: MouseButton }
  | { kind: 'delay'; ms: number }
  | { kind: 'launch_app'; path: string; args: string[] }
  | { kind: 'focus_window'; title_pattern: string };

export const MACRO_STEP_KINDS: ReadonlyArray<MacroStep['kind']> = [
  'key',
  'delay',
  'launch_app',
  'focus_window',
  'click',
];

export function defaultMacroStep(kind: MacroStep['kind']): MacroStep {
  switch (kind) {
    case 'key':
      return { kind: 'key', keys: [] };
    case 'click':
      return { kind: 'click', x: 0, y: 0, button: 'left' };
    case 'delay':
      return { kind: 'delay', ms: 100 };
    case 'launch_app':
      return { kind: 'launch_app', path: '', args: [] };
    case 'focus_window':
      return { kind: 'focus_window', title_pattern: '' };
  }
}

/**
 * 큐브 상태 (StreamDeck Action.States 1:1 매핑) — P0 영구 lock.
 *
 * StreamDeck 의 토글 액션 (hotkeyswitch, soundboard mute 등) 에서 사용.
 * 단일 상태 액션 = states 미사용 (label/icon_url 직접 사용).
 */
export interface CubeState {
  /** 이 상태에서 표시할 라벨 (override) */
  readonly label?: string;
  /** 이 상태에서 표시할 아이콘 URL/data URL */
  readonly image?: string;
  /** 이 상태에서 사용할 action_payload override */
  readonly action_payload?: Record<string, unknown>;
  /** 영구 forward-compat */
  readonly extensions?: Record<string, unknown>;
}

/**
 * 큐브 라벨 스타일 (StreamDeck Title 메타 1:1 매핑) — P0 영구 lock.
 *
 * UI 미구현 시 무시됨. 변환 보존용 필드.
 */
export interface CubeTitleStyle {
  readonly font_family?: string;
  readonly font_size?: number;
  readonly font_style?: 'normal' | 'bold' | 'italic' | 'bold_italic';
  readonly font_underline?: boolean;
  readonly outline_thickness?: number;
  readonly show?: boolean;
  /** 사용자 지정 vs 자동 (LinkedTitle) */
  readonly linked?: boolean;
  readonly title?: string;
  readonly alignment?: 'top' | 'middle' | 'bottom';
  /** #RRGGBB */
  readonly color?: string;
}

/**
 * 큐브 컨트롤러 타입 (StreamDeck Controllers 1:1 매핑) — P0 영구 lock.
 *
 * StreamDeck+ 디바이스: Encoder (dial) + Touchpad (LCD 터치) + Keypad (메인 키)
 * 단일 디바이스 가정 시 'main' 기본.
 */
export type CubeControllerType = 'main' | 'dial' | 'touchpad';

/**
 * 큐브 1개 = 1개의 기능 버튼.
 *
 * P0 영구 lock (2026-05-31): states / title_style / controller_type / extensions / streamdeck_meta 추가.
 * 모든 신규 필드 옵셔널 — 기존 파일 파싱 보장.
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
  // === P0 영구 lock 필드 (2026-05-31) ===
  /** 멀티 상태 액션 (토글). 없으면 단일 상태. StreamDeck Action.States 매핑. */
  states?: readonly CubeState[];
  /** 라벨 스타일 (Font/Color/Alignment). StreamDeck Title 메타 매핑. UI 미구현 시 보존만. */
  title_style?: CubeTitleStyle;
  /** 컨트롤러 타입 (멀티 컨트롤러 device 분기). 기본 'main'. */
  controller_type?: CubeControllerType;
  /** Forward-compat — 미래 확장 필드 자유 형식 (schema validate 무관) */
  extensions?: Record<string, unknown>;
  /** 변환 원본 보존 — reversible 보장 (StreamDeck 원본 manifest 일부) */
  streamdeck_meta?: Record<string, unknown>;
}

/**
 * 디바이스 hint (StreamDeck 디바이스 모델별 그리드 자동 매핑).
 * P0 영구 lock — 13 DefaultProfile 변환 시 사용.
 */
export type DeviceHint =
  | 'streamdeck_mini'           // 3×2 = 6 키
  | 'streamdeck_standard'       // 5×3 = 15 키
  | 'streamdeck_mk2'            // 5×3 = 15 키
  | 'streamdeck_xl'             // 8×4 = 32 키
  | 'streamdeck_plus'           // 4×2 키 + 4 인코더 + 1 LCD
  | 'streamdeck_neo'            // 4×2 = 8 키
  | 'corsair_nightsword'
  | 'corsair_vanguard96'
  | 'corsair_vanguard99'
  | 'discord_deckmini'
  | 'galleon_100sd'
  | 'xlr_dock'
  | 'cubelist_unlimited';       // 우리 자체 (개수 제한 없음 — 영구)

/**
 * 큐브 리스트 = 탭 1개 분량의 큐브 묶음 (.cubelist).
 *
 * P0 영구 lock (2026-05-31): grid_layout / controller_type / current_folder_id / cube_ids /
 *   extensions / streamdeck_source 추가.
 */
export interface CubeList {
  id: string;
  name: string;
  sort_order: number;
  cubes: Cube[];
  /** grid 컬럼 수 (3~8 사용자 선택, 기본 5) */
  cols?: number;
  /** 한 페이지에 표시할 큐브 수 (기본 = cols × 3). M7 페이지네이션 (cron #20) */
  cubes_per_page?: number;
  /**
   * 리스트 단위 라벨 표시 토글 (R2 보완).
   * undefined = ON (기본값), false = 라벨 숨김.
   * 개별 큐브의 title_style.show 보다 낮은 우선순위 (큐브 단위 설정이 우선).
   */
  show_labels?: boolean;
  metadata?: Record<string, unknown>;
  // === P0 영구 lock 필드 (2026-05-31) ===
  /** 그리드 레이아웃 hint (디바이스별 자동 매핑). 우리 = cubelist_unlimited */
  grid_layout?: DeviceHint;
  /** 컨트롤러 타입 (멀티 컨트롤러 device 분기) */
  controller_type?: CubeControllerType;
  /** 현재 진입한 폴더 id (M7 폴더 stack) */
  current_folder_id?: string;
  /** folder type 큐브의 자식 큐브 id 배열 */
  cube_ids?: readonly string[];
  /** Forward-compat */
  extensions?: Record<string, unknown>;
  /** 변환 원본 보존 (StreamDeck Page manifest 일부) */
  streamdeck_source?: Record<string, unknown>;
}

/**
 * 큐브 팩 = 리스트 묶음 = 앱 1개 분량 (.cubepack).
 *
 * P0 영구 lock (2026-05-31): rbs_format_version / license / device_hint /
 *   streamdeck_source / extensions 추가.
 *
 * .streamDeckProfile → .cubepack 1:1 변환 산물.
 */
export interface CubePack {
  id: string;
  name: string;
  /** 큐브팩 카테고리 (생산성/미디어/개발/... — 시드 카탈로그와 매핑) */
  category?: string;
  /** 큐브 라이브러리 — 만들거나 폴더에서 불러온 큐브 풀 (sort_order 의미 없음, Phase 2b) */
  cubes?: Cube[];
  lists: CubeList[];
  metadata?: Record<string, unknown>;
  // === P0 영구 lock 필드 (2026-05-31) ===
  /** 파일 포맷 버전 영구 lock = 3 (rbs_format_version) */
  rbs_format_version?: 3;
  /** 라이선스 (free / paid / restricted) */
  license?: 'free' | 'paid' | 'restricted';
  description?: string;
  cubes_per_page_default?: number;
  /** 변환 원본 디바이스 */
  device_hint?: DeviceHint;
  /** 변환 원본 보존 (StreamDeck Profile manifest 일부) */
  streamdeck_source?: Record<string, unknown>;
  /** Forward-compat */
  extensions?: Record<string, unknown>;
}

/**
 * 편집기 선택 상태 — UI 차원 (DB 저장 X).
 */
export interface EditorSelection {
  pack_id: string | null;
  list_id: string | null;
  cube_id: string | null;
}
