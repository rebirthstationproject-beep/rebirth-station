//! 프로토콜 메시지 정의
//!
//! 모바일 PWA → PC 헬퍼: `ClientEvent`
//! PC 헬퍼 → 모바일 PWA: `ServerEvent`
//!
//! JSON 표현은 serde rename으로 명시. 클라이언트 측 TS 타입(`apps/web/types/protocol.ts`)
//! 과 1:1 대응 유지 (계약 변경 시 양쪽 동시 갱신).

use serde::{Deserialize, Serialize};

// ===========================================================================
// 공통
// ===========================================================================

pub type BoardId = String; // uuid 문자열 (서버에서 검증)
pub type ItemId = String;
pub type DeviceId = String;
pub type Nonce = String;

/// 프로토콜 버전 — 클라이언트 핸드셰이크 시 검증
pub const PROTOCOL_VERSION: u8 = 1;

// ===========================================================================
// 클라이언트 → 헬퍼 이벤트
// ===========================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "event", rename_all = "snake_case")]
pub enum ClientEvent {
    /// 페어링 후 첫 핸드셰이크. 인증된 세션 검증.
    Hello {
        protocol_version: u8,
        device_id: DeviceId,
        nonce: Nonce,
        timestamp_ms: u64,
        /// HMAC-SHA256(secret, nonce|timestamp|device_id) hex
        hmac: String,
    },

    /// 활성 보드 전환 (Realtime 채널 구독 박자 맞추기)
    SubscribeBoard {
        board_id: BoardId,
    },

    /// 큐브 눌림 — 헬퍼가 해당 item의 action 실행.
    ///
    /// action_payload는 클라이언트가 동봉 (헬퍼는 Supabase에 직접 접근 X).
    /// 정착 원칙: 헬퍼 = 실행 권위만, 영속 권위는 Supabase + 클라이언트.
    PressItem {
        board_id: BoardId,
        item_id: ItemId,
        press_kind: PressKind,
        action: ActionPayload,
    },

    /// 매크로 직접 실행 (개발자 모드, manifest 검증된 플러그인만)
    RunMacro {
        macro_id: String,
        params: serde_json::Map<String, serde_json::Value>,
    },

    /// 연결 유지 (15초 간격)
    Ping,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PressKind {
    /// 짧게 눌렀다 뗌 (0~400ms)
    Tap,
    /// 길게 누름 (>=400ms)
    Long,
    /// 더블탭 (Phase 2 대비 자리)
    Double,
}

// ===========================================================================
// 헬퍼 → 클라이언트 이벤트
// ===========================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "event", rename_all = "snake_case")]
pub enum ServerEvent {
    /// 핸드셰이크 응답
    Welcome {
        protocol_version: u8,
        helper_version: String,
        capabilities: Capabilities,
    },

    /// 핸드셰이크 실패 (HMAC 불일치, 만료 등)
    AuthRejected {
        reason: AuthRejectionReason,
    },

    /// 액션 실행 결과
    ItemExecuted {
        item_id: ItemId,
        status: ExecutionStatus,
        /// 실행 소요 시간 (ms)
        elapsed_ms: u32,
    },

    /// 매크로 실행 중간 진행
    MacroProgress {
        macro_id: String,
        step_index: u16,
        total_steps: u16,
    },

    /// Pong (15초 간격 ping에 응답)
    Pong,

    /// 헬퍼가 사용자에게 알릴 메시지 (Tier 2 권한 prompt 등)
    Notice {
        level: NoticeLevel,
        message: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capabilities {
    /// 단축키 시뮬레이션 가능 여부 (enigo 활성화)
    pub can_send_keys: bool,
    /// 외부 앱 실행 가능 여부 (Tier 2)
    pub can_launch_app: bool,
    /// 셸 명령 실행 가능 여부 (Tier 3, 기본 false)
    pub can_run_shell: bool,
    /// OS 식별
    pub os: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuthRejectionReason {
    InvalidHmac,
    TimestampSkew,
    NonceReused,
    UnknownDevice,
    ProtocolVersionMismatch,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum ExecutionStatus {
    Ok,
    Failed { reason: String },
    /// Tier 2/3 권한 필요. 사용자 prompt 후 재시도
    PermissionRequired { tier: u8 },
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NoticeLevel {
    Info,
    Warning,
    Error,
}

// ===========================================================================
// 액션 페이로드 (DB mylist_items.action_payload와 1:1 대응)
// ===========================================================================

/// `action_payload` JSON 파싱 결과 (action_type별 분기)
///
/// 10 enum (M3 cron #7 확장): link · shortcut · macro · folder · text_insert ·
/// clipboard_copy · app_launch · focus_window · mouse_click · plugin_action.
/// frontend `src/lib/actions/index.ts` ACTIONS 와 1:1 대응 — 변경 시 양쪽 동시 갱신.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "action_type", rename_all = "snake_case")]
pub enum ActionPayload {
    Link {
        url: String,
    },
    Shortcut {
        /// 예: ["ctrl", "shift", "t"]
        keys: Vec<String>,
    },
    Macro {
        /// 최대 50 step (guard 검증)
        steps: Vec<MacroStepDto>,
    },
    /// 폴더(서브덱) — 큐브 모음 진입. PC 헬퍼는 직접 실행 X (frontend UI 처리)
    Folder {
        #[serde(default)]
        cube_ids: Vec<String>,
    },
    /// 텍스트 입력 (Tier 1)
    TextInsert {
        text: String,
    },
    /// 클립보드 복사 (Tier 1)
    ClipboardCopy {
        text: String,
    },
    /// 외부 앱 실행 (Tier 2)
    AppLaunch {
        path: String,
        #[serde(default)]
        args: Vec<String>,
    },
    /// 창 포커스 (Tier 2)
    FocusWindow {
        title_pattern: String,
    },
    /// 마우스 클릭 (Tier 2)
    MouseClick {
        x: i32,
        y: i32,
        #[serde(default = "default_mouse_button")]
        button: MouseButton,
        #[serde(default)]
        relative: bool,
    },
    /// 플러그인 액션 — M4 SDK 도입 후 활성 (Tier 3)
    PluginAction {
        plugin_uuid: String,
        #[serde(default)]
        payload: serde_json::Value,
    },
}

fn default_mouse_button() -> MouseButton {
    MouseButton::Left
}

/// `MacroStep`의 wire format (Rust 내부 enum과 별개. 외부 직렬화 전용)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum MacroStepDto {
    Key { keys: Vec<String> },
    Click { x: i32, y: i32, button: MouseButton },
    Delay { ms: u32 },
    LaunchApp { path: String, args: Vec<String> },
    FocusWindow { title_pattern: String },
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MouseButton {
    Left,
    Right,
    Middle,
}

// ===========================================================================
// 테스트
// ===========================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn client_event_roundtrip_hello() {
        let event = ClientEvent::Hello {
            protocol_version: PROTOCOL_VERSION,
            device_id: "device-uuid".into(),
            nonce: "n-12345".into(),
            timestamp_ms: 1716268800000,
            hmac: "abcdef...".into(),
        };
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains(r#""event":"hello""#));

        let parsed: ClientEvent = serde_json::from_str(&json).unwrap();
        match parsed {
            ClientEvent::Hello { device_id, .. } => assert_eq!(device_id, "device-uuid"),
            _ => panic!("expected Hello"),
        }
    }

    #[test]
    fn press_item_serializes_press_kind() {
        let event = ClientEvent::PressItem {
            board_id: "b".into(),
            item_id: "i".into(),
            press_kind: PressKind::Long,
        };
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains(r#""press_kind":"long""#));
    }

    #[test]
    fn action_payload_link_roundtrip() {
        let payload = ActionPayload::Link { url: "https://주소모아.com".into() };
        let json = serde_json::to_string(&payload).unwrap();
        let back: ActionPayload = serde_json::from_str(&json).unwrap();
        match back {
            ActionPayload::Link { url } => assert!(url.contains("주소모아")),
            _ => panic!("expected Link"),
        }
    }
}
