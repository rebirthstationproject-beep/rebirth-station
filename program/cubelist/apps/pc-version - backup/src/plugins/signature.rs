//! 플러그인 manifest 서명 검증
//!
//! 정착본: tech-review.md §6
//!
//! 알고리즘: Ed25519 (구현 단순·안전성 표준)
//! - 서버 측: 리버스 스테이션 개인키로 manifest_canonical_json 서명
//! - 헬퍼 측: 공개키로 서명 검증
//!
//! Canonical JSON: 키 정렬 + whitespace 제거 + UTF-8.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum SignatureError {
    #[error("invalid hex signature")]
    InvalidHex,

    #[error("invalid public key")]
    InvalidPublicKey,

    #[error("signature verification failed")]
    VerificationFailed,

    #[error("canonicalization failed: {0}")]
    Canonicalization(String),
}

/// 공개키 (32바이트). 헬퍼 빌드 시 임베드.
///
/// **실제 키 교체 필요** — 본 placeholder는 모두 0으로 채워져 있어 검증 안 됨.
/// 리버스 스테이션 PKI 구축 후 빌드 시 `include_bytes!("../../../keys/manifest_signing.pub")`로 교체.
pub struct PublishedPublicKey(pub [u8; 32]);

impl PublishedPublicKey {
    pub const PLACEHOLDER: Self = Self([0u8; 32]);
}

/// manifest JSON + 서명 (hex) → 검증
///
/// 검증 절차
/// 1. manifest JSON을 canonical 형태로 정규화
/// 2. 서명을 ed25519-dalek으로 검증
///
/// NOTE: ed25519-dalek 의존성은 W2에서 추가. 1주차에는 시그니처만 정의.
pub fn verify_signature(
    manifest_json: &str,
    signature_hex: &str,
    pubkey: &PublishedPublicKey,
) -> Result<(), SignatureError> {
    // placeholder 공개키는 임시 차단 — 실서비스에서는 빌드 시 교체 의무
    if pubkey.0.iter().all(|&b| b == 0) {
        return Err(SignatureError::InvalidPublicKey);
    }

    let _signature = hex_decode_64(signature_hex).ok_or(SignatureError::InvalidHex)?;
    let _canonical = canonicalize(manifest_json)?;

    // TODO(W2): ed25519-dalek로 실제 검증
    // use ed25519_dalek::{Verifier, VerifyingKey, Signature};
    // let vk = VerifyingKey::from_bytes(&pubkey.0).map_err(|_| SignatureError::InvalidPublicKey)?;
    // let sig = Signature::from_bytes(&signature);
    // vk.verify(canonical.as_bytes(), &sig).map_err(|_| SignatureError::VerificationFailed)?;

    Err(SignatureError::VerificationFailed) // 임시: 항상 거부
}

fn hex_decode_64(s: &str) -> Option<[u8; 64]> {
    if s.len() != 128 {
        return None;
    }
    let mut out = [0u8; 64];
    for i in 0..64 {
        let hi = hex_digit(s.as_bytes()[i * 2])?;
        let lo = hex_digit(s.as_bytes()[i * 2 + 1])?;
        out[i] = hi << 4 | lo;
    }
    Some(out)
}

fn hex_digit(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}

/// 간소 canonical JSON — 키 알파벳 정렬 + whitespace 제거
fn canonicalize(json: &str) -> Result<String, SignatureError> {
    let value: serde_json::Value =
        serde_json::from_str(json).map_err(|e| SignatureError::Canonicalization(e.to_string()))?;
    canonical_serialize(&value)
}

fn canonical_serialize(v: &serde_json::Value) -> Result<String, SignatureError> {
    use serde_json::Value;
    match v {
        Value::Null => Ok("null".into()),
        Value::Bool(b) => Ok(b.to_string()),
        Value::Number(n) => Ok(n.to_string()),
        Value::String(s) => Ok(serde_json::to_string(s).unwrap()),
        Value::Array(arr) => {
            let parts: Result<Vec<String>, _> = arr.iter().map(canonical_serialize).collect();
            Ok(format!("[{}]", parts?.join(",")))
        }
        Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            let parts: Result<Vec<String>, _> = keys
                .iter()
                .map(|k| {
                    let v = &map[*k];
                    Ok(format!(
                        "{}:{}",
                        serde_json::to_string(k).unwrap(),
                        canonical_serialize(v)?,
                    ))
                })
                .collect();
            Ok(format!("{{{}}}", parts?.join(",")))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canonicalize_sorts_keys() {
        let json = r#"{"b": 1, "a": 2}"#;
        assert_eq!(canonicalize(json).unwrap(), r#"{"a":2,"b":1}"#);
    }

    #[test]
    fn placeholder_pubkey_rejected() {
        let err = verify_signature("{}", "00".repeat(64).as_str(), &PublishedPublicKey::PLACEHOLDER)
            .unwrap_err();
        matches!(err, SignatureError::InvalidPublicKey);
    }

    #[test]
    fn invalid_hex_rejected() {
        let pubkey = PublishedPublicKey([1u8; 32]);
        let err = verify_signature("{}", "zz", &pubkey).unwrap_err();
        matches!(err, SignatureError::InvalidHex);
    }
}
