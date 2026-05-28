//! M4 Step 3: StreamDeck Native (.exe / .node) Plugin Runtime
//!
//! StreamDeck Native plugin 표준:
//!   plugin .exe 를 spawn 하면서 표준 인자 4개 전달:
//!     -port <PORT>           — WebSocket 서버 포트
//!     -pluginUUID <UUID>     — context UUID (큐브 인스턴스마다 다름)
//!     -registerEvent <NAME>  — "registerPlugin"
//!     -info <JSON>           — application/plugin/devices 정보
//!
//!   plugin 이 ws://127.0.0.1:<port> 에 연결하고 registerEvent 메시지 보냄.
//!   이후 SDK 표준 메시지 (setImage, setTitle, keyDown 등) 양방향.
//!
//! 큐브 리스트 측 책임:
//!   - WebSocket 서버 띄우기 (동적 포트 0 = OS 할당)
//!   - plugin 연결 시 context UUID 매핑 등록
//!   - plugin → server 메시지를 Tauri event ("plugin_native_message") 로 frontend emit
//!   - frontend → server 메시지를 plugin 의 ws.send() 로 forward
//!   - process lifecycle (spawn / crash 감지 / unmount 시 kill)

use std::collections::HashMap;
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::tungstenite::Message;
use futures_util::{SinkExt, StreamExt};

/// 연결 1개당 1 entry — context UUID → plugin 으로 메시지 보낼 sender
pub type ConnectionMap = Arc<Mutex<HashMap<String, mpsc::UnboundedSender<String>>>>;

pub struct PluginServer {
    pub port: u16,
    pub connections: ConnectionMap,
    /// frontend 로 emit 할 콜백 (Tauri AppHandle 보유)
    /// 사용 — server.set_emit_callback(|ctx, msg| { ... })
    emit_callback: Arc<Mutex<Option<Box<dyn Fn(String, String) + Send + Sync>>>>,
}

impl PluginServer {
    /// 동적 포트로 WebSocket 서버 시작. 백그라운드 task spawn 후 PluginServer 반환.
    pub async fn start() -> anyhow::Result<Self> {
        let listener = TcpListener::bind("127.0.0.1:0").await?;
        let port = listener.local_addr()?.port();
        tracing::info!(port, "M4 plugin WebSocket 서버 시작");
        let connections: ConnectionMap = Arc::new(Mutex::new(HashMap::new()));
        let emit_callback: Arc<Mutex<Option<Box<dyn Fn(String, String) + Send + Sync>>>> =
            Arc::new(Mutex::new(None));

        let conn_clone = connections.clone();
        let emit_clone = emit_callback.clone();
        tokio::spawn(async move {
            loop {
                match listener.accept().await {
                    Ok((stream, addr)) => {
                        tracing::debug!(?addr, "plugin TCP 연결 수신");
                        let conn = conn_clone.clone();
                        let emit = emit_clone.clone();
                        tokio::spawn(async move {
                            if let Err(e) = handle_connection(stream, conn, emit).await {
                                tracing::warn!(error = ?e, "plugin connection 종료 (에러)");
                            }
                        });
                    }
                    Err(e) => {
                        tracing::warn!(error = ?e, "TCP accept 실패");
                        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                    }
                }
            }
        });

        Ok(Self {
            port,
            connections,
            emit_callback,
        })
    }

    /// frontend 로 emit 할 콜백 등록 (Tauri AppHandle.emit 사용)
    pub fn set_emit_callback<F>(&self, callback: F)
    where
        F: Fn(String, String) + Send + Sync + 'static,
    {
        if let Ok(mut guard) = self.emit_callback.try_lock() {
            *guard = Some(Box::new(callback));
        } else {
            tracing::warn!("emit_callback set 실패 — Mutex busy");
        }
    }

    /// frontend → plugin: 특정 context 의 plugin 에게 메시지 보내기
    pub async fn send_to_plugin(&self, context_uuid: &str, msg: String) -> anyhow::Result<()> {
        let map = self.connections.lock().await;
        if let Some(tx) = map.get(context_uuid) {
            tx.send(msg).map_err(|e| anyhow::anyhow!("send 실패: {e}"))?;
            Ok(())
        } else {
            Err(anyhow::anyhow!("context {context_uuid} 미연결"))
        }
    }

    /// context 연결 해제 (큐브 unmount 시)
    pub async fn drop_context(&self, context_uuid: &str) {
        let mut map = self.connections.lock().await;
        map.remove(context_uuid);
    }
}

async fn handle_connection(
    stream: TcpStream,
    connections: ConnectionMap,
    emit_callback: Arc<Mutex<Option<Box<dyn Fn(String, String) + Send + Sync>>>>,
) -> anyhow::Result<()> {
    let ws_stream = tokio_tungstenite::accept_async(stream).await?;
    let (mut write, mut read) = ws_stream.split();

    // plugin 의 첫 메시지 = register event ({"event":"registerPlugin","uuid":"<context>"})
    let mut current_context: Option<String> = None;
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    // frontend → plugin 라우팅 task
    let mut writer_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if write.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    loop {
        tokio::select! {
            maybe_msg = read.next() => {
                match maybe_msg {
                    Some(Ok(Message::Text(text))) => {
                        // 첫 메시지 = register
                        if current_context.is_none() {
                            // {"event":"registerPlugin","uuid":"<context_uuid>"}
                            if let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) {
                                if let Some(uuid) = value.get("uuid").and_then(|v| v.as_str()) {
                                    let ctx = uuid.to_string();
                                    let mut map = connections.lock().await;
                                    map.insert(ctx.clone(), tx.clone());
                                    current_context = Some(ctx);
                                    tracing::info!(uuid = ?current_context, "plugin 등록");
                                    continue;
                                }
                            }
                        }
                        // plugin → frontend forward (Tauri event)
                        if let Some(ctx) = &current_context {
                            let cb = emit_callback.lock().await;
                            if let Some(emit) = cb.as_ref() {
                                emit(ctx.clone(), text);
                            }
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        tracing::debug!(uuid = ?current_context, "plugin 연결 종료");
                        break;
                    }
                    Some(Err(e)) => {
                        tracing::warn!(error = ?e, "plugin ws 에러");
                        break;
                    }
                    _ => {}
                }
            }
            _ = &mut writer_task => break,
        }
    }

    // cleanup
    if let Some(ctx) = current_context {
        let mut map = connections.lock().await;
        map.remove(&ctx);
    }
    Ok(())
}
