//! 큐브 리스트 PC 헬퍼 — 라이브러리 진입점
//!
//! `gui` feature 활성 시 `run_tauri()` 로 Tauri 앱 기동.
//! 비활성 시에는 main.rs가 직접 ws_server만 실행.

pub mod actions;
pub mod auth;
pub mod commands;
pub mod hotkeys;
pub mod plugins;
pub mod protocol;
pub mod ws_server;

#[cfg(feature = "gui")]
pub mod tray;

#[cfg(feature = "gui")]
use tauri::{Emitter, Manager};

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

            // --minimized 인자가 있으면 창 숨김 시작
            let args: Vec<String> = std::env::args().collect();
            if !args.iter().any(|a| a == "--minimized") {
                if let Some(window) = app.get_webview_window("main") {
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

    if cfg.bindings.is_empty() {
        tracing::info!("등록된 핫키 없음");
        return;
    }

    let gs = app.global_shortcut();

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
