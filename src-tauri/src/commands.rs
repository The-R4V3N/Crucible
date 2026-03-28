use std::io::Read;
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

use crate::config::WarpConfig;
use crate::files::{self, FileNode, SearchMatch};
use crate::git::{git_commit, git_discard, git_stage, git_unstage, FileDiff, GitStatus};
use crate::pty::PtyManager;

/// Shared PTY manager state, wrapped in a Mutex for thread safety.
pub struct PtyState(pub Mutex<PtyManager>);

/// Create a new PTY session with the given working directory and command.
/// Returns the session ID.
#[tauri::command]
pub fn pty_create(
    app: AppHandle,
    state: State<'_, PtyState>,
    path: String,
    command: Option<String>,
) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();
    let cmd = command.unwrap_or_else(|| "powershell.exe".to_string());

    let mut manager = state.0.lock().map_err(|e| e.to_string())?;
    manager
        .create_session(id.clone(), &path, &cmd)
        .map_err(|e| e.to_string())?;

    // Take the reader and spawn a thread to emit output events
    let reader = {
        let session = manager.get_session(&id).map_err(|e| e.to_string())?;
        session.take_reader().map_err(|e| e.to_string())?
    };

    let session_id = id.clone();
    let app_handle = app.clone();
    std::thread::spawn(move || {
        read_pty_output(reader, &session_id, &app_handle);
    });

    Ok(id)
}

/// Write data to a PTY session.
#[tauri::command]
pub fn pty_write(state: State<'_, PtyState>, session_id: String, data: String) -> Result<(), String> {
    let manager = state.0.lock().map_err(|e| e.to_string())?;
    manager
        .write_to_session(&session_id, data.as_bytes())
        .map_err(|e| e.to_string())
}

/// Resize a PTY session.
#[tauri::command]
pub fn pty_resize(
    state: State<'_, PtyState>,
    session_id: String,
    rows: u16,
    cols: u16,
) -> Result<(), String> {
    let manager = state.0.lock().map_err(|e| e.to_string())?;
    manager
        .resize_session(&session_id, rows, cols)
        .map_err(|e| e.to_string())
}

/// Kill a PTY session.
#[tauri::command]
pub fn pty_kill(state: State<'_, PtyState>, session_id: String) -> Result<(), String> {
    let mut manager = state.0.lock().map_err(|e| e.to_string())?;
    manager
        .kill_session(&session_id)
        .map_err(|e| e.to_string())
}

/// Payload for PTY output events sent to the frontend.
#[derive(Clone, serde::Serialize)]
struct PtyOutputPayload {
    session_id: String,
    data: String,
}

/// Payload for PTY exit events sent to the frontend.
#[derive(Clone, serde::Serialize)]
struct PtyExitPayload {
    session_id: String,
    code: Option<u32>,
}

/// Resolve the default config file path by searching known locations.
/// If no file exists, returns the preferred write path (project root in dev).
fn resolve_config_path() -> Result<std::path::PathBuf, String> {
    let exe_dir = std::env::current_exe()
        .map_err(|e| e.to_string())?
        .parent()
        .ok_or("cannot determine exe directory")?
        .to_path_buf();
    // In dev mode, exe is at src-tauri/target/debug/warp.exe
    // Prefer the project root (3 levels up) to avoid writing inside src-tauri/
    // which triggers the tauri dev watcher and restarts the app.
    let candidates = [
        exe_dir.join("../../../warp_config.json"),
        exe_dir.join("warp_config.json"),
        std::path::PathBuf::from("warp_config.json"),
    ];
    // Return existing file if found
    if let Some(path) = candidates.iter().find(|p| p.exists()) {
        return Ok(path.clone());
    }
    // No file exists — return the preferred write location (first candidate)
    Ok(candidates[0].clone())
}

/// Load the WARP configuration from the given path, or the default location.
/// Creates a default config file if none exists.
#[tauri::command]
pub fn config_load(path: Option<String>) -> Result<WarpConfig, String> {
    let config_path = match path {
        Some(p) => std::path::PathBuf::from(p),
        None => resolve_config_path()?,
    };
    if !config_path.exists() {
        // Create a default config so first-run works out of the box
        let default_config = WarpConfig {
            projects: vec![],
            theme: "dark".to_string(),
            accent_color: "#00E5FF".to_string(),
            font_family: "Cascadia Code".to_string(),
            font_size: 14,
            sidebar_width: 240,
            notifications: crate::config::schema::NotificationConfig::default(),
            active_project: None,
        };
        crate::config::schema::save_config(&default_config, &config_path)?;
        return Ok(default_config);
    }
    crate::config::schema::load_config(&config_path)
}

/// Save the WARP configuration to the given path, or the resolved default.
#[tauri::command]
pub fn config_save(config: WarpConfig, path: Option<String>) -> Result<(), String> {
    let config_path = match path {
        Some(p) => std::path::PathBuf::from(p),
        None => resolve_config_path()?,
    };
    crate::config::schema::save_config(&config, &config_path)
}

/// Get git status for a repository at the given path.
#[tauri::command]
pub fn git_status(path: String) -> Result<GitStatus, String> {
    crate::git::status::get_git_status(&path)
}

/// Get the diff for a specific file in the working directory.
#[tauri::command]
pub fn git_diff(repo_path: String, file_path: String) -> Result<FileDiff, String> {
    crate::git::diff::get_file_diff(&repo_path, &file_path)
}

/// Stage a file (add to the git index).
#[tauri::command]
pub fn git_stage_file(repo_path: String, file_path: String) -> Result<(), String> {
    git_stage(&repo_path, &file_path)
}

/// Unstage a file (restore index entry to HEAD state).
#[tauri::command]
pub fn git_unstage_file(repo_path: String, file_path: String) -> Result<(), String> {
    git_unstage(&repo_path, &file_path)
}

/// Discard working-tree changes to a file (restore from HEAD).
#[tauri::command]
pub fn git_discard_file(repo_path: String, file_path: String) -> Result<(), String> {
    git_discard(&repo_path, &file_path)
}

/// Create a commit with all currently staged changes.
#[tauri::command]
pub fn git_commit_changes(repo_path: String, message: String) -> Result<(), String> {
    git_commit(&repo_path, &message)
}

/// Get the file tree for a directory.
#[tauri::command]
pub fn file_tree(path: String, max_depth: Option<usize>) -> Result<FileNode, String> {
    files::build_tree(
        &std::path::PathBuf::from(&path),
        max_depth.unwrap_or(5),
    )
}

/// Read a file's contents.
#[tauri::command]
pub fn file_read(path: String) -> Result<String, String> {
    files::read_file(&std::path::PathBuf::from(&path))
}

/// Write content to a file.
#[tauri::command]
pub fn file_write(path: String, content: String) -> Result<(), String> {
    files::write_file(&std::path::PathBuf::from(&path), &content)
}

/// Search for a pattern in project files.
#[tauri::command]
pub fn file_search(
    path: String,
    query: String,
    max_results: Option<usize>,
) -> Result<Vec<SearchMatch>, String> {
    files::search_files(
        &std::path::PathBuf::from(&path),
        &query,
        max_results.unwrap_or(100),
    )
}

/// Start watching a directory for file changes.
#[tauri::command]
pub fn file_watch_start(app: AppHandle, path: String) -> Result<(), String> {
    // Start the watcher — it runs in a background thread
    // The watcher handle is intentionally leaked to keep it alive
    let watcher = files::start_watcher(app, &path)?;
    // Leak the watcher so it keeps running until the app exits
    std::mem::forget(watcher);
    Ok(())
}

/// Payload for attention events sent to the frontend.
#[derive(Clone, serde::Serialize)]
struct PtyAttentionPayload {
    session_id: String,
    needs_attention: bool,
}

/// Read PTY output in a loop and emit events to the frontend.
fn read_pty_output(mut reader: Box<dyn Read + Send>, session_id: &str, app: &AppHandle) {
    let mut buf = [0u8; 4096];
    let mut attention = crate::pty::AttentionDetector::new();
    loop {
        match reader.read(&mut buf) {
            Ok(0) => {
                // EOF — process exited
                let _ = app.emit(
                    "pty:exit",
                    PtyExitPayload {
                        session_id: session_id.to_string(),
                        code: None,
                    },
                );
                break;
            }
            Ok(n) => {
                // Convert to string, replacing invalid UTF-8
                let data = String::from_utf8_lossy(&buf[..n]).to_string();
                let _ = app.emit(
                    "pty:output",
                    PtyOutputPayload {
                        session_id: session_id.to_string(),
                        data: data.clone(),
                    },
                );

                // Check for attention patterns
                if attention.process_output(&data) {
                    let _ = app.emit(
                        "pty:attention",
                        PtyAttentionPayload {
                            session_id: session_id.to_string(),
                            needs_attention: true,
                        },
                    );
                }
            }
            Err(_) => {
                let _ = app.emit(
                    "pty:exit",
                    PtyExitPayload {
                        session_id: session_id.to_string(),
                        code: Some(1),
                    },
                );
                break;
            }
        }
    }
}
