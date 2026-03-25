// WARP — AI agent IDE for Windows
// Module root. Registers Tauri plugins and IPC commands.

pub mod commands;
pub mod config;
pub mod files;
pub mod git;
pub mod pty;

use commands::PtyState;
use pty::PtyManager;
use std::sync::Mutex;

/// Run the Tauri application.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(PtyState(Mutex::new(PtyManager::new())))
        .invoke_handler(tauri::generate_handler![
            commands::pty_create,
            commands::pty_write,
            commands::pty_resize,
            commands::pty_kill,
            commands::config_load,
            commands::config_save,
            commands::git_status,
            commands::git_diff,
            commands::file_tree,
            commands::file_read,
            commands::file_write,
            commands::file_watch_start,
            commands::file_search,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
