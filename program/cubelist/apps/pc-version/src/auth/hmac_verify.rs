//! HMAC-SHA256 검증
//!
//! 헬로 메시지: `hmac = HMAC-SHA256(secret, nonce || timestamp_ms || device_id)`
//! 시크릿은 keyring에서 로드. 평문 디스크 저장 절대 금지.

use hmac::{Hmac, Mac};
use sha2::Sha256;
use thiserror::Error;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Error)]
pub enum HmacError {
    #[error("invalid hex encoding")]
    InvalidHex,

    #[error("hmac length mismatch")]
    LengthMismatch,

    #[error("hmac verification failed")]
    VerificationFailed,
}

/// HMAC 검증.
///
/// `provided_hmac_hex`: 클라이언트가 보낸 hex 문자열 (소문자)
/// `secret`: keyring에서 로드한 64바이트 시크릿
/// `nonce`: 임의 문자열 (재사용 방지는 NonceCache가 별도 처리)
/// `timestamp_ms`: 클라이언트 시계 (±30초 검증은 별도 호출자가)
/// `device_id`: 페어링된 기기 UUID
pub fn verify_hmac(
    provided_hmac_hex: &str,
    secret: &[u8],
    nonce: &str,
    timestamp_ms: u64,
    device_id: &str,
) -> Result<(), HmacError> {
    let provided = hex_decode(provided_hmac_hex)?;

    // 상수시간 비교 (Mac::verify_slice가 내부적으로 subtle 사용).
    // 코드리뷰: 미사용 `expected` + debug_assert_eq 제거 — 검증 한 곳에서만 (혼란 방지).
    let mut mac = HmacSha256::new_from_slice(secret).map_err(|_| HmacError::LengthMismatch)?;
    mac.update(nonce.as_bytes());
    mac.update(&timestamp_ms.to_be_bytes());
    mac.update(device_id.as_bytes());

    mac.verify_slice(&provided)
        .map_err(|_| HmacError::VerificationFailed)?;

    Ok(())
}

/// HMAC-SHA256(secret, nonce | timestamp_ms BE | device_id) → 32 bytes.
/// 본 함수는 `compute_hmac_hex` 의 내부 + 테스트 fixture 에서 사용.
fn compute_hmac(secret: &[u8], nonce: &str, timestamp_ms: u64, device_id: &str) -> Vec<u8> {
    let mut mac = HmacSha256::new_from_slice(secret).expect("HMAC accepts any key length");
    mac.update(nonce.as_bytes());
    mac.update(&timestamp_ms.to_be_bytes());
    mac.update(device_id.as_bytes());
    mac.finalize().into_bytes().to_vec()
}

fn hex_decode(s: &str) -> Result<Vec<u8>, HmacError> {
    if s.len() % 2 != 0 {
        return Err(HmacError::InvalidHex);
    }
    let mut out = Vec::with_capacity(s.len() / 2);
    let bytes = s.as_bytes();
    for chunk in bytes.chunks(2) {
        let high = hex_digit(chunk[0])?;
        let low = hex_digit(chunk[1])?;
        out.push(high << 4 | low);
    }
    Ok(out)
}

fn hex_digit(b: u8) -> Result<u8, HmacError> {
    match b {
        b'0'..=b'9' => Ok(b - b'0'),
        b'a'..=b'f' => Ok(b - b'a' + 10),
        b'A'..=b'F' => Ok(b - b'A' + 10),
        _ => Err(HmacError::InvalidHex),
    }
}

fn hex_encode(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        out.push_str(&format!("{:02x}", b));
    }
    out
}

/// 테스트·디버깅용 HMAC 생성 (클라이언트 측 검증 또는 테스트 케이스용)
pub fn compute_hmac_hex(secret: &[u8], nonce: &str, timestamp_ms: u64, device_id: &str) -> String {
    let bytes = compute_hmac(secret, nonce, timestamp_ms, device_id);
    hex_encode(&bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hmac_roundtrip() {
        let secret = b"super-secret-64-byte-key-for-testing-purposes-only-not-real";
        let nonce = "abc-123";
        let timestamp_ms: u64 = 1716268800000;
        let device_id = "device-uuid-001";

        let hmac_hex = compute_hmac_hex(secret, nonce, timestamp_ms, device_id);
        verify_hmac(&hmac_hex, secret, nonce, timestamp_ms, device_id).unwrap();
    }

    #[test]
    fn hmac_rejects_tampered_timestamp() {
        let secret = b"k";
        let hmac_hex = compute_hmac_hex(secret, "n", 1000, "d");
        let err = verify_hmac(&hmac_hex, secret, "n", 1001, "d").unwrap_err();
        matches!(err, HmacError::VerificationFailed);
    }

    #[test]
    fn hmac_rejects_invalid_hex() {
        let err = verify_hmac("zzzz", b"k", "n", 1, "d").unwrap_err();
        matches!(err, HmacError::InvalidHex);
    }
}
