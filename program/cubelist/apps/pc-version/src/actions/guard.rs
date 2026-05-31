//! 액션 실행 전 정적 검증 — 클라이언트가 보낸 ActionPayload를 헬퍼가 한 번 더 검사
//!
//! 정착본: tech-review.md §6 — 플러그인 4중 방어 중 두 번째 (action_type 화이트리스트)
//!
//! 보안 모델
//! - Supabase RLS + trigger가 1차 검증 (mylist_items 저장 시)
//! - 클라이언트가 직접 ActionPayload를 동봉해서 보내므로 헬퍼도 한 번 더 검증 (Defense in Depth)
//! - 위험 키워드 / http:// URL / 외부 도메인은 차단·경고

use crate::plugins::{static_scan::StaticScanFinding};
use crate::protocol::{ActionPayload, MacroStepDto};
use super::ActionError;

const MAX_MACRO_STEPS: usize = 50;
const MAX_DELAY_MS: u32 = 5_000;
const MAX_LABEL_LEN: usize = 256;

/// 액션 실행 전 정적 검사. Err면 거부.
///
/// M3 cron #7: 7종 추가 검증. 신규 variant 는 길이·범위 기본 검증.
pub fn validate(payload: &ActionPayload) -> Result<(), ActionError> {
    match payload {
        ActionPayload::Link { url } => validate_link(url),
        ActionPayload::Shortcut { keys } => validate_shortcut(keys),
        ActionPayload::Macro { steps } => validate_macro(steps),
        ActionPayload::Folder { cube_ids } => validate_folder(cube_ids),
        ActionPayload::TextInsert { text } => validate_text(text),
        ActionPayload::ClipboardCopy { text } => validate_text(text),
        ActionPayload::AppLaunch { path, args } => validate_app_launch(path, args),
        ActionPayload::FocusWindow { title_pattern } => validate_focus_window(title_pattern),
        ActionPayload::MouseClick { x, y, .. } => validate_mouse_click(*x, *y),
        ActionPayload::PluginAction { plugin_uuid, payload } => {
            validate_plugin_action(plugin_uuid, payload)
        }
        // === P1 11 신규 액션 (Phase 3) ===
        ActionPayload::MediaKey { key } => validate_media_key(key),
        ActionPayload::PageNavigate { direction } => validate_direction(direction),
        ActionPayload::PageJump { .. } => Ok(()),
        ActionPayload::FolderUp => Ok(()),
        ActionPayload::FolderOpen { folder_id } => {
            if folder_id.is_empty() || folder_id.len() > MAX_LABEL_LEN {
                Err(ActionError::OsCommand("folder_id 길이 무효".into()))
            } else {
                Ok(())
            }
        }
        ActionPayload::WindowClose => Ok(()),
        ActionPayload::SystemSleep => Ok(()),
        ActionPayload::SystemActionbarToggle => Ok(()),
        ActionPayload::HotkeyToggle { on_keys, off_keys } => {
            if on_keys.is_empty() || off_keys.is_empty() {
                Err(ActionError::OsCommand("on/off_keys 필수".into()))
            } else {
                validate_shortcut(on_keys).and_then(|_| validate_shortcut(off_keys))
            }
        }
        ActionPayload::AudioPlay { audio_url, volume, .. } => {
            if audio_url.is_empty() || audio_url.len() > 4096 {
                return Err(ActionError::OsCommand("audio_url 길이 무효".into()));
            }
            if !(0.0..=1.0).contains(volume) {
                return Err(ActionError::OsCommand("volume 0.0~1.0 범위".into()));
            }
            Ok(())
        }
        ActionPayload::ProfileRotate { direction } => validate_direction(direction),
        // === P2 4 동적 큐브 — frontend tick 처리 = Rust 단순 통과 ===
        ActionPayload::LiveClock { .. } => Ok(()),
        ActionPayload::LiveTimer { .. } => Ok(()),
        ActionPayload::LiveGauge { min, max, .. } => {
            if min >= max {
                Err(ActionError::OsCommand("min < max 필수".into()))
            } else {
                Ok(())
            }
        }
        ActionPayload::LiveBattery { .. } => Ok(()),
    }
}

fn validate_media_key(key: &str) -> Result<(), ActionError> {
    let allowed = [
        "play_pause", "next", "prev", "stop", "volume_up", "volume_down", "mute",
    ];
    if allowed.contains(&key) {
        Ok(())
    } else {
        Err(ActionError::OsCommand(format!("미디어 키 무효: {key}")))
    }
}

fn validate_direction(direction: &str) -> Result<(), ActionError> {
    if direction == "next" || direction == "prev" {
        Ok(())
    } else {
        Err(ActionError::OsCommand(format!("direction 무효: {direction}")))
    }
}

const MAX_TEXT_LEN: usize = 16_384;
const MAX_FOLDER_CUBES: usize = 256;
const MAX_PLUGIN_PAYLOAD_BYTES: usize = 65_536;

fn validate_folder(cube_ids: &[String]) -> Result<(), ActionError> {
    if cube_ids.len() > MAX_FOLDER_CUBES {
        return Err(ActionError::OsCommand(format!(
            "folder cube_ids too many ({}, max {MAX_FOLDER_CUBES})",
            cube_ids.len()
        )));
    }
    for id in cube_ids {
        if id.is_empty() || id.len() > 128 {
            return Err(ActionError::OsCommand("folder cube_id invalid".into()));
        }
    }
    Ok(())
}

fn validate_text(text: &str) -> Result<(), ActionError> {
    if text.len() > MAX_TEXT_LEN {
        return Err(ActionError::OsCommand(format!(
            "text too long ({}, max {MAX_TEXT_LEN})",
            text.len()
        )));
    }
    Ok(())
}

fn validate_app_launch(path: &str, args: &[String]) -> Result<(), ActionError> {
    if path.is_empty() || path.len() > 1024 {
        return Err(ActionError::OsCommand("app_launch path invalid".into()));
    }
    let lower = path.to_ascii_lowercase();
    for danger in &[
        "cmd.exe",
        "powershell",
        "wscript",
        "cscript",
        "/bin/sh",
        "/bin/bash",
        "rundll32",
        "regsvr32",
        "mshta",
    ] {
        if lower.contains(danger) {
            return Err(ActionError::PermissionRequired(3));
        }
    }
    let total_args: usize = args.iter().map(|s| s.len()).sum();
    if total_args > 4096 || args.len() > 32 {
        return Err(ActionError::OsCommand("app_launch args too large".into()));
    }
    Ok(())
}

fn validate_focus_window(pattern: &str) -> Result<(), ActionError> {
    if pattern.is_empty() || pattern.len() > MAX_LABEL_LEN {
        return Err(ActionError::OsCommand("focus_window pattern invalid".into()));
    }
    Ok(())
}

fn validate_mouse_click(x: i32, y: i32) -> Result<(), ActionError> {
    if !(-1_000..=16_000).contains(&x) || !(-1_000..=16_000).contains(&y) {
        return Err(ActionError::OsCommand(format!(
            "mouse_click coords out of range: ({x}, {y})"
        )));
    }
    Ok(())
}

fn validate_plugin_action(uuid: &str, payload: &serde_json::Value) -> Result<(), ActionError> {
    if uuid.is_empty() || uuid.len() > 256 {
        return Err(ActionError::OsCommand("plugin_uuid invalid".into()));
    }
    let bytes = serde_json::to_vec(payload).map_err(|e| ActionError::OsCommand(e.to_string()))?;
    if bytes.len() > MAX_PLUGIN_PAYLOAD_BYTES {
        return Err(ActionError::OsCommand(format!(
            "plugin payload too large ({}, max {MAX_PLUGIN_PAYLOAD_BYTES})",
            bytes.len()
        )));
    }
    Ok(())
}

fn validate_link(url: &str) -> Result<(), ActionError> {
    if url.len() > 2048 {
        return Err(ActionError::OsCommand("link url too long".into()));
    }
    let lower = url.to_ascii_lowercase();
    if !lower.starts_with("http://") && !lower.starts_with("https://") {
        return Err(ActionError::UnsafeScheme(url.into()));
    }
    // 위험 키워드 차단
    for kw in &["javascript:", "data:", "file:", "vbscript:"] {
        if lower.contains(kw) {
            return Err(ActionError::UnsafeScheme(format!("contains {kw}")));
        }
    }
    Ok(())
}

fn validate_shortcut(keys: &[String]) -> Result<(), ActionError> {
    if keys.is_empty() {
        return Err(ActionError::OsCommand("shortcut needs at least 1 key".into()));
    }
    if keys.len() > 6 {
        return Err(ActionError::OsCommand("shortcut max 6 keys".into()));
    }
    for k in keys {
        if k.len() > 32 || k.chars().any(|c| c.is_control()) {
            return Err(ActionError::OsCommand(format!("invalid key: {k}")));
        }
    }
    Ok(())
}

fn validate_macro(steps: &[MacroStepDto]) -> Result<(), ActionError> {
    if steps.len() > MAX_MACRO_STEPS {
        return Err(ActionError::OsCommand(format!(
            "macro exceeds max steps ({} > {MAX_MACRO_STEPS})",
            steps.len()
        )));
    }
    for (idx, step) in steps.iter().enumerate() {
        validate_macro_step(idx, step)?;
    }
    Ok(())
}

fn validate_macro_step(idx: usize, step: &MacroStepDto) -> Result<(), ActionError> {
    match step {
        MacroStepDto::Key { keys } => validate_shortcut(keys)?,
        MacroStepDto::Click { x, y, .. } => {
            // 좌표 범위 — 4K 이상 모니터는 점점 보편적이지만 음수·8K 초과는 거부
            if *x < -1000 || *x > 16_000 || *y < -1000 || *y > 16_000 {
                return Err(ActionError::OsCommand(format!(
                    "click coords out of range at step {idx}: ({x}, {y})"
                )));
            }
        }
        MacroStepDto::Delay { ms } => {
            if *ms > MAX_DELAY_MS {
                return Err(ActionError::OsCommand(format!(
                    "delay too long at step {idx}: {ms}ms > {MAX_DELAY_MS}"
                )));
            }
        }
        MacroStepDto::LaunchApp { path, args } => {
            if path.is_empty() || path.len() > 1024 {
                return Err(ActionError::OsCommand(format!(
                    "invalid launch path at step {idx}"
                )));
            }
            // 위험 경로 차단 (시스템 디렉토리, 셸)
            let lower = path.to_ascii_lowercase();
            for danger in &[
                "cmd.exe",
                "powershell",
                "wscript",
                "cscript",
                "/bin/sh",
                "/bin/bash",
                "rundll32",
                "regsvr32",
                "mshta",
            ] {
                if lower.contains(danger) {
                    return Err(ActionError::PermissionRequired(3));
                }
            }
            // args 크기 제한
            let total_args: usize = args.iter().map(|s| s.len()).sum();
            if total_args > 4096 || args.len() > 32 {
                return Err(ActionError::OsCommand(format!(
                    "launch args too large at step {idx}"
                )));
            }
        }
        MacroStepDto::FocusWindow { title_pattern } => {
            if title_pattern.is_empty() || title_pattern.len() > MAX_LABEL_LEN {
                return Err(ActionError::OsCommand(format!(
                    "invalid focus pattern at step {idx}"
                )));
            }
        }
    }
    Ok(())
}

/// findings 중에서 차단해야 할 항목만 추출 (경고는 로그만)
pub fn blocking_findings(findings: &[StaticScanFinding]) -> Vec<&StaticScanFinding> {
    findings
        .iter()
        .filter(|f| {
            matches!(
                f,
                StaticScanFinding::DangerousKeyword { .. } | StaticScanFinding::HttpScheme { .. }
            )
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn link_rejects_javascript() {
        let err = validate_link("javascript:alert(1)").unwrap_err();
        matches!(err, ActionError::UnsafeScheme(_));
    }

    #[test]
    fn link_accepts_https() {
        validate_link("https://example.com").unwrap();
    }

    #[test]
    fn shortcut_rejects_empty() {
        let err = validate_shortcut(&[]).unwrap_err();
        matches!(err, ActionError::OsCommand(_));
    }

    #[test]
    fn shortcut_accepts_normal_combo() {
        validate_shortcut(&["ctrl".into(), "c".into()]).unwrap();
    }

    #[test]
    fn macro_rejects_too_many_steps() {
        let steps: Vec<MacroStepDto> = (0..51)
            .map(|_| MacroStepDto::Delay { ms: 10 })
            .collect();
        let err = validate_macro(&steps).unwrap_err();
        matches!(err, ActionError::OsCommand(_));
    }

    #[test]
    fn launch_app_rejects_powershell() {
        let step = MacroStepDto::LaunchApp {
            path: "C:\\Windows\\System32\\powershell.exe".into(),
            args: vec![],
        };
        let err = validate_macro_step(0, &step).unwrap_err();
        matches!(err, ActionError::PermissionRequired(3));
    }
}
