//! 큐브 리스트 PC 헬퍼 — 라이브러리 진입점
//!
//! `gui` feature 활성 시 `run_tauri()` 로 Tauri 앱 기동.
//! 비활성 시에는 main.rs가 직접 ws_server만 실행.

pub mod actions;
pub mod auth;
pub mod commands;
pub mod hotkeys;
pub mod plugin_server;
pub mod plugins;
pub mod protocol;
pub mod ws_server;

#[cfg(feature = "gui")]
pub mod tray;

#[cfg(feature = "gui")]
use tauri::{Emitter, Manager};

/// R3-1: 시스템 메트릭 폴링 재사용 State
#[cfg(feature = "gui")]
pub use commands::SystemMetricsState;

/// M4 Step 2: 라이브러리 폴더 경로 (custom URI scheme handler 가 사용)
pub struct LibraryDirState(pub std::sync::Mutex<Option<String>>);

/// M4 Step 3: Native plugin WebSocket 서버 (포트 + connections)
pub struct PluginServerState(pub std::sync::Arc<tokio::sync::Mutex<Option<plugin_server::PluginServer>>>);

/// M4 Step 3.6: Native plugin child process handles — context_uuid → Child (kill 용)
pub struct PluginProcessState(
    pub std::sync::Arc<std::sync::Mutex<std::collections::HashMap<String, std::process::Child>>>,
);

/// Tauri 앱 기동 (gui feature 전용).
///
/// 책임
/// - 시스템 트레이 등록 (좌클릭 = 창 토글, 우클릭 메뉴)
/// - LAN WebSocket 서버 백그라운드 task
/// - autostart 플러그인 (사용자 토글)
/// - 창 close → hide (종료가 아닌 트레이로)
#[cfg(feature = "gui")]
pub fn run_tauri() -> tauri::Result<()> {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized".into()]),
        ))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(LibraryDirState(std::sync::Mutex::new(None)))
        .manage(PluginServerState(std::sync::Arc::new(tokio::sync::Mutex::new(None))))
        .manage(PluginProcessState(std::sync::Arc::new(std::sync::Mutex::new(std::collections::HashMap::new()))))
        .manage(SystemMetricsState::new())
        .register_uri_scheme_protocol("cubelist-plugin", |ctx, request| {
            // URL: cubelist-plugin://<plugin_id>/<rest_of_path>
            // 응답: 라이브러리 폴더 안 _plugins/<plugin_id>/<rest_of_path> 의 파일
            let state = ctx.app_handle().state::<LibraryDirState>();
            let library_dir = state.0.lock().ok().and_then(|g| g.clone());
            let url = request.uri();
            commands::cubelist_plugin_protocol_handler(library_dir, url)
        })
        .invoke_handler(tauri::generate_handler![
            commands::ws_server_status,
            commands::open_external_url,
            commands::generate_pairing_qr,
            commands::reset_pairing_secret,
            commands::execute_cube,
            commands::list_plugins,
            commands::install_plugin,
            commands::read_library_files,
            commands::write_library_file,
            commands::write_plugin_zip,
            commands::set_library_dir_state,
            commands::spawn_plugin_process,
            commands::send_to_plugin,
            commands::drop_plugin_context,
            commands::list_plugin_processes,
            commands::broadcast_cube_update,
            commands::broadcast_selection_change,
            commands::get_system_metrics,
        ])
        .setup(|app| {
            // 시스템 트레이 메뉴
            tray::install(app)?;

            // 전역 핫키 등록 (~/.cubelist/hotkeys.json)
            register_hotkeys(app);

            // 백그라운드 WS 서버 기동
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = ws_server::run("127.0.0.1:23456".parse().unwrap()).await {
                    tracing::error!(error = ?e, "WS 서버 종료");
                    let _ = handle.emit("ws_server_error", e.to_string());
                }
            });

            // M4 Step 3: Native plugin WebSocket 서버 시작 (동적 포트)
            let plugin_state = app.state::<PluginServerState>().0.clone();
            let plugin_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match plugin_server::PluginServer::start().await {
                    Ok(server) => {
                        tracing::info!(port = server.port, "plugin server 시작");
                        let emit_handle = plugin_handle.clone();
                        server.set_emit_callback(move |ctx, msg| {
                            let _ = emit_handle.emit("plugin_native_message", (ctx, msg));
                        });
                        let mut guard = plugin_state.lock().await;
                        *guard = Some(server);
                    }
                    Err(e) => {
                        tracing::error!(error = ?e, "plugin server 시작 실패");
                    }
                }
            });

            // --minimized 인자가 있으면 창 숨김 시작
            let args: Vec<String> = std::env::args().collect();
            if !args.iter().any(|a| a == "--minimized") {
                // 윈도우 라벨 = "editor" (tauri.conf.json) — 기존 "main" 조회는 항상 None 이던 잠재 결함
                if let Some(window) = app.get_webview_window("editor") {
                    let _ = window.show();
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // 창 닫기 → 종료가 아니라 hide (트레이로 최소화)
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
}

/// `~/.cubelist/hotkeys.json` 로드 → 매핑된 단축키마다 핸들러 등록.
///
/// 실패 시 trace warning만 — 헬퍼 자체는 정상 기동.
#[cfg(feature = "gui")]
fn register_hotkeys(app: &mut tauri::App) {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

    let cfg = match hotkeys::load() {
        Ok(c) => c,
        Err(e) => {
            tracing::warn!(error = ?e, "hotkey 설정 로드 실패 — 매핑 등록 건너뜀");
            return;
        }
    };

    let gs = app.global_shortcut();

    // PlayMode 전역 토글 — 기본 ctrl+alt+p, hotkeys.json playmode_toggle 로 변경/비활성("")
    let toggle_raw = cfg
        .playmode_toggle
        .clone()
        .unwrap_or_else(|| hotkeys::DEFAULT_PLAYMODE_TOGGLE.into());
    if !toggle_raw.is_empty() {
        match hotkeys::normalize_shortcut(&toggle_raw) {
            Ok(shortcut) => {
                match gs.on_shortcut(shortcut.as_str(), |app, _shortcut, event| {
                    if event.state != ShortcutState::Pressed {
                        return;
                    }
                    // 트레이에 숨어 있어도 창을 앞으로 — 전역 토글의 존재 이유
                    if let Some(window) = app.get_webview_window("editor") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                    if let Err(e) = app.emit("playmode_toggle", ()) {
                        tracing::warn!(error = ?e, "playmode_toggle emit 실패");
                    }
                }) {
                    Ok(_) => tracing::info!(shortcut = %shortcut, "PlayMode 토글 핫키 등록"),
                    Err(e) => tracing::warn!(shortcut = %shortcut, error = ?e, "PlayMode 토글 등록 실패"),
                }
            }
            Err(e) => tracing::warn!(raw = %toggle_raw, error = ?e, "PlayMode 토글 표기 무효"),
        }
    }

    if cfg.bindings.is_empty() {
        tracing::info!("등록된 핫키 없음");
        return;
    }

    for binding in cfg.bindings {
        let shortcut_str = match hotkeys::normalize_shortcut(&binding.shortcut) {
            Ok(s) => s,
            Err(e) => {
                tracing::warn!(shortcut = %binding.shortcut, error = ?e, "단축키 표기 무효");
                continue;
            }
        };

        let action = binding.action.clone();
        let label = binding.label.clone().unwrap_or_else(|| shortcut_str.clone());

        match gs.on_shortcut(shortcut_str.as_str(), move |_app, _shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }
            let action = action.clone();
            let label = label.clone();
            tauri::async_runtime::spawn(async move {
                match actions::execute(&action).await {
                    Ok(_) => tracing::info!(%label, "hotkey 실행"),
                    Err(e) => tracing::warn!(%label, error = ?e, "hotkey 실행 실패"),
                }
            });
        }) {
            Ok(_) => tracing::info!(shortcut = %shortcut_str, "hotkey 등록"),
            Err(e) => tracing::warn!(
                shortcut = %shortcut_str,
                error = ?e,
                "hotkey 등록 실패 (이미 사용 중이거나 OS 권한 부족)",
            ),
        }
    }
}
