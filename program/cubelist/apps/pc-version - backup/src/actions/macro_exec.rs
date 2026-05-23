//! 매크로 실행 — `MacroStepDto` 시퀀스를 순차 실행
//!
//! 정착본: tech-review.md §4, §6
//!
//! 안전 패턴
//! - steps 최대 50 (DB CHECK는 20이지만 client-side 추가 여유)
//! - 총 실행 30초 타임아웃
//! - 루프 검출 없음 (steps는 평면 시퀀스, 재귀 없음)
//! - LaunchApp 경로 화이트리스트 검증
//! - Tier 2 step은 permissions::GrantedPermissions 확인

#![cfg(feature = "keys")]

use std::time::Duration;
use tokio::time::timeout;
use tracing::warn;

use super::ActionError;
use crate::protocol::{MacroStepDto, MouseButton};

const MAX_STEPS: usize = 50;
const MACRO_TIMEOUT_SECS: u64 = 30;

/// 매크로 실행 진입점
pub async fn run_macro(steps: &[MacroStepDto]) -> Result<(), ActionError> {
    if steps.len() > MAX_STEPS {
        return Err(ActionError::OsCommand(format!(
            "macro exceeds max steps ({} > {})",
            steps.len(),
            MAX_STEPS
        )));
    }

    let exec = run_macro_inner(steps);
    match timeout(Duration::from_secs(MACRO_TIMEOUT_SECS), exec).await {
        Ok(r) => r,
        Err(_) => Err(ActionError::OsCommand("macro timeout (30s)".into())),
    }
}

async fn run_macro_inner(steps: &[MacroStepDto]) -> Result<(), ActionError> {
    for (idx, step) in steps.iter().enumerate() {
        run_step(idx, step).await?;
    }
    Ok(())
}

async fn run_step(idx: usize, step: &MacroStepDto) -> Result<(), ActionError> {
    match step {
        MacroStepDto::Key { keys } => {
            super::shortcut::send_keys(keys)?;
        }
        MacroStepDto::Click { x, y, button } => {
            send_click(*x, *y, *button)?;
        }
        MacroStepDto::Delay { ms } => {
            // 안전한 상한 (5초 이상 딜레이는 거부 — 사용자 입장에서 의도 불명)
            if *ms > 5000 {
                return Err(ActionError::OsCommand(format!(
                    "delay too long at step {idx}: {ms}ms"
                )));
            }
            tokio::time::sleep(Duration::from_millis(*ms as u64)).await;
        }
        MacroStepDto::LaunchApp { path, args: _ } => {
            // Tier 2 — 현재 stub. 실제 구현은 GrantedPermissions 조회 필요
            warn!(idx, %path, "LaunchApp Tier 2 — 권한 확인 미구현, 거부");
            return Err(ActionError::PermissionRequired(2));
        }
        MacroStepDto::FocusWindow { title_pattern: _ } => {
            // Tier 2 — Windows EnumWindows + FindWindow 또는 Active Accessibility
            warn!(idx, "FocusWindow Tier 2 — 미구현, 거부");
            return Err(ActionError::PermissionRequired(2));
        }
    }
    Ok(())
}

fn send_click(x: i32, y: i32, button: MouseButton) -> Result<(), ActionError> {
    use enigo::{Button, Coordinate, Direction, Enigo, Mouse, Settings};

    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| ActionError::OsCommand(format!("enigo init: {e}")))?;

    let btn = match button {
        MouseButton::Left => Button::Left,
        MouseButton::Right => Button::Right,
        MouseButton::Middle => Button::Middle,
    };

    enigo
        .move_mouse(x, y, Coordinate::Abs)
        .map_err(|e| ActionError::OsCommand(format!("move: {e}")))?;
    enigo
        .button(btn, Direction::Click)
        .map_err(|e| ActionError::OsCommand(format!("click: {e}")))?;

    Ok(())
}
