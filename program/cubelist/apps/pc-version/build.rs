// Tauri v2 build script.
// gui feature 활성 시에만 tauri_build 실행.

fn main() {
    #[cfg(feature = "gui")]
    tauri_build::build();
}
