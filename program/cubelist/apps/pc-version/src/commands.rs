//! Tauri commands — 프런트엔드(JS)에서 invoke로 호출 가능한 함수.
//!
//! 보안 원칙
//! - Tier 1 (자동): 상태 조회, QR 페이로드 생성
//! - Tier 2 (사용자 동의 prompt): 외부 URL 오픈 (브라우저)
//! - Tier 3 (영구 토글): 셸 실행, 레지스트리 — 본 모듈에 없음

use crate::auth::{
    pairing::PairingPayload,
    secret_store::{DefaultStore, SecretStore},
};

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
