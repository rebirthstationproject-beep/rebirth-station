//! 앱 실행 액션 (M3 cron #9) — Tier 2 (사용자 동의 prompt 후 활성)
//!
//! `guard::validate_app_launch` 가 사전 검증 (위험 경로 차단, args 크기).
//! 본 모듈은 검증 통과 후 실 실행만 담당.
//!
//! 비동기 spawn — 헬퍼는 launch 만 트리거, 자식 프로세스 출력은 무시 (분리 실행).

use std::process::{Command, Stdio};

use super::ActionError;

pub fn launch(path: &str, args: &[String]) -> Result<(), ActionError> {
    Command::new(path)
        .args(args)
        // 콘솔/stdio 분리 — 부모(헬퍼) 트레이 미니창과 격리
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| ActionError::OsCommand(format!("spawn `{path}`: {e}")))?;
    Ok(())
}
