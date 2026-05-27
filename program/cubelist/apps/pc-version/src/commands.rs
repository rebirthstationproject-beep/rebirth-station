//! Tauri commands — 프런트엔드(JS)에서 invoke로 호출 가능한 함수.
//!
//! 보안 원칙
//! - Tier 1 (자동): 상태 조회, QR 페이로드 생성
//! - Tier 2 (사용자 동의 prompt): 외부 URL 오픈 (브라우저)
//! - Tier 3 (영구 토글): 셸 실행, 레지스트리 — 본 모듈에 없음

use crate::actions::{self, ActionError};
use crate::auth::{
    pairing::PairingPayload,
    secret_store::{DefaultStore, SecretStore},
};
use crate::protocol::messages::ActionPayload;

/// WS 서버 상태 조회
#[cfg_attr(feature = "gui", tauri::command)]
pub fn ws_server_status() -> ServerStatusDto {
    ServerStatusDto {
        running: true, // TODO: 실제 핸들 상태 조회로 교체
        listen_addr: "127.0.0.1:23456".into(),
        protocol_version: crate::protocol::messages::PROTOCOL_VERSION,
        helper_version: env!("CARGO_PKG_VERSION").into(),
    }
}

#[derive(serde::Serialize)]
pub struct ServerStatusDto {
    pub running: bool,
    pub listen_addr: String,
    pub protocol_version: u8,
    pub helper_version: String,
}

/// 외부 URL을 OS default browser로 오픈
///
/// 보안: URL 스킴은 http(s)만 허용 (file:// / javascript: 차단)
#[cfg_attr(feature = "gui", tauri::command)]
pub fn open_external_url(url: String) -> Result<(), String> {
    if !is_safe_url(&url) {
        return Err(format!("blocked unsafe scheme: {url}"));
    }
    open_in_browser(&url).map_err(|e| e.to_string())
}

fn is_safe_url(url: &str) -> bool {
    let lower = url.to_ascii_lowercase();
    lower.starts_with("http://") || lower.starts_with("https://")
}

fn open_in_browser(url: &str) -> anyhow::Result<()> {
    // OS default browser 위임 — gui/cli 공통. actions::link와 동일 패턴.
    crate::actions::link::open_default_browser(url)
        .map_err(|e| anyhow::anyhow!(e.to_string()))
}

/// 라이브러리 폴더 1회 스캔 — .cubeone / .cubelist / .cubepack 파일 raw bytes 반환.
///
/// 보안: 디렉토리 트래버설 차단 (..), 심볼릭 링크 미추적
/// 파일 1개 최대 32 MB, 전체 256 MB 제한
#[derive(serde::Serialize)]
pub struct LibraryFile {
    pub relative_path: String,
    pub bytes: Vec<u8>,
}

const MAX_FILE_BYTES: u64 = 32 * 1024 * 1024;
const MAX_TOTAL_BYTES: u64 = 256 * 1024 * 1024;

#[cfg_attr(feature = "gui", tauri::command)]
pub fn read_library_files(path: String) -> Result<Vec<LibraryFile>, String> {
    let root = std::path::PathBuf::from(&path);
    if !root.is_dir() {
        return Err(format!("디렉토리 아님: {path}"));
    }
    let canonical = root
        .canonicalize()
        .map_err(|e| format!("경로 정규화 실패: {e}"))?;
    let mut files = Vec::new();
    let mut total: u64 = 0;
    scan_library_dir(&canonical, &canonical, &mut files, &mut total)
        .map_err(|e| e.to_string())?;
    Ok(files)
}

fn scan_library_dir(
    root: &std::path::Path,
    current: &std::path::Path,
    files: &mut Vec<LibraryFile>,
    total: &mut u64,
) -> std::io::Result<()> {
    let entries = std::fs::read_dir(current)?;
    for entry in entries {
        let entry = entry?;
        let metadata = entry.metadata()?;
        let path = entry.path();
        if metadata.file_type().is_symlink() {
            continue; // 심볼릭 링크 차단 (트래버설 방지)
        }
        if metadata.is_dir() {
            scan_library_dir(root, &path, files, total)?;
            continue;
        }
        let Some(ext) = path.extension().and_then(|e| e.to_str()) else {
            continue;
        };
        let lower = ext.to_ascii_lowercase();
        if !matches!(lower.as_str(), "cubeone" | "cubelist" | "cubepack") {
            continue;
        }
        let size = metadata.len();
        if size > MAX_FILE_BYTES {
            tracing::warn!(
                path = ?path,
                size,
                "라이브러리 파일이 너무 큼 — 건너뜀"
            );
            continue;
        }
        if *total + size > MAX_TOTAL_BYTES {
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("라이브러리 총 크기 한도 초과 ({MAX_TOTAL_BYTES} bytes)"),
            ));
        }
        let bytes = std::fs::read(&path)?;
        *total += size;
        let relative = path
            .strip_prefix(root)
            .unwrap_or(&path)
            .to_string_lossy()
            .replace('\\', "/");
        files.push(LibraryFile {
            relative_path: relative,
            bytes,
        });
    }
    Ok(())
}

/// 페어링용 QR 페이로드 생성 (UI가 호출 → QR로 렌더)
#[cfg_attr(feature = "gui", tauri::command)]
pub fn generate_pairing_qr(session_token: String, device_fingerprint: String) -> Result<PairingQrDto, String> {
    // otp_secret = 32바이트 hex
    let otp_secret = generate_otp_secret();
    let payload = PairingPayload::new(session_token, otp_secret, device_fingerprint);
    let json = serde_json::to_string(&payload).map_err(|e| e.to_string())?;
    Ok(PairingQrDto {
        payload_json: json,
        expires_at: payload.expires_at,
    })
}

#[derive(serde::Serialize)]
pub struct PairingQrDto {
    pub payload_json: String,
    pub expires_at: u64,
}

fn generate_otp_secret() -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

/// HMAC 시크릿 회전 (재페어링 강제)
#[cfg_attr(feature = "gui", tauri::command)]
pub fn reset_pairing_secret() -> Result<(), String> {
    let store = DefaultStore::new();
    store.rotate().map_err(|e| e.to_string())?;
    Ok(())
}

/// 설치된 플러그인 manifest 목록 (M4 cron #12).
///
/// `~/.cubelist/plugins/<package_id>/manifest.json` 스캔.
/// 디렉토리 없으면 빈 배열. 손상된 manifest 는 로그 후 스킵.
#[cfg_attr(feature = "gui", tauri::command)]
pub fn list_plugins() -> Result<Vec<crate::plugins::PluginManifest>, String> {
    crate::plugins::list_installed().map_err(|e| e.to_string())
}

/// `.cubeplugin` 파일 설치 (M4 cron #12+).
///
/// 입력: ZIP 바이트 (frontend 가 File API 로 읽어 base64 또는 number array 로 전달).
/// 결과: 설치된 plugin manifest. 경로 traversal/서명 실패 시 거부.
#[cfg_attr(feature = "gui", tauri::command)]
pub fn install_plugin(bytes: Vec<u8>) -> Result<crate::plugins::PluginManifest, String> {
    crate::plugins::install_zip(&bytes).map_err(|e| e.to_string())
}

/// 큐브 액션 실행 — 편집기에서 "테스트 실행" 시 호출 (M3 cron #8).
///
/// 입력: frontend `Cube` 의 `{ action_type, ...action_payload }` 평면 JSON.
/// 예: `{ "action_type": "link", "url": "https://example.com" }`
///
/// 내부 흐름: serde → `ActionPayload` → `guard::validate` → `actions::execute` (async).
#[cfg_attr(feature = "gui", tauri::command)]
pub async fn execute_cube(action: serde_json::Value) -> Result<ExecuteResultDto, ExecuteErrorDto> {
    let payload: ActionPayload = serde_json::from_value(action).map_err(|e| ExecuteErrorDto {
        kind: "deserialize".into(),
        message: e.to_string(),
        tier: None,
    })?;

    match actions::execute(&payload).await {
        Ok(r) => Ok(ExecuteResultDto {
            elapsed_ms: r.elapsed_ms,
        }),
        Err(e) => Err(execute_error_to_dto(&e)),
    }
}

#[derive(serde::Serialize)]
pub struct ExecuteResultDto {
    pub elapsed_ms: u32,
}

#[derive(serde::Serialize)]
pub struct ExecuteErrorDto {
    pub kind: String,
    pub message: String,
    pub tier: Option<u8>,
}

fn execute_error_to_dto(e: &ActionError) -> ExecuteErrorDto {
    match e {
        ActionError::UnsafeScheme(_) => ExecuteErrorDto {
            kind: "unsafe_scheme".into(),
            message: e.to_string(),
            tier: None,
        },
        ActionError::OsCommand(_) => ExecuteErrorDto {
            kind: "os_command".into(),
            message: e.to_string(),
            tier: None,
        },
        ActionError::FeatureDisabled(_) => ExecuteErrorDto {
            kind: "feature_disabled".into(),
            message: e.to_string(),
            tier: None,
        },
        ActionError::PermissionRequired(tier) => ExecuteErrorDto {
            kind: "permission_required".into(),
            message: e.to_string(),
            tier: Some(*tier),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safe_url_accepts_https() {
        assert!(is_safe_url("https://example.com"));
        assert!(is_safe_url("http://example.com"));
    }

    #[test]
    fn safe_url_rejects_dangerous_schemes() {
        assert!(!is_safe_url("file:///c:/windows/system32"));
        assert!(!is_safe_url("javascript:alert(1)"));
        assert!(!is_safe_url("data:text/html,<script>"));
    }
}
