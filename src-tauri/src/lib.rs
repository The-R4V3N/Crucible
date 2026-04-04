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
use tauri::Emitter;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Run the Tauri application.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    let ctrl_shift_p = Shortcut::new(
                        Some(Modifiers::CONTROL | Modifiers::SHIFT),
                        Code::KeyP,
                    );
                    let ctrl_p = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyP);
                    if shortcut == &ctrl_shift_p {
                        let _ = app.emit("palette:open-command", ());
                    } else if shortcut == &ctrl_p {
                        let _ = app.emit("palette:open-file", ());
                    }
                })
                .build(),
        )
        .setup(|app| {
            app.global_shortcut().register(Shortcut::new(
                Some(Modifiers::CONTROL | Modifiers::SHIFT),
                Code::KeyP,
            ))?;
            app.global_shortcut()
                .register(Shortcut::new(Some(Modifiers::CONTROL), Code::KeyP))?;
            Ok(())
        })
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
            commands::git_stage_file,
            commands::git_unstage_file,
            commands::git_discard_file,
            commands::git_commit_changes,
            commands::file_tree,
            commands::file_read,
            commands::file_write,
            commands::dir_create,
            commands::file_rename,
            commands::file_delete,
            commands::file_watch_start,
            commands::file_search,
            commands::list_fonts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
