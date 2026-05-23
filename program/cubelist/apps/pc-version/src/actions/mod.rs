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

#[cfg(feature = "keys")]
pub mod shortcut;

#[cfg(feature = "keys")]
pub mod macro_exec;

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
        // M3 cron #7 신규 — 실 OS 호출은 cron #8 채움
        ActionPayload::Folder { .. } => {
            // 폴더 진입은 UI 측 처리 — 헬퍼는 no-op
        }
        ActionPayload::TextInsert { .. } => {
            return Err(ActionError::FeatureDisabled("text_insert (impl pending)"));
        }
        ActionPayload::ClipboardCopy { .. } => {
            return Err(ActionError::FeatureDisabled("clipboard_copy (impl pending)"));
        }
        ActionPayload::AppLaunch { .. } => {
            return Err(ActionError::PermissionRequired(2));
        }
        ActionPayload::FocusWindow { .. } => {
            return Err(ActionError::FeatureDisabled("focus_window (impl pending)"));
        }
        ActionPayload::MouseClick { .. } => {
            return Err(ActionError::PermissionRequired(2));
        }
        ActionPayload::PluginAction { .. } => {
            return Err(ActionError::PermissionRequired(3));
        }
    }

    Ok(ExecutionResult {
        elapsed_ms: started.elapsed().as_millis() as u32,
    })
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
