//! 플러그인 manifest 검증 시스템
//!
//! 정착본: tech-review.md §6 — 플러그인 4중 방어
//!
//! 1. **Manifest 서명**: Ed25519 — 리버스 스테이션 서버 개인키로 서명, 헬퍼가 공개키 검증
//! 2. **action_type 화이트리스트**: enum 고정. exec/shell/eval/fs.write 키워드 발견 시 import 거부
//! 3. **매크로 제한**: steps 최대 50, 루프 최대 1,000 (steps에 루프 없음), 30초 타임아웃 (actions::macro_exec)
//! 4. **외부 URL 차단**: http:// 자원 + 외부 URL 인자 정적 분석. 사이드로딩은 Tier 3 토글만

pub mod manifest;
pub mod signature;
pub mod static_scan;

pub use manifest::{PluginManifest, ManifestError};
pub use signature::{verify_signature, SignatureError, PublishedPublicKey};
pub use static_scan::{scan_manifest, StaticScanFinding};
