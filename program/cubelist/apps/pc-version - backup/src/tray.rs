//! 시스템 트레이 메뉴
//!
//! 정착본: tech-review.md §4 — Tauri v2 tauri::tray 모듈

#![cfg(feature = "gui")]

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

pub fn install(app: &mut tauri::App) -> tauri::Result<()> {
    let handle = app.handle();

    let item_show = MenuItem::with_id(handle, "show", "큐브 리스트 열기", true, None::<&str>)?;
    let item_pair = MenuItem::with_id(handle, "pair", "기기 페어링 (QR)", true, None::<&str>)?;
    let item_status = MenuItem::with_id(handle, "status", "서버 상태", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(handle)?;
    let item_quit = MenuItem::with_id(handle, "quit", "종료", true, None::<&str>)?;

    let menu = Menu::with_items(handle, &[&item_show, &item_pair, &item_status, &sep, &item_quit])?;

    TrayIconBuilder::with_id("main")
        .tooltip("큐브 리스트 (리버스 스테이션)")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "show" => show_main_window(app),
            "pair" => show_pairing_window(app),
            "status" => show_status_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            // 좌클릭 = 창 토글
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_main_window(tray.app_handle());
            }
        })
        .build(handle)?;

    Ok(())
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn toggle_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        match window.is_visible() {
            Ok(true) => {
                let _ = window.hide();
            }
            _ => {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    }
}

fn show_pairing_window(app: &AppHandle) {
    show_main_window(app);
    let _ = app.emit("navigate", "pair");
}

fn show_status_window(app: &AppHandle) {
    show_main_window(app);
    let _ = app.emit("navigate", "status");
}
