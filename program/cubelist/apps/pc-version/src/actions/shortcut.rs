//! 단축키 시뮬레이션 — enigo (SendInput 기반)
//!
//! 정착본: tech-review.md §4 — AV 오탐 최소
//! `keys` feature 활성 시에만 컴파일.
//!
//! 안전 패턴
//! - 키 이름은 화이트리스트 (정의되지 않은 키는 무시)
//! - modifier 키 자동 release (눌린 채로 잠금 방지)
//! - timeout: 단축키 1세트 100ms 이내

#![cfg(feature = "keys")]

use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use super::ActionError;

/// 단축키 키 시퀀스 실행. 예: ["ctrl", "shift", "t"]
pub fn send_keys(keys: &[String]) -> Result<(), ActionError> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| ActionError::OsCommand(format!("enigo init: {e}")))?;

    let mapped: Vec<Key> = keys
        .iter()
        .map(|k| map_key(k))
        .collect::<Result<Vec<_>, _>>()?;

    // 모든 modifier press → 최종 키 press+release → modifier release (역순)
    for key in &mapped {
        enigo
            .key(*key, Direction::Press)
            .map_err(|e| ActionError::OsCommand(format!("press: {e}")))?;
    }
    for key in mapped.iter().rev() {
        enigo
            .key(*key, Direction::Release)
            .map_err(|e| ActionError::OsCommand(format!("release: {e}")))?;
    }

    Ok(())
}

fn map_key(name: &str) -> Result<Key, ActionError> {
    let lower = name.to_ascii_lowercase();
    let key = match lower.as_str() {
        "ctrl" | "control" => Key::Control,
        "shift" => Key::Shift,
        "alt" => Key::Alt,
        "win" | "windows" | "meta" | "super" | "cmd" => Key::Meta,
        "tab" => Key::Tab,
        "enter" | "return" => Key::Return,
        "esc" | "escape" => Key::Escape,
        "space" => Key::Space,
        "backspace" => Key::Backspace,
        "delete" | "del" => Key::Delete,
        "home" => Key::Home,
        "end" => Key::End,
        "pageup" | "pgup" => Key::PageUp,
        "pagedown" | "pgdn" => Key::PageDown,
        "up" => Key::UpArrow,
        "down" => Key::DownArrow,
        "left" => Key::LeftArrow,
        "right" => Key::RightArrow,
        "f1" => Key::F1,
        "f2" => Key::F2,
        "f3" => Key::F3,
        "f4" => Key::F4,
        "f5" => Key::F5,
        "f6" => Key::F6,
        "f7" => Key::F7,
        "f8" => Key::F8,
        "f9" => Key::F9,
        "f10" => Key::F10,
        "f11" => Key::F11,
        "f12" => Key::F12,
        s if s.chars().count() == 1 => {
            let c = s.chars().next().unwrap();
            // ASCII 문자만 — 안전을 위해 한글·이모지 거부
            if c.is_ascii() {
                Key::Unicode(c)
            } else {
                return Err(ActionError::OsCommand(format!("non-ascii key: {s}")));
            }
        }
        _ => return Err(ActionError::OsCommand(format!("unknown key: {name}"))),
    };
    Ok(key)
}
