//! 클립보드 + 텍스트 입력 액션 (M3 cron #9)
//!
//! Tier 1 — 사용자 동의 없이 즉시 가능 (단, OS 보안 다이얼로그는 OS 가 자체 처리).
//!
//! - `set_clipboard(text)`: 클립보드에 텍스트 설정 (ClipboardCopy 액션)
//! - `insert_text(text)`: 클립보드 설정 → 짧은 sleep → Ctrl+V 전송 (TextInsert 액션)
//!
//! Karpathy 원칙: 한글/이모지 직접 입력은 enigo.text() 가 OS 별로 불안정 →
//! 클립보드 우회 방식 사용 (StreamDeck "Paste Text" 액션과 동일 전략).

use super::ActionError;

/// 클립보드에 텍스트 복사 — 입력 X (Tier 1).
pub fn set_clipboard(text: &str) -> Result<(), ActionError> {
    let mut cb = arboard::Clipboard::new().map_err(|e| ActionError::OsCommand(e.to_string()))?;
    cb.set_text(text.to_string())
        .map_err(|e| ActionError::OsCommand(e.to_string()))?;
    Ok(())
}

/// 텍스트 입력 — 클립보드 우회 + Ctrl+V (한글/이모지 안전).
///
/// 부작용: 기존 클립보드 내용을 덮어씀. 호출자가 필요 시 사전 백업.
pub fn insert_text(text: &str) -> Result<(), ActionError> {
    use enigo::{Direction, Enigo, Key, Keyboard, Settings};

    set_clipboard(text)?;

    // 일부 앱이 클립보드 변경 이벤트를 처리하기 전 paste 가 도착하면 빈 입력이 됨 → 짧은 지연.
    std::thread::sleep(std::time::Duration::from_millis(30));

    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| ActionError::OsCommand(format!("enigo init: {e}")))?;
    enigo
        .key(Key::Control, Direction::Press)
        .map_err(|e| ActionError::OsCommand(format!("ctrl press: {e}")))?;
    enigo
        .key(Key::Unicode('v'), Direction::Click)
        .map_err(|e| ActionError::OsCommand(format!("v click: {e}")))?;
    enigo
        .key(Key::Control, Direction::Release)
        .map_err(|e| ActionError::OsCommand(format!("ctrl release: {e}")))?;

    Ok(())
}
