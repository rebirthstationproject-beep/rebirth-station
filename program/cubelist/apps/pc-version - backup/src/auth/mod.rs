//! 인증·페어링·디스커버리
//!
//! 정착본: docs/tech-review.md §4 (Rust), §6 (Security)
//!
//! 흐름
//! 1. 첫 실행: 64바이트 시크릿 생성 → keyring(Windows Credential Manager) 저장
//! 2. 페어링: Supabase Auth 세션(같은 계정) + QR 스캔(물리적 근접) 2-factor
//!    QR 페이로드 = `{session_token, otp_secret, expires_at, device_fingerprint}`
//!    TTL 60초, 사용 즉시 무효
//! 3. WS 연결: HMAC nonce + ±30초 timestamp + Origin 화이트리스트
//! 4. 매 연결마다 nonce 재사용 방지 캐시 (최근 100개)

pub mod hmac_verify;
pub mod nonce_cache;
pub mod pairing;
pub mod secret_store;

pub use hmac_verify::{verify_hmac, HmacError};
pub use nonce_cache::NonceCache;
pub use pairing::{PairingPayload, PairingTtlError};
pub use secret_store::{SecretStore, SecretStoreError};

/// 허용 Origin 화이트리스트
/// 정착본: tech-review.md §4 — `tauri://localhost` + jusomoa 본체 도메인
pub const ALLOWED_ORIGINS: &[&str] = &[
    "tauri://localhost",
    "https://주소모아.com",
    "https://xn--v52b19jw9czye.com",   // punycode
    "http://localhost:3000",          // 개발용
];

/// HMAC timestamp 허용 오차 (±30초)
pub const TIMESTAMP_SKEW_TOLERANCE_MS: i64 = 30_000;

/// nonce 재사용 방지 캐시 크기
pub const NONCE_CACHE_CAPACITY: usize = 100;

/// 페어링 QR TTL (60초)
pub const PAIRING_QR_TTL_SECONDS: u64 = 60;
