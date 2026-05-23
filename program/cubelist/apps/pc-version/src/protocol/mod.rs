//! 큐브 리스트 (Cube List) 프로토콜
//!
//! 회사: 리버스 스테이션 (Rebirth Station)
//! 정착본: docs/tech-review.md §1, §2, §4 (architect / planner / backend)
//!
//! 디자인 원칙
//! - Stream Deck 메시지 형식과 **유사한 구조** (외부 플러그인 포팅 비용 최소화)
//! - 단, 식별자·표기는 큐브 리스트 자체 (Deck/Stream 외래어 사용 금지)
//! - 2단계 파싱: 1) `event` 필드 추출 → 2) typed enum deserialize
//! - LAN WebSocket(주) + Supabase Realtime(폴백) 양쪽 동일 enum 사용

pub mod messages;
pub mod parse;

pub use messages::*;
pub use parse::dispatch;
