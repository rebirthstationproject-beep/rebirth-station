//! 플러그인 manifest 구조 + 파싱
//!
//! manifest는 JSON 형식. DB `mylist_plugins.manifest`에 저장 + 별도 `manifest_signature`.
//!
//! 예시:
//! ```json
//! {
//!   "package_id": "kr.rebirthstation.calculator",
//!   "name": "계산기",
//!   "version": "1.0.0",
//!   "actions": [
//!     { "id": "open", "action_type": "link", "default_payload": {"url": "https://calc.app"} }
//!   ],
//!   "requested_permissions": ["tier_1"]
//! }
//! ```

use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ManifestError {
    #[error("malformed json: {0}")]
    MalformedJson(String),

    #[error("invalid package_id: {0}")]
    InvalidPackageId(String),

    #[error("invalid version: {0}")]
    InvalidVersion(String),

    #[error("unsupported action_type: {0}")]
    UnsupportedActionType(String),

    #[error("too many actions ({0} > 100)")]
    TooManyActions(usize),
}

/// 플러그인 manifest 본체
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub package_id: String,
    pub name: String,
    pub version: String,
    pub author: Option<String>,
    pub description: Option<String>,
    pub actions: Vec<ManifestAction>,
    pub requested_permissions: Vec<RequestedPermission>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestAction {
    pub id: String,
    pub label: String,
    /// 10 enum 화이트리스트 — frontend `src/lib/actions/index.ts` 와 1:1
    pub action_type: String,
    pub default_payload: serde_json::Value,
    /// 인스펙터 동적 폼 (M3 FieldSchema) — frontend 가 직접 렌더 (M4 cron #12+)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub schema: Option<serde_json::Value>,
    /// 짧은 설명 (인스펙터 hint)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Tier 1/2/3 — 미지정 시 manifest.requested_permissions 의 최댓값 적용
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tier: Option<u8>,
    /// 아이콘 ZIP 내부 경로 (예: "icons/open.png")
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon_ref: Option<String>,
    /// 사이드바 카테고리 — frontend `ActionCategory` 와 동기 (M6 cron #18)
    /// 한글 표기: 생산성·미디어·개발·디자인·게이밍·시스템·웹
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
}

/// 요청 권한 — serde 직렬화는 `tier_1` / `tier_2` / `tier_3` 형식 고정.
/// (snake_case 자동 변환이 Tier1 → "tier1" 로 변환하여 manifest 컨벤션과 불일치 → 명시 rename)
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum RequestedPermission {
    #[serde(rename = "tier_1")]
    Tier1,
    #[serde(rename = "tier_2")]
    Tier2,
    #[serde(rename = "tier_3")]
    Tier3,
}

/// JSON → manifest 파싱 + 기본 검증
pub fn parse_manifest(json: &str) -> Result<PluginManifest, ManifestError> {
    let manifest: PluginManifest = serde_json::from_str(json)
        .map_err(|e| ManifestError::MalformedJson(e.to_string()))?;

    // package_id 정규식 검증 (DB CHECK와 동일)
    if !is_valid_package_id(&manifest.package_id) {
        return Err(ManifestError::InvalidPackageId(manifest.package_id.clone()));
    }

    // semver 형식 (간소)
    if !is_valid_semver(&manifest.version) {
        return Err(ManifestError::InvalidVersion(manifest.version.clone()));
    }

    // actions 개수 상한
    if manifest.actions.len() > 100 {
        return Err(ManifestError::TooManyActions(manifest.actions.len()));
    }

    // action_type 화이트리스트 (M4 cron #11): M3 frontend ACTIONS 와 동기 10종
    for action in &manifest.actions {
        match action.action_type.as_str() {
            "link" | "shortcut" | "macro" | "folder" | "text_insert" | "clipboard_copy"
            | "app_launch" | "focus_window" | "mouse_click" | "plugin_action" => {}
            other => return Err(ManifestError::UnsupportedActionType(other.into())),
        }
    }

    Ok(manifest)
}

fn is_valid_package_id(id: &str) -> bool {
    // ^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$ — 최소 2 segment
    let parts: Vec<&str> = id.split('.').collect();
    if parts.len() < 2 {
        return false;
    }
    parts.iter().all(|p| {
        let mut chars = p.chars();
        match chars.next() {
            Some(c) if c.is_ascii_lowercase() => chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_'),
            _ => false,
        }
    })
}

fn is_valid_semver(v: &str) -> bool {
    let parts: Vec<&str> = v.split('.').collect();
    parts.len() == 3 && parts.iter().all(|p| p.chars().all(|c| c.is_ascii_digit()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_package_id() {
        assert!(is_valid_package_id("kr.rebirthstation.calculator"));
        assert!(is_valid_package_id("com.example.app"));
        assert!(!is_valid_package_id("Invalid.Package"));
        assert!(!is_valid_package_id("single"));
        assert!(!is_valid_package_id("kr.."));
    }

    #[test]
    fn valid_semver() {
        assert!(is_valid_semver("1.0.0"));
        assert!(is_valid_semver("10.20.30"));
        assert!(!is_valid_semver("1.0"));
        assert!(!is_valid_semver("1.0.0-beta"));
    }

    #[test]
    fn parse_minimal_manifest() {
        let json = r#"{
            "package_id": "kr.rebirthstation.calc",
            "name": "계산기",
            "version": "1.0.0",
            "actions": [{
                "id": "open",
                "label": "계산기 열기",
                "action_type": "link",
                "default_payload": {"url": "https://calc.app"}
            }],
            "requested_permissions": ["tier_1"]
        }"#;
        let m = parse_manifest(json).unwrap();
        assert_eq!(m.actions.len(), 1);
    }

    #[test]
    fn rejects_unknown_action_type() {
        let json = r#"{
            "package_id": "kr.x.y",
            "name": "x",
            "version": "1.0.0",
            "actions": [{
                "id": "a", "label": "a", "action_type": "shell_exec",
                "default_payload": {}
            }],
            "requested_permissions": []
        }"#;
        let err = parse_manifest(json).unwrap_err();
        matches!(err, ManifestError::UnsupportedActionType(_));
    }
}
