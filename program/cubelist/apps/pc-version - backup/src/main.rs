//! 큐브 리스트 (Cube List) PC 헬퍼 — 실행 엔트리
//!
//! 회사: 리버스 스테이션 (Rebirth Station)
//!
//! 실행 모드
//! - 기본 (`cargo run` / `cargo tauri dev`): GUI 모드 (default = ["gui"]) — Tauri 트레이 + 창 + WS 서버
//! - CLI 헤드리스: `cargo run --no-default-features` — WS 서버만 기동 (헤드리스 fallback)
//! - 단축키 실행 활성: `--features keys` — enigo 활성 (Tier 2 필요)
//!
//! `default = ["gui"]` 영구 결정 사유 = Cargo.toml `[features]` 주석 + docs/desktop-app-setup.md "Feature 분기" 참조

use tracing_subscriber::EnvFilter;

#[cfg(feature = "gui")]
fn main() -> tauri::Result<()> {
    init_tracing();
    tracing::info!("큐브 리스트 PC 헬퍼 v{} (GUI 모드)", env!("CARGO_PKG_VERSION"));
    cubelist_pc_helper::run_tauri()
}

#[cfg(not(feature = "gui"))]
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    init_tracing();
    tracing::info!("큐브 리스트 PC 헬퍼 v{} (CLI 모드)", env!("CARGO_PKG_VERSION"));

    use cubelist_pc_helper::auth::secret_store::{DefaultStore, SecretStore};
    use cubelist_pc_helper::ws_server;
    use std::net::SocketAddr;

    let store = DefaultStore::new();
    let _secret = store
        .load_or_init()
        .map_err(|e| anyhow::anyhow!("secret store init failed: {e}"))?;
    tracing::info!("HMAC 시크릿 로드 완료 (keyring)");

    let addr: SocketAddr = "127.0.0.1:23456".parse()?;
    tracing::info!("WebSocket 서버 시작: ws://{}/ws", addr);

    ws_server::run(addr).await?;
    Ok(())
}

fn init_tracing() {
    let _ = tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .try_init();
}
