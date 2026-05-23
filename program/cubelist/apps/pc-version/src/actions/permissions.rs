//! 3-tier 권한 시스템
//!
//! 정착본: tech-review.md §6 (Security)
//!
//! Tier 1 (기본 허용): 텍스트 입력, 클립보드, UI 클릭 — 자동
//! Tier 2 (1회 동의 prompt): 파일 시스템, 외부 앱 launch, 전역 단축키
//! Tier 3 (영구 명시 토글): 셸 명령, 레지스트리, 네트워크 소켓 — 기본 비활성

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Tier {
    /// 기본 허용 — 자동
    One,
    /// 1회 동의 prompt 후 메모리에서 그랜트 유지
    Two,
    /// 영구 명시 토글, 기본 비활성
    Three,
}

impl Tier {
    pub fn as_u8(self) -> u8 {
        match self {
            Tier::One => 1,
            Tier::Two => 2,
            Tier::Three => 3,
        }
    }
}

/// 매크로 step의 권한 등급 결정 (정착본 §6 분류)
pub fn tier_for_macro_step(step: &crate::protocol::MacroStepDto) -> Tier {
    use crate::protocol::MacroStepDto::*;
    match step {
        // Tier 1: 키 입력, 클릭, 딜레이
        Key { .. } | Click { .. } | Delay { .. } => Tier::One,
        // Tier 2: 외부 앱 실행, 윈도우 포커스
        LaunchApp { .. } | FocusWindow { .. } => Tier::Two,
    }
}

/// 현재 세션에서 부여된 권한 (메모리 보관 — 헬퍼 재시작 시 초기화)
#[derive(Debug, Default)]
pub struct GrantedPermissions {
    pub tier_two_apps: Vec<String>,    // LaunchApp으로 허용된 경로 화이트리스트
    pub tier_three_active: bool,        // Tier 3 마스터 토글
}

impl GrantedPermissions {
    pub fn allows_launch(&self, path: &str) -> bool {
        self.tier_two_apps.iter().any(|allowed| path.starts_with(allowed))
    }
}
