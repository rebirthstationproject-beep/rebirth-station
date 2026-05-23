//! 전역 단축키 매핑.
//!
//! 회사: 리버스 스테이션 (Rebirth Station)
//! 정착본: docs/hotkey-spec.md
//!
//! 흐름
//! 1. 사용자가 `$HOME/.cubelist/hotkeys.json` 작성 (또는 향후 GUI 편집)
//! 2. 헬퍼 기동 시 본 파일 로드 → tauri-plugin-global-shortcut으로 등록
//! 3. 단축키 발동 시 매핑된 `ActionPayload` 를 `actions::execute` 로 직접 실행
//!
//! 보안
//! - 매핑 파일에 위험 키워드 발견 시 거부 (`actions::guard::validate` 사용)
//! - `actions::execute` 가 호출 전 한 번 더 정적 검증
//! - 매핑은 사용자 명시 설정만 — 외부에서 푸시 X

use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::actions::{self, ActionError};
use crate::protocol::ActionPayload;

#[derive(Debug, Error)]
pub enum HotkeyError {
    #[error("hotkeys file not found at {0}")]
    NotFound(PathBuf),

    #[error("invalid hotkey shortcut: {0}")]
    InvalidShortcut(String),

    #[error("invalid action: {0}")]
    InvalidAction(String),

    #[error("io error: {0}")]
    Io(#[from] std::io::Error),

    #[error("parse error: {0}")]
    Parse(#[from] serde_json::Error),

    #[error("action execution failed: {0}")]
    Execution(#[from] ActionError),
}

/// 매핑 파일 한 항목.
///
/// ```json
/// {
///   "shortcut": "ctrl+alt+1",
///   "label": "OBS 녹화 시작",
///   "action": { "action_type": "shortcut", "keys": ["f9"] }
/// }
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeyBinding {
    pub shortcut: String,
    pub label: Option<String>,
    pub action: ActionPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HotkeyConfig {
    #[serde(default = "default_version")]
    pub rbs_format_version: u8,
    #[serde(default)]
    pub bindings: Vec<HotkeyBinding>,
}

fn default_version() -> u8 {
    1
}

/// `$HOME/.cubelist/hotkeys.json` 경로.
pub fn config_path() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".cubelist").join("hotkeys.json"))
}

/// 매핑 파일 로드. 파일 없으면 빈 config 반환 (오류 X).
pub fn load() -> Result<HotkeyConfig, HotkeyError> {
    let Some(path) = config_path() else {
        return Ok(HotkeyConfig::default());
    };

    if !path.exists() {
        return Ok(HotkeyConfig::default());
    }

    let text = fs::read_to_string(&path)?;
    let cfg: HotkeyConfig = serde_json::from_str(&text)?;
    Ok(cfg)
}

/// 핫키 발동 시 매핑된 액션 실행.
pub async fn dispatch(binding: &HotkeyBinding) -> Result<(), HotkeyError> {
    // actions::execute가 내부 guard::validate로 한 번 더 검증
    actions::execute(&binding.action).await?;
    Ok(())
}

/// 핫키 표기 정규화 — Tauri global shortcut 호환 형식으로 변환.
///
/// 입력 예: "ctrl+alt+1" / "ctrl+shift+f9"
/// 출력: "CommandOrControl+Alt+1" 등
///
/// Stage 1 범위: ctrl/shift/alt/win/cmd + 문자·숫자·F1~F12 화이트리스트.
pub fn normalize_shortcut(input: &str) -> Result<String, HotkeyError> {
    let parts: Vec<&str> = input.split('+').map(|p| p.trim()).collect();
    if parts.is_empty() {
        return Err(HotkeyError::InvalidShortcut(input.into()));
    }

    let mut out: Vec<String> = Vec::new();
    let mut has_main = false;

    for raw in parts {
        let lower = raw.to_ascii_lowercase();
        match lower.as_str() {
            "ctrl" | "control" => out.push("CommandOrControl".into()),
            "shift" => out.push("Shift".into()),
            "alt" | "option" => out.push("Alt".into()),
            "win" | "windows" | "meta" | "super" | "cmd" => out.push("Meta".into()),
            other if is_valid_main_key(other) => {
                out.push(format_main_key(other));
                has_main = true;
            }
            _ => return Err(HotkeyError::InvalidShortcut(input.into())),
        }
    }

    if !has_main {
        return Err(HotkeyError::InvalidShortcut(format!(
            "no main key in `{input}`"
        )));
    }

    Ok(out.join("+"))
}

fn is_valid_main_key(s: &str) -> bool {
    if s.chars().count() == 1 {
        let c = s.chars().next().unwrap();
        return c.is_ascii_alphanumeric();
    }
    matches!(
        s,
        "f1" | "f2"
            | "f3"
            | "f4"
            | "f5"
            | "f6"
            | "f7"
            | "f8"
            | "f9"
            | "f10"
            | "f11"
            | "f12"
            | "tab"
            | "enter"
            | "escape"
            | "space"
            | "home"
            | "end"
            | "up"
            | "down"
            | "left"
            | "right"
            | "pageup"
            | "pagedown"
            | "delete"
            | "backspace"
    )
}

fn format_main_key(s: &str) -> String {
    // Tauri는 알파벳/F키 대문자, 숫자 그대로
    if s.starts_with('f') && s.len() <= 3 && s[1..].chars().all(|c| c.is_ascii_digit()) {
        // F1~F12
        s.to_ascii_uppercase()
    } else if s.chars().count() == 1 {
        s.to_ascii_uppercase()
    } else {
        // tab/enter/escape 등 첫 글자 대문자
        let mut chars = s.chars();
        match chars.next() {
            Some(first) => first.to_ascii_uppercase().to_string() + chars.as_str(),
            None => s.into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_basic() {
        assert_eq!(
            normalize_shortcut("ctrl+alt+1").unwrap(),
            "CommandOrControl+Alt+1",
        );
        assert_eq!(
            normalize_shortcut("ctrl+shift+f9").unwrap(),
            "CommandOrControl+Shift+F9",
        );
    }

    #[test]
    fn rejects_no_main_key() {
        let err = normalize_shortcut("ctrl+shift").unwrap_err();
        matches!(err, HotkeyError::InvalidShortcut(_));
    }

    #[test]
    fn rejects_unknown_key() {
        let err = normalize_shortcut("ctrl+한글").unwrap_err();
        matches!(err, HotkeyError::InvalidShortcut(_));
    }

    #[test]
    fn parses_config_with_bindings() {
        let json = r#"{
            "rbs_format_version": 1,
            "bindings": [
                {
                    "shortcut": "ctrl+alt+1",
                    "label": "OBS 녹화",
                    "action": { "action_type": "shortcut", "keys": ["f9"] }
                }
            ]
        }"#;
        let cfg: HotkeyConfig = serde_json::from_str(json).unwrap();
        assert_eq!(cfg.bindings.len(), 1);
        assert_eq!(cfg.bindings[0].shortcut, "ctrl+alt+1");
    }
}
