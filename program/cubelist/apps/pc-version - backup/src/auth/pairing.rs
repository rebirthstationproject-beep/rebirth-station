//! 페어링 QR 페이로드 처리
//!
//! 페이로드 = `{session_token, otp_secret, expires_at, device_fingerprint}`
//! TTL 60초, 사용 즉시 무효 (otp_secret은 1회용)
//!
//! Supabase Auth 세션 + QR 2-factor 조합:
//! 1. 모바일 PWA가 헬퍼에 페어링 요청 (Supabase Auth로 같은 계정 확인)
//! 2. 헬퍼가 QR 페이로드 생성 → 화면에 QR 표시
//! 3. 모바일이 QR 스캔 → otp_secret을 Supabase Edge Function에 검증 의뢰
//! 4. Edge Function이 user_devices 테이블에 등록 + 성공 응답
//! 5. 헬퍼는 otp_secret 즉시 폐기

use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use thiserror::Error;

use super::PAIRING_QR_TTL_SECONDS;

#[derive(Debug, Error)]
pub enum PairingTtlError {
    #[error("pairing payload expired (more than {0}s old)")]
    Expired(u64),

    #[error("pairing payload from the future")]
    FutureTimestamp,

    #[error("system time error: {0}")]
    SystemTime(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairingPayload {
    /// Supabase Auth session token (헬퍼는 검증만, 발급은 PWA 측)
    pub session_token: String,

    /// 1회용 페어링 secret (Edge Function이 검증 후 즉시 폐기)
    pub otp_secret: String,

    /// UNIX timestamp seconds — TTL 60초 검증
    pub expires_at: u64,

    /// 페어링 대상 기기 fingerprint (PWA의 userAgent+canvas 해시 등)
    pub device_fingerprint: String,
}

impl PairingPayload {
    /// 페이로드의 TTL 검증 (현재 시각 기준)
    pub fn check_ttl(&self) -> Result<(), PairingTtlError> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| PairingTtlError::SystemTime(e.to_string()))?
            .as_secs();

        if self.expires_at < now {
            return Err(PairingTtlError::Expired(now - self.expires_at));
        }
        // 미래 시각은 max 5초 허용 (시계 오차)
        if self.expires_at > now + PAIRING_QR_TTL_SECONDS + 5 {
            return Err(PairingTtlError::FutureTimestamp);
        }
        Ok(())
    }

    /// 새 페이로드 생성 (헬퍼가 QR 표시 직전 호출)
    pub fn new(session_token: String, otp_secret: String, device_fingerprint: String) -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        Self {
            session_token,
            otp_secret,
            expires_at: now + PAIRING_QR_TTL_SECONDS,
            device_fingerprint,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_payload_ttl_valid() {
        let p = PairingPayload::new("s".into(), "o".into(), "d".into());
        p.check_ttl().unwrap();
    }

    #[test]
    fn expired_payload_rejected() {
        let mut p = PairingPayload::new("s".into(), "o".into(), "d".into());
        p.expires_at = 0; // far in the past
        let err = p.check_ttl().unwrap_err();
        matches!(err, PairingTtlError::Expired(_));
    }

    #[test]
    fn future_payload_rejected() {
        let mut p = PairingPayload::new("s".into(), "o".into(), "d".into());
        p.expires_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
            + 99_999;
        let err = p.check_ttl().unwrap_err();
        matches!(err, PairingTtlError::FutureTimestamp);
    }
}
