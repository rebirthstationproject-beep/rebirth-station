//! 액션 실행 — 큐브 누름 시 헬퍼가 수행하는 OS 동작
//!
//! 정착본: tech-review.md §4 (백엔드), §6 (보안)
//!
//! Tier 1 (기본 허용): 링크 오픈 (스킴 검증), 텍스트 입력, 클립보드
//! Tier 2 (1회 동의): 외부 앱 launch, 파일 시스템
//! Tier 3 (영구 토글): 셸 명령
//!
//! W1-4 범위: 링크만 활성. 매크로/단축키는 W2.

pub mod guard;
pub mod link;
pub mod permissions;

// M3 cron #9: app_launch 는 std::process 만 사용 — `keys` feature 없이도 동작
pub mod app_launch;

// M3 cron #10: focus_window — Windows-only impl, 그 외 OS 는 FeatureDisabled
pub mod focus_window;

#[cfg(feature = "keys")]
pub mod shortcut;

#[cfg(feature = "keys")]
pub mod macro_exec;

#[cfg(feature = "keys")]
pub mod clipboard;

#[cfg(feature = "keys")]
pub mod mouse;

use thiserror::Error;

use crate::protocol::ActionPayload;

#[derive(Debug, Error)]
pub enum ActionError {
    #[error("unsafe url scheme: {0}")]
    UnsafeScheme(String),

    #[error("os command failed: {0}")]
    OsCommand(String),

    #[error("action type `{0}` requires feature flag")]
    FeatureDisabled(&'static str),

    #[error("permission tier {0} not granted")]
    PermissionRequired(u8),
}

pub struct ExecutionResult {
    pub elapsed_ms: u32,
}

/// 주 진입점 — `ActionPayload`를 받아 적절한 실행자로 dispatch.
///
/// 보안: 실행 전 `guard::validate`로 정적 검증 → 위험 패턴은 즉시 거부.
///
/// M3 cron #7 (2026-05-24): 10 variant 매칭 — 새 7종은 시그니처만 통과, 실 OS 호출은
/// 다음 사이클에 추가 (현재는 `PermissionRequired(tier)` 또는 `FeatureDisabled` 반환).
pub async fn execute(payload: &ActionPayload) -> Result<ExecutionResult, ActionError> {
    guard::validate(payload)?;

    let started = std::time::Instant::now();

    match payload {
        ActionPayload::Link { url } => {
            link::open_default_browser(url)?;
        }
        ActionPayload::Shortcut { keys } => {
            execute_shortcut(keys)?;
        }
        ActionPayload::Macro { steps } => {
            execute_macro(steps).await?;
        }
        // M3 cron #7~9 신규
        ActionPayload::Folder { .. } => {
            // 폴더 진입은 UI 측 처리 — 헬퍼는 no-op
        }
        ActionPayload::TextInsert { text } => {
            execute_text_insert(text)?;
        }
        ActionPayload::ClipboardCopy { text } => {
            execute_clipboard_copy(text)?;
        }
        ActionPayload::AppLaunch { path, args } => {
            // Tier 2 (사용자 동의는 별도 prompt 시스템에서 처리 — M5 페어링 단계).
            // guard 가 위험 경로 사전 차단.
            app_launch::launch(path, args)?;
        }
        ActionPayload::FocusWindow { title_pattern } => {
            focus_window::focus(title_pattern)?;
        }
        ActionPayload::MouseClick {
            x,
            y,
            button,
            relative,
        } => {
            execute_mouse_click(*x, *y, *button, *relative)?;
        }
        ActionPayload::PluginAction {
            plugin_uuid,
            payload,
        } => {
            execute_plugin_action(plugin_uuid, payload).await?;
        }
        // === P1 11 신규 액션 (Phase 3, 2026-05-31) ===
        ActionPayload::MediaKey { key } => execute_media_key(key)?,
        ActionPayload::WindowClose => execute_window_close()?,
        // frontend store 처리 액션 — Rust 측 no-op (Tauri invoke 가 frontend 직접 호출)
        ActionPayload::PageNavigate { .. }
        | ActionPayload::PageJump { .. }
        | ActionPayload::FolderUp
        | ActionPayload::FolderOpen { .. }
        | ActionPayload::ProfileRotate { .. } => {
            // frontend store 변경 = Rust no-op
        }
        // Tier 3 위험 액션 — 즉시 실행 (frontend 측 동의 dialog 가 호출 직전 confirm)
        ActionPayload::SystemSleep => execute_system_sleep()?,
        ActionPayload::SystemActionbarToggle => execute_actionbar_toggle()?,
        ActionPayload::AudioPlay { audio_url, .. } => execute_audio_play(audio_url)?,
        // hotkey_toggle: frontend 가 states[current_index] 의 keys 를 shortcut 으로 변환해서 송신.
        // Rust 측에 hotkey_toggle 이 직접 도착하는 경우 = frontend 가 미처리 → on_keys 우선 실행.
        ActionPayload::HotkeyToggle { on_keys, .. } => execute_shortcut(on_keys)?,
        // === P2 4 동적 큐브 — frontend tick 처리 = Rust no-op ===
        ActionPayload::LiveClock { .. }
        | ActionPayload::LiveTimer { .. }
        | ActionPayload::LiveGauge { .. }
        | ActionPayload::LiveBattery { .. } => {
            // frontend tick 시스템 = Rust no-op
        }
    }

    Ok(ExecutionResult {
        elapsed_ms: started.elapsed().as_millis() as u32,
    })
}

// ===== P1 즉시 구현 액션 =====

#[cfg(feature = "keys")]
fn execute_media_key(key: &str) -> Result<(), ActionError> {
    use enigo::{Direction, Enigo, Key, Keyboard, Settings};
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| ActionError::OsCommand(format!("Enigo 초기화 실패: {e}")))?;
    let media_key = match key {
        "play_pause" => Key::MediaPlayPause,
        "next" => Key::MediaNextTrack,
        "prev" => Key::MediaPrevTrack,
        "stop" => Key::MediaStop,
        "volume_up" => Key::VolumeUp,
        "volume_down" => Key::VolumeDown,
        "mute" => Key::VolumeMute,
        _ => return Err(ActionError::OsCommand(format!("미지원 미디어 키: {key}"))),
    };
    enigo
        .key(media_key, Direction::Click)
        .map_err(|e| ActionError::OsCommand(format!("미디어 키 송신 실패: {e}")))
}

#[cfg(not(feature = "keys"))]
fn execute_media_key(_key: &str) -> Result<(), ActionError> {
    Err(ActionError::FeatureDisabled("media_key"))
}

#[cfg(feature = "keys")]
fn execute_window_close() -> Result<(), ActionError> {
    use enigo::{Direction, Enigo, Key, Keyboard, Settings};
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| ActionError::OsCommand(format!("Enigo 초기화 실패: {e}")))?;
    // Alt+F4
    enigo
        .key(Key::Alt, Direction::Press)
        .map_err(|e| ActionError::OsCommand(format!("Alt press 실패: {e}")))?;
    let f4_result = enigo.key(Key::F4, Direction::Click);
    let _ = enigo.key(Key::Alt, Direction::Release);
    f4_result.map_err(|e| ActionError::OsCommand(format!("F4 송신 실패: {e}")))
}

#[cfg(not(feature = "keys"))]
fn execute_window_close() -> Result<(), ActionError> {
    Err(ActionError::FeatureDisabled("window_close"))
}

// ===== Tier 3 system_sleep (Windows SetSuspendState) =====
#[cfg(target_os = "windows")]
fn execute_system_sleep() -> Result<(), ActionError> {
    // SAFETY: SetSuspendState 는 시스템 콜로 Windows API 가 안전성 보장.
    //         호출 전 frontend 측 사용자 동의 확인 필수 (Tier 3 영구 토글).
    //         hibernate=false (sleep), force=true (강제 즉시), wakeup_events_disabled=false
    let result = unsafe { windows_sys::Win32::System::Power::SetSuspendState(0, 1, 0) };
    if result == 0 {
        Err(ActionError::OsCommand(
            "SetSuspendState 실패 (관리자 권한 또는 절전 정책 확인)".into(),
        ))
    } else {
        Ok(())
    }
}

#[cfg(not(target_os = "windows"))]
fn execute_system_sleep() -> Result<(), ActionError> {
    Err(ActionError::FeatureDisabled("system_sleep"))
}

// ===== Tier 2 system_actionbar_toggle (Shell_TrayWnd ShowWindow) =====
#[cfg(target_os = "windows")]
fn execute_actionbar_toggle() -> Result<(), ActionError> {
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        FindWindowA, IsWindowVisible, ShowWindow, SW_HIDE, SW_SHOW,
    };
    // 작업 표시줄 클래스명
    let class_name = b"Shell_TrayWnd\0".as_ptr();
    // SAFETY: FindWindowA 는 null-terminated 문자열 받음. 위 배열 확인.
    let tray_hwnd = unsafe { FindWindowA(class_name, std::ptr::null()) };
    if tray_hwnd.is_null() {
        return Err(ActionError::OsCommand(
            "작업 표시줄 (Shell_TrayWnd) 미발견".into(),
        ));
    }
    // SAFETY: tray_hwnd 는 유효 HWND. ShowWindow 는 안전.
    let visible = unsafe { IsWindowVisible(tray_hwnd) };
    let cmd = if visible != 0 { SW_HIDE } else { SW_SHOW };
    unsafe { ShowWindow(tray_hwnd, cmd) };
    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn execute_actionbar_toggle() -> Result<(), ActionError> {
    Err(ActionError::FeatureDisabled("system_actionbar_toggle"))
}

// ===== Tier 1 audio_play (std::process::Command 으로 기본 미디어 플레이어 실행) =====
fn execute_audio_play(audio_url: &str) -> Result<(), ActionError> {
    use std::process::Command;
    if audio_url.is_empty() {
        return Err(ActionError::OsCommand("audio_url 빈 값".into()));
    }
    // 위험 path 방어 (cmd.exe, powershell 등)
    let lower = audio_url.to_lowercase();
    let dangerous = [
        "cmd.exe", "powershell", "wscript", "cscript", "regsvr32", "mshta",
        "/bin/sh", "/bin/bash",
    ];
    if dangerous.iter().any(|d| lower.contains(d)) {
        return Err(ActionError::OsCommand(format!(
            "위험 경로 차단: {audio_url}"
        )));
    }
    // Windows: rundll32 url.dll,FileProtocolHandler — 기본 연결 프로그램으로 열기
    #[cfg(target_os = "windows")]
    {
        Command::new("rundll32")
            .args(["url.dll,FileProtocolHandler", audio_url])
            .spawn()
            .map_err(|e| ActionError::OsCommand(format!("audio_play spawn 실패: {e}")))?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        Command::new("xdg-open")
            .arg(audio_url)
            .spawn()
            .map_err(|e| ActionError::OsCommand(format!("audio_play spawn 실패: {e}")))?;
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Feature-gated 실행 함수 — keys feature OFF 시 명시적 거부
// ---------------------------------------------------------------------------

#[cfg(feature = "keys")]
fn execute_shortcut(keys: &[String]) -> Result<(), ActionError> {
    shortcut::send_keys(keys)
}

#[cfg(not(feature = "keys"))]
fn execute_shortcut(_keys: &[String]) -> Result<(), ActionError> {
    Err(ActionError::FeatureDisabled("shortcut"))
}

#[cfg(feature = "keys")]
async fn execute_macro(steps: &[crate::protocol::MacroStepDto]) -> Result<(), ActionError> {
    macro_exec::run_macro(steps).await
}

#[cfg(not(feature = "keys"))]
async fn execute_macro(_steps: &[crate::protocol::MacroStepDto]) -> Result<(), ActionError> {
    Err(ActionError::FeatureDisabled("macro"))
}

#[cfg(feature = "keys")]
fn execute_clipboard_copy(text: &str) -> Result<(), ActionError> {
    clipboard::set_clipboard(text)
}

#[cfg(not(feature = "keys"))]
fn execute_clipboard_copy(_text: &str) -> Result<(), ActionError> {
    Err(ActionError::FeatureDisabled("clipboard_copy"))
}

#[cfg(feature = "keys")]
fn execute_text_insert(text: &str) -> Result<(), ActionError> {
    clipboard::insert_text(text)
}

#[cfg(not(feature = "keys"))]
fn execute_text_insert(_text: &str) -> Result<(), ActionError> {
    Err(ActionError::FeatureDisabled("text_insert"))
}

#[cfg(feature = "keys")]
fn execute_mouse_click(
    x: i32,
    y: i32,
    button: crate::protocol::messages::MouseButton,
    relative: bool,
) -> Result<(), ActionError> {
    mouse::click(x, y, button, relative)
}

#[cfg(not(feature = "keys"))]
fn execute_mouse_click(
    _x: i32,
    _y: i32,
    _button: crate::protocol::messages::MouseButton,
    _relative: bool,
) -> Result<(), ActionError> {
    Err(ActionError::FeatureDisabled("mouse_click"))
}

/// 플러그인 액션 실행 — M4 cron #14.
///
/// 흐름:
/// 1. 설치된 플러그인 목록 조회 (`plugins::list_installed`)
/// 2. `plugin_uuid` (package_id) 매칭
/// 3. `payload.action_id` 로 manifest 액션 lookup
/// 4. manifest 액션의 `action_type` + 사용자 payload (`payload.payload`) 로 빌트인 ActionPayload 재구성
/// 5. 무한 재귀 방지: 내부 action_type == "plugin_action" 거부
/// 6. `Box::pin(execute(...))` 로 async 재귀 호출
async fn execute_plugin_action(
    plugin_uuid: &str,
    payload: &serde_json::Value,
) -> Result<(), ActionError> {
    let installed = crate::plugins::list_installed()
        .map_err(|e| ActionError::OsCommand(format!("플러그인 목록 조회: {e}")))?;

    let plugin = installed
        .iter()
        .find(|p| p.package_id == plugin_uuid)
        .ok_or_else(|| ActionError::OsCommand(format!("플러그인 미설치: {plugin_uuid}")))?;

    // action_id 미명시 시 첫 액션 fallback (M5 cron #15 호환) + 경고 로그
    let action_id_opt = payload.get("action_id").and_then(|v| v.as_str());
    let action = match action_id_opt {
        Some(id) => plugin
            .actions
            .iter()
            .find(|a| a.id == id)
            .ok_or_else(|| ActionError::OsCommand(format!("액션 미발견: {plugin_uuid}/{id}")))?,
        None => {
            tracing::warn!(
                %plugin_uuid,
                "plugin_action.action_id 미명시 — 첫 액션 fallback (모바일 PWA 구버전 호환)"
            );
            plugin.actions.first().ok_or_else(|| {
                ActionError::OsCommand(format!("플러그인 {plugin_uuid} 에 액션이 없음"))
            })?
        }
    };
    let action_id = action.id.as_str();

    // 무한 재귀 방지 — plugin_action 안 plugin_action 금지
    if action.action_type == "plugin_action" {
        return Err(ActionError::OsCommand(
            "plugin_action 중첩 호출 금지".into(),
        ));
    }

    // 사용자 payload (없으면 manifest default_payload 사용) + action_type 합쳐 재구성
    let inner = payload
        .get("payload")
        .cloned()
        .unwrap_or_else(|| action.default_payload.clone());

    let mut merged_map = match inner {
        serde_json::Value::Object(m) => m,
        _ => serde_json::Map::new(),
    };
    merged_map.insert(
        "action_type".into(),
        serde_json::Value::String(action.action_type.clone()),
    );
    let merged = serde_json::Value::Object(merged_map);

    let inner_payload: ActionPayload = serde_json::from_value(merged).map_err(|e| {
        ActionError::OsCommand(format!(
            "{plugin_uuid}/{action_id} payload 변환 실패: {e}"
        ))
    })?;

    // async 재귀 — Box::pin 으로 future size 명시
    Box::pin(execute(&inner_payload)).await.map(|_| ())
}
