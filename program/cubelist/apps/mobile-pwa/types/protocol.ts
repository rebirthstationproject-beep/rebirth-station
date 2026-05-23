/**
 * 큐브 리스트 (Cube List) 프로토콜 — TypeScript
 *
 * 회사: 리버스 스테이션 (Rebirth Station)
 * 정착본: docs/tech-review.md §1, §3 (architect / typescript)
 *
 * Rust 측 `apps/pc-helper/src/protocol/messages.rs`와 1:1 대응 유지.
 * 계약 변경 시 양쪽 동시 갱신.
 */

export const PROTOCOL_VERSION = 1 as const;

export type BoardId = string;
export type ItemId = string;
export type DeviceId = string;
export type Nonce = string;

// ===========================================================================
// 클라이언트(PWA) → 헬퍼 이벤트
// ===========================================================================

export type PressKind = 'tap' | 'long' | 'double';

export type ClientEvent =
  | {
      event: 'hello';
      protocol_version: number;
      device_id: DeviceId;
      nonce: Nonce;
      timestamp_ms: number;
      /** HMAC-SHA256(secret, nonce|timestamp|device_id) hex */
      hmac: string;
    }
  | {
      event: 'subscribe_board';
      board_id: BoardId;
    }
  | {
      event: 'press_item';
      board_id: BoardId;
      item_id: ItemId;
      press_kind: PressKind;
      /** 헬퍼가 실행할 action — DB 조회 없이 즉시 실행 가능하도록 동봉 */
      action: ActionPayload;
    }
  | {
      event: 'run_macro';
      macro_id: string;
      params: Record<string, unknown>;
    }
  | {
      event: 'ping';
    };

// ===========================================================================
// 헬퍼 → 클라이언트 이벤트
// ===========================================================================

export type AuthRejectionReason =
  | 'invalid_hmac'
  | 'timestamp_skew'
  | 'nonce_reused'
  | 'unknown_device'
  | 'protocol_version_mismatch';

export type ExecutionStatus =
  | { kind: 'ok' }
  | { kind: 'failed'; reason: string }
  | { kind: 'permission_required'; tier: number };

export type NoticeLevel = 'info' | 'warning' | 'error';

export interface Capabilities {
  can_send_keys: boolean;
  can_launch_app: boolean;
  can_run_shell: boolean;
  os: string;
}

export type ServerEvent =
  | {
      event: 'welcome';
      protocol_version: number;
      helper_version: string;
      capabilities: Capabilities;
    }
  | {
      event: 'auth_rejected';
      reason: AuthRejectionReason;
    }
  | {
      event: 'item_executed';
      item_id: ItemId;
      status: ExecutionStatus;
      elapsed_ms: number;
    }
  | {
      event: 'macro_progress';
      macro_id: string;
      step_index: number;
      total_steps: number;
    }
  | { event: 'pong' }
  | {
      event: 'notice';
      level: NoticeLevel;
      message: string;
    };

// ===========================================================================
// 액션 페이로드 (mylist_items.action_payload)
// ===========================================================================

export type MouseButton = 'left' | 'right' | 'middle';

/**
 * 각 step의 `description?` 는 UI 메모만. Rust 측 actions::execute는 무시.
 * (serde가 unknown 필드 자동 무시 — wire format 호환)
 */
export type MacroStepDto =
  | { kind: 'key'; keys: string[]; description?: string }
  | { kind: 'click'; x: number; y: number; button: MouseButton; description?: string }
  | { kind: 'delay'; ms: number; description?: string }
  | { kind: 'launch_app'; path: string; args: string[]; description?: string }
  | { kind: 'focus_window'; title_pattern: string; description?: string };

/**
 * 큐브 액션 payload 권위 정의 (SD-AP 2026-05-23: docs/site/cube-action-types-spec.md 10 enum 정합).
 * Stage 1 = 4 enum (link/shortcut/macro/folder).
 * SD-AQ~AV (2026-05-23) = 6 enum 확장 (text_insert/clipboard_copy/app_launch/focus_window/mouse_click/plugin_action).
 * 총 10 enum.
 */
export type ActionPayload =
  | { action_type: 'link'; url: string }
  | { action_type: 'shortcut'; keys: string[] }
  | { action_type: 'macro'; steps: MacroStepDto[] }
  | { action_type: 'folder'; cube_ids: string[] }
  // SD-AQ: 텍스트 입력 (현 포커스, Tier 1, env3 PC 헬퍼)
  | { action_type: 'text_insert'; text: string }
  // SD-AR: 클립보드 복사 (정적 텍스트, Tier 1, env3)
  | { action_type: 'clipboard_copy'; text: string }
  // SD-AS: 앱 실행 (경로 화이트리스트, Tier 2, env3)
  | { action_type: 'app_launch'; path: string; args?: string[] }
  // SD-AT: 윈도우 포커스 (타이틀 패턴, Tier 2, env3)
  | { action_type: 'focus_window'; title_pattern: string }
  // SD-AU: 마우스 클릭 (좌표 또는 상대, Tier 2, env3)
  | { action_type: 'mouse_click'; x: number; y: number; button: MouseButton; relative?: boolean }
  // SD-AV: 플러그인 액션 (manifest 서명, Tier 1~3 플러그인 정의)
  | { action_type: 'plugin_action'; plugin_uuid: string; payload: Record<string, unknown> };

// ===========================================================================
// 디스패처 (2단계 파싱)
// ===========================================================================

const KNOWN_CLIENT_EVENTS = [
  'hello',
  'subscribe_board',
  'press_item',
  'run_macro',
  'ping',
] as const;

const KNOWN_SERVER_EVENTS = [
  'welcome',
  'auth_rejected',
  'item_executed',
  'macro_progress',
  'pong',
  'notice',
] as const;

export class ProtocolError extends Error {
  constructor(public readonly code: ProtocolErrorCode, message: string) {
    super(message);
    this.name = 'ProtocolError';
  }
}

export type ProtocolErrorCode =
  | 'malformed_json'
  | 'missing_event_field'
  | 'unknown_event'
  | 'payload_mismatch';

/** raw JSON 문자열 → 타입 ServerEvent (PWA가 헬퍼 메시지 수신 시) */
export function parseServerEvent(raw: string): ServerEvent {
  const value = safeParseJson(raw);
  const event = readEventField(value);
  if (!(KNOWN_SERVER_EVENTS as readonly string[]).includes(event)) {
    throw new ProtocolError('unknown_event', `unknown server event: ${event}`);
  }
  return value as ServerEvent;
}

/** raw JSON 문자열 → 타입 ClientEvent (헬퍼가 PWA 메시지 수신 시, 테스트용) */
export function parseClientEvent(raw: string): ClientEvent {
  const value = safeParseJson(raw);
  const event = readEventField(value);
  if (!(KNOWN_CLIENT_EVENTS as readonly string[]).includes(event)) {
    throw new ProtocolError('unknown_event', `unknown client event: ${event}`);
  }
  return value as ClientEvent;
}

function safeParseJson(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new ProtocolError('malformed_json', 'expected object');
    }
    return parsed as Record<string, unknown>;
  } catch (e) {
    if (e instanceof ProtocolError) throw e;
    throw new ProtocolError('malformed_json', (e as Error).message);
  }
}

function readEventField(value: Record<string, unknown>): string {
  const event = value['event'];
  if (typeof event !== 'string') {
    throw new ProtocolError('missing_event_field', 'event field missing or not a string');
  }
  return event;
}
