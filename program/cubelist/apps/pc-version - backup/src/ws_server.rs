//! LAN WebSocket 서버 (axum + tokio-tungstenite)
//!
//! 정착본: tech-review.md §4
//!
//! 책임
//! - WS 핸드셰이크: Origin 헤더 화이트리스트 검증
//! - 메시지 수신: protocol::dispatch로 2단계 파싱
//! - 인증: 첫 메시지는 ClientEvent::Hello 강제 (HMAC + nonce + timestamp 검증)
//! - 후속 메시지: 핸드셰이크 성공 후만 처리
//!
//! W1 스코프: 서버 골격 + Hello 검증 + Ping/Pong만. PressItem 실행은 W1-2.

use std::net::SocketAddr;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        ConnectInfo, State,
    },
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    routing::get,
    Router,
};
use tokio::sync::RwLock;
use tracing::{debug, info, warn};

use crate::actions::{self, ActionError};
use crate::auth::{
    secret_store::{DefaultStore, SecretStore},
    verify_hmac, NonceCache, ALLOWED_ORIGINS, TIMESTAMP_SKEW_TOLERANCE_MS,
};
use crate::protocol::{dispatch, ClientEvent, Capabilities, ExecutionStatus, ServerEvent};

#[derive(Clone)]
pub struct ServerState {
    pub secret: Arc<Vec<u8>>,
    pub nonce_cache: Arc<RwLock<NonceCache>>,
}

pub async fn run(addr: SocketAddr) -> anyhow::Result<()> {
    let store = DefaultStore::new();
    let secret = store
        .load_or_init()
        .map_err(|e| anyhow::anyhow!("secret load failed: {e}"))?;

    let state = ServerState {
        secret: Arc::new(secret),
        nonce_cache: Arc::new(RwLock::new(NonceCache::default())),
    };

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/health", get(health))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    info!("리스닝 시작: {}", addr);
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;
    Ok(())
}

async fn health() -> &'static str {
    "ok"
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    headers: HeaderMap,
    State(state): State<ServerState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
) -> impl IntoResponse {
    // Origin 화이트리스트 검증
    let origin = headers
        .get(header::ORIGIN)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if !ALLOWED_ORIGINS.contains(&origin) {
        warn!(origin, "Origin 거부");
        return (StatusCode::FORBIDDEN, "origin not allowed").into_response();
    }

    debug!(?addr, origin, "WS 연결 요청");
    ws.on_upgrade(move |socket| handle_socket(socket, state, addr))
}

async fn handle_socket(mut socket: WebSocket, state: ServerState, addr: SocketAddr) {
    info!(?addr, "WS 연결 수립");

    // 첫 메시지는 Hello 강제 (최대 5초 대기)
    let hello = match wait_for_hello(&mut socket).await {
        Some(h) => h,
        None => {
            warn!(?addr, "Hello 미수신 → 종료");
            let _ = send_event(&mut socket, ServerEvent::AuthRejected {
                reason: crate::protocol::AuthRejectionReason::ProtocolVersionMismatch,
            }).await;
            return;
        }
    };

    // Hello 검증
    if let Err(reason) = validate_hello(&hello, &state).await {
        warn!(?addr, ?reason, "Hello 검증 실패");
        let _ = send_event(&mut socket, ServerEvent::AuthRejected { reason }).await;
        return;
    }

    // Welcome 응답
    let welcome = ServerEvent::Welcome {
        protocol_version: crate::protocol::messages::PROTOCOL_VERSION,
        helper_version: env!("CARGO_PKG_VERSION").to_string(),
        capabilities: capabilities(),
    };
    if send_event(&mut socket, welcome).await.is_err() {
        return;
    }

    // 메시지 루프 (W1 스코프: Ping/Pong만 처리, 나머지는 추후)
    while let Some(Ok(msg)) = socket.recv().await {
        let raw = match msg {
            Message::Text(t) => t,
            Message::Close(_) => break,
            Message::Ping(p) => {
                let _ = socket.send(Message::Pong(p)).await;
                continue;
            }
            _ => continue,
        };

        match dispatch(&raw) {
            Ok(ClientEvent::Ping) => {
                let _ = send_event(&mut socket, ServerEvent::Pong).await;
            }
            Ok(ClientEvent::Hello { .. }) => {
                warn!(?addr, "재핸드셰이크 시도 무시");
            }
            Ok(ClientEvent::PressItem {
                item_id, action, ..
            }) => {
                let response = match actions::execute(&action).await {
                    Ok(result) => ServerEvent::ItemExecuted {
                        item_id: item_id.clone(),
                        status: ExecutionStatus::Ok,
                        elapsed_ms: result.elapsed_ms,
                    },
                    Err(ActionError::PermissionRequired(tier)) => ServerEvent::ItemExecuted {
                        item_id: item_id.clone(),
                        status: ExecutionStatus::PermissionRequired { tier },
                        elapsed_ms: 0,
                    },
                    Err(e) => ServerEvent::ItemExecuted {
                        item_id: item_id.clone(),
                        status: ExecutionStatus::Failed {
                            reason: e.to_string(),
                        },
                        elapsed_ms: 0,
                    },
                };
                let _ = send_event(&mut socket, response).await;
            }
            Ok(ClientEvent::SubscribeBoard { board_id }) => {
                debug!(?addr, %board_id, "subscribe_board — Realtime은 클라이언트가 처리, 헬퍼는 무시");
            }
            Ok(ClientEvent::RunMacro { macro_id, .. }) => {
                warn!(?addr, %macro_id, "RunMacro는 W2 범위 — 무시");
            }
            Err(e) => {
                warn!(?addr, ?e, "프로토콜 파싱 실패");
                let _ = send_event(&mut socket, ServerEvent::Notice {
                    level: crate::protocol::NoticeLevel::Warning,
                    message: format!("protocol error: {e}"),
                }).await;
            }
        }
    }

    info!(?addr, "WS 연결 종료");
}

async fn wait_for_hello(socket: &mut WebSocket) -> Option<ClientEvent> {
    let timeout = tokio::time::sleep(std::time::Duration::from_secs(5));
    tokio::pin!(timeout);

    loop {
        tokio::select! {
            maybe = socket.recv() => {
                let msg = match maybe {
                    Some(Ok(m)) => m,
                    Some(Err(_)) | None => return None,
                };
                if let Message::Text(t) = msg {
                    if let Ok(ev @ ClientEvent::Hello { .. }) = dispatch(&t) {
                        return Some(ev);
                    }
                }
            }
            _ = &mut timeout => return None,
        }
    }
}

async fn validate_hello(
    hello: &ClientEvent,
    state: &ServerState,
) -> Result<(), crate::protocol::AuthRejectionReason> {
    let ClientEvent::Hello {
        protocol_version,
        device_id,
        nonce,
        timestamp_ms,
        hmac,
    } = hello
    else {
        return Err(crate::protocol::AuthRejectionReason::ProtocolVersionMismatch);
    };

    // 프로토콜 버전
    if *protocol_version != crate::protocol::messages::PROTOCOL_VERSION {
        return Err(crate::protocol::AuthRejectionReason::ProtocolVersionMismatch);
    }

    // timestamp skew (±30초)
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);
    if (now_ms - *timestamp_ms as i64).abs() > TIMESTAMP_SKEW_TOLERANCE_MS {
        return Err(crate::protocol::AuthRejectionReason::TimestampSkew);
    }

    // nonce 재사용 방지
    {
        let mut cache = state.nonce_cache.write().await;
        if !cache.insert_if_new(nonce) {
            return Err(crate::protocol::AuthRejectionReason::NonceReused);
        }
    }

    // HMAC 검증
    verify_hmac(hmac, &state.secret, nonce, *timestamp_ms, device_id)
        .map_err(|_| crate::protocol::AuthRejectionReason::InvalidHmac)?;

    // TODO(W1-0): user_devices 테이블 조회 → 미등록 기기 UnknownDevice
    // 현재는 페어링 완료된 기기로 간주 (W1 스코프 외)

    Ok(())
}

fn capabilities() -> Capabilities {
    Capabilities {
        can_send_keys: cfg!(feature = "keys"),
        can_launch_app: false, // Tier 2, 사용자 prompt 후 활성
        can_run_shell: false,  // Tier 3, 영구 토글만
        os: std::env::consts::OS.to_string(),
    }
}

async fn send_event(socket: &mut WebSocket, event: ServerEvent) -> Result<(), axum::Error> {
    // serde 실패는 발생 가능성 거의 없음 (모든 필드가 직렬화 가능)
    let json = serde_json::to_string(&event)
        .unwrap_or_else(|_| r#"{"event":"notice","level":"error","message":"serialize failed"}"#.into());
    socket.send(Message::Text(json)).await
}
