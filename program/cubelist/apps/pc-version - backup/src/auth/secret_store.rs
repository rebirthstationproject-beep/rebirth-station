//! 시크릿 저장소 — keyring (Windows Credential Manager 위임)
//!
//! 정착본: tech-review.md §4 — 평문 디스크 저장 절대 금지
//!
//! 흐름
//! 1. 첫 실행: 64바이트 랜덤 시크릿 생성 → keyring에 저장
//! 2. 이후 실행: keyring에서 조회
//! 3. 페어링 시 모바일과 secret 공유 (QR 또는 1회 코드)

use thiserror::Error;

const SERVICE_NAME: &str = "RebirthStation.CubeList";
const ACCOUNT_HMAC_SECRET: &str = "hmac_secret_v1";

#[derive(Debug, Error)]
pub enum SecretStoreError {
    #[error("keyring error: {0}")]
    Keyring(String),

    #[error("entropy source error: {0}")]
    Entropy(String),

    #[error("secret not initialized")]
    NotInitialized,
}

/// keyring 추상화. 테스트 시 in-memory 대체 가능하도록 trait 분리.
pub trait SecretStore: Send + Sync {
    fn load_or_init(&self) -> Result<Vec<u8>, SecretStoreError>;
    fn rotate(&self) -> Result<Vec<u8>, SecretStoreError>;
}

/// 실제 OS keyring 구현 (Tauri 빌드 시 활성).
///
/// `cfg(not(test))`로 분기하여 단위 테스트에서는 InMemoryStore 사용.
#[cfg(not(test))]
pub struct OsKeyringStore;

#[cfg(not(test))]
impl OsKeyringStore {
    pub fn new() -> Self {
        Self
    }
}

#[cfg(not(test))]
impl SecretStore for OsKeyringStore {
    fn load_or_init(&self) -> Result<Vec<u8>, SecretStoreError> {
        let entry = keyring::Entry::new(SERVICE_NAME, ACCOUNT_HMAC_SECRET)
            .map_err(|e| SecretStoreError::Keyring(e.to_string()))?;

        match entry.get_password() {
            Ok(hex) => decode_hex(&hex),
            Err(keyring::Error::NoEntry) => self.rotate(),
            Err(e) => Err(SecretStoreError::Keyring(e.to_string())),
        }
    }

    fn rotate(&self) -> Result<Vec<u8>, SecretStoreError> {
        let entry = keyring::Entry::new(SERVICE_NAME, ACCOUNT_HMAC_SECRET)
            .map_err(|e| SecretStoreError::Keyring(e.to_string()))?;

        let bytes = generate_random_secret(64)?;
        let hex = encode_hex(&bytes);

        entry
            .set_password(&hex)
            .map_err(|e| SecretStoreError::Keyring(e.to_string()))?;

        Ok(bytes)
    }
}

/// 테스트용 in-memory 구현
#[cfg(test)]
pub use test_store::InMemoryStore as DefaultStore;

#[cfg(not(test))]
pub use OsKeyringStore as DefaultStore;

#[cfg(test)]
mod test_store {
    use super::*;
    use std::sync::Mutex;

    pub struct InMemoryStore {
        secret: Mutex<Option<Vec<u8>>>,
    }

    impl InMemoryStore {
        pub fn new() -> Self {
            Self {
                secret: Mutex::new(None),
            }
        }
    }

    impl SecretStore for InMemoryStore {
        fn load_or_init(&self) -> Result<Vec<u8>, SecretStoreError> {
            let mut guard = self.secret.lock().unwrap();
            if let Some(s) = &*guard {
                return Ok(s.clone());
            }
            let bytes = generate_random_secret(64)?;
            *guard = Some(bytes.clone());
            Ok(bytes)
        }

        fn rotate(&self) -> Result<Vec<u8>, SecretStoreError> {
            let bytes = generate_random_secret(64)?;
            *self.secret.lock().unwrap() = Some(bytes.clone());
            Ok(bytes)
        }
    }
}

// ---------------------------------------------------------------------------
// 유틸
// ---------------------------------------------------------------------------

fn generate_random_secret(len: usize) -> Result<Vec<u8>, SecretStoreError> {
    use rand::RngCore;
    let mut bytes = vec![0u8; len];
    rand::thread_rng().fill_bytes(&mut bytes);
    Ok(bytes)
}

fn encode_hex(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        out.push_str(&format!("{:02x}", b));
    }
    out
}

fn decode_hex(s: &str) -> Result<Vec<u8>, SecretStoreError> {
    if s.len() % 2 != 0 {
        return Err(SecretStoreError::Keyring("invalid hex length".into()));
    }
    let mut out = Vec::with_capacity(s.len() / 2);
    let bytes = s.as_bytes();
    for chunk in bytes.chunks(2) {
        let hi = hex_digit(chunk[0])?;
        let lo = hex_digit(chunk[1])?;
        out.push(hi << 4 | lo);
    }
    Ok(out)
}

fn hex_digit(b: u8) -> Result<u8, SecretStoreError> {
    match b {
        b'0'..=b'9' => Ok(b - b'0'),
        b'a'..=b'f' => Ok(b - b'a' + 10),
        b'A'..=b'F' => Ok(b - b'A' + 10),
        _ => Err(SecretStoreError::Keyring("invalid hex digit".into())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn in_memory_store_persists_secret() {
        let store = test_store::InMemoryStore::new();
        let s1 = store.load_or_init().unwrap();
        let s2 = store.load_or_init().unwrap();
        assert_eq!(s1, s2);
        assert_eq!(s1.len(), 64);
    }

    #[test]
    fn rotate_changes_secret() {
        let store = test_store::InMemoryStore::new();
        let s1 = store.load_or_init().unwrap();
        let s2 = store.rotate().unwrap();
        assert_ne!(s1, s2);
    }
}
