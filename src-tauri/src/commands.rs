use std::io::Read;
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

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

/// Read PTY output in a loop and emit events to the frontend.
fn read_pty_output(mut reader: Box<dyn Read + Send>, session_id: &str, app: &AppHandle) {
    let mut buf = [0u8; 4096];
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
                        data,
                    },
                );
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
