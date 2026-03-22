// WARP — AI agent IDE for Windows
// Module root. Registers Tauri plugins and IPC commands.

pub mod pty;

/// Run the Tauri application.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
