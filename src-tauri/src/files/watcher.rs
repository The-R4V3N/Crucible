use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc;
use tauri::{AppHandle, Emitter};

/// Payload for file change events sent to the frontend.
#[derive(Clone, serde::Serialize)]
pub struct FileChangedPayload {
    /// Path of the changed file.
    pub path: String,
    /// Kind of change: "create", "modify", "remove", or "other".
    pub kind: String,
}

/// Start watching a directory for file changes. Emits `file:changed` events.
/// Returns a handle that stops watching when dropped.
pub fn start_watcher(
    app: AppHandle,
    watch_path: &str,
) -> Result<RecommendedWatcher, String> {
    let (tx, rx) = mpsc::channel::<Result<Event, notify::Error>>();

    let mut watcher = RecommendedWatcher::new(tx, Config::default())
        .map_err(|e| format!("failed to create watcher: {e}"))?;

    watcher
        .watch(Path::new(watch_path), RecursiveMode::Recursive)
        .map_err(|e| format!("failed to watch path: {e}"))?;

    // Spawn a thread to process file events
    std::thread::spawn(move || {
        for event in rx.into_iter().flatten() {
                let kind = match event.kind {
                    notify::EventKind::Create(_) => "create",
                    notify::EventKind::Modify(_) => "modify",
                    notify::EventKind::Remove(_) => "remove",
                    _ => "other",
                };

                for path in &event.paths {
                    let _ = app.emit(
                        "file:changed",
                        FileChangedPayload {
                            path: path.to_string_lossy().to_string(),
                            kind: kind.to_string(),
                        },
                    );
                }
        }
    });

    Ok(watcher)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    #[test]
    fn test_file_changed_payload_serializes() {
        let payload = FileChangedPayload {
            path: "/tmp/test.rs".to_string(),
            kind: "modify".to_string(),
        };
        let json = serde_json::to_string(&payload).unwrap();
        assert!(json.contains("test.rs"));
        assert!(json.contains("modify"));
    }

    #[test]
    fn test_watcher_fails_on_nonexistent_path() {
        // We can't test start_watcher directly without AppHandle,
        // but we can test the underlying notify watcher
        let (tx, _rx) = mpsc::channel();
        let mut watcher = RecommendedWatcher::new(tx, Config::default()).unwrap();
        let result = watcher.watch(
            Path::new("/nonexistent/warp/path"),
            RecursiveMode::Recursive,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_watcher_watches_valid_directory() {
        let dir = std::env::temp_dir().join("warp_watcher_test");
        fs::create_dir_all(&dir).unwrap();

        let (tx, _rx) = mpsc::channel();
        let mut watcher = RecommendedWatcher::new(tx, Config::default()).unwrap();
        let result = watcher.watch(&dir, RecursiveMode::Recursive);
        assert!(result.is_ok());

        let _ = fs::remove_dir_all(&dir);
    }
}
