//! 마우스 클릭 액션 (M3 cron #10) — Tier 2, `keys` feature
//!
//! enigo 0.2 의 `Mouse` trait + `Coordinate::Abs/Rel` 사용.
//! relative=true 면 현재 커서 위치 기준 (x,y) 이동, false 면 화면 절대 좌표.
//!
//! `guard::validate_mouse_click` 가 좌표 범위(-1000~16000) 사전 검증.

use enigo::{Button, Coordinate, Direction, Enigo, Mouse, Settings};

use super::ActionError;
use crate::protocol::messages::MouseButton;

pub fn click(x: i32, y: i32, button: MouseButton, relative: bool) -> Result<(), ActionError> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| ActionError::OsCommand(format!("enigo init: {e}")))?;

    let coord = if relative {
        Coordinate::Rel
    } else {
        Coordinate::Abs
    };
    enigo
        .move_mouse(x, y, coord)
        .map_err(|e| ActionError::OsCommand(format!("move_mouse({x},{y}): {e}")))?;

    let btn = match button {
        MouseButton::Left => Button::Left,
        MouseButton::Right => Button::Right,
        MouseButton::Middle => Button::Middle,
    };
    enigo
        .button(btn, Direction::Click)
        .map_err(|e| ActionError::OsCommand(format!("button click: {e}")))?;

    Ok(())
}
