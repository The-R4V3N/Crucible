use std::io::{Read, Write};
use std::sync::{Arc, Mutex};

use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};

use super::error::PtyError;

/// Represents the current state of a PTY session.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    /// Session has been created but PTY not yet spawned.
    Starting,
    /// PTY process is running.
    Running,
    /// PTY process has exited.
    Stopped,
    /// PTY failed to start or encountered an error.
    Error,
}

/// A single PTY session wrapping a pseudo-terminal process.
///
/// Contains non-Debug PTY handles, so Debug is manually implemented.
pub struct PtySession {
    /// Unique session identifier.
    pub id: String,
    /// Current session status.
    pub status: SessionStatus,
    /// The PTY master handle (for write/resize).
    master: Option<Arc<Mutex<Box<dyn MasterPty + Send>>>>,
    /// The child process handle.
    child: Option<Arc<Mutex<Box<dyn Child + Send + Sync>>>>,
    /// Writer end of the PTY.
    writer: Option<Arc<Mutex<Box<dyn Write + Send>>>>,
}

impl std::fmt::Debug for PtySession {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("PtySession")
            .field("id", &self.id)
            .field("status", &self.status)
            .finish_non_exhaustive()
    }
}

impl PtySession {
    /// Create a new PTY session with the given ID. Starts in `Starting` status.
    pub fn new(id: String) -> Self {
        Self {
            id,
            status: SessionStatus::Starting,
            master: None,
            child: None,
            writer: None,
        }
    }

    /// Spawn a PTY process with the given command in the specified directory.
    pub fn spawn(&mut self, cwd: &str, command: &str) -> Result<(), PtyError> {
        let pty_system = native_pty_system();

        let pair = pty_system
            .openpty(PtySize {
                rows: 24,
                cols: 80,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| PtyError::SpawnFailed(e.to_string()))?;

        let mut cmd = CommandBuilder::new(command);
        cmd.cwd(cwd);

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| PtyError::SpawnFailed(e.to_string()))?;

        let writer = pair
            .master
            .take_writer()
            .map_err(|e| PtyError::SpawnFailed(e.to_string()))?;

        self.master = Some(Arc::new(Mutex::new(pair.master)));
        self.child = Some(Arc::new(Mutex::new(child)));
        self.writer = Some(Arc::new(Mutex::new(writer)));
        self.status = SessionStatus::Running;

        Ok(())
    }

    /// Take a reader from the PTY master for reading output.
    /// This can only be called once — the reader is consumed.
    pub fn take_reader(&self) -> Result<Box<dyn Read + Send>, PtyError> {
        let master = self
            .master
            .as_ref()
            .ok_or_else(|| PtyError::SpawnFailed("session not spawned".to_string()))?;

        let master = master
            .lock()
            .map_err(|e| PtyError::SpawnFailed(e.to_string()))?;

        master
            .try_clone_reader()
            .map_err(|e| PtyError::SpawnFailed(e.to_string()))
    }

    /// Write data to the PTY stdin.
    pub fn write(&self, data: &[u8]) -> Result<(), PtyError> {
        let writer = self
            .writer
            .as_ref()
            .ok_or_else(|| PtyError::WriteFailed("no writer available".to_string()))?;

        let mut writer = writer
            .lock()
            .map_err(|e| PtyError::WriteFailed(e.to_string()))?;

        writer
            .write_all(data)
            .map_err(|e| PtyError::WriteFailed(e.to_string()))?;

        writer
            .flush()
            .map_err(|e| PtyError::WriteFailed(e.to_string()))?;

        Ok(())
    }

    /// Resize the PTY to the given dimensions.
    pub fn resize(&self, rows: u16, cols: u16) -> Result<(), PtyError> {
        let master = self
            .master
            .as_ref()
            .ok_or_else(|| PtyError::ResizeFailed("session not spawned".to_string()))?;

        let master = master
            .lock()
            .map_err(|e| PtyError::ResizeFailed(e.to_string()))?;

        master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| PtyError::ResizeFailed(e.to_string()))
    }

    /// Kill the PTY child process.
    pub fn kill(&mut self) -> Result<(), PtyError> {
        let child = self
            .child
            .as_ref()
            .ok_or_else(|| PtyError::KillFailed("no child process".to_string()))?;

        let mut child = child
            .lock()
            .map_err(|e| PtyError::KillFailed(e.to_string()))?;

        child
            .kill()
            .map_err(|e| PtyError::KillFailed(e.to_string()))?;

        self.status = SessionStatus::Stopped;
        Ok(())
    }

    /// Check if the child process has exited. Returns the exit code if it has.
    pub fn try_wait(&mut self) -> Result<Option<u32>, PtyError> {
        let child = self
            .child
            .as_ref()
            .ok_or_else(|| PtyError::KillFailed("no child process".to_string()))?;

        let mut child = child
            .lock()
            .map_err(|e| PtyError::KillFailed(e.to_string()))?;

        match child.try_wait() {
            Ok(Some(status)) => {
                self.status = SessionStatus::Stopped;
                Ok(Some(status.exit_code()))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(PtyError::KillFailed(e.to_string())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_starts_in_starting_state() {
        let session = PtySession::new("test-1".to_string());
        assert_eq!(session.status, SessionStatus::Starting);
        assert_eq!(session.id, "test-1");
    }

    #[test]
    fn test_session_spawn_sets_running() {
        let mut session = PtySession::new("test-2".to_string());
        // Spawn powershell (available on all Windows machines)
        let result = session.spawn(".", "powershell.exe");
        assert!(result.is_ok(), "spawn failed: {:?}", result.err());
        assert_eq!(session.status, SessionStatus::Running);
        // Clean up
        let _ = session.kill();
    }

    #[test]
    fn test_session_write_sends_data() {
        let mut session = PtySession::new("test-3".to_string());
        session.spawn(".", "powershell.exe").unwrap();
        // Writing should succeed on a running session
        let result = session.write(b"echo hello\r\n");
        assert!(result.is_ok(), "write failed: {:?}", result.err());
        // Clean up
        let _ = session.kill();
    }

    #[test]
    fn test_session_resize() {
        let mut session = PtySession::new("test-4".to_string());
        session.spawn(".", "powershell.exe").unwrap();
        let result = session.resize(40, 120);
        assert!(result.is_ok(), "resize failed: {:?}", result.err());
        // Clean up
        let _ = session.kill();
    }

    #[test]
    fn test_session_kill() {
        let mut session = PtySession::new("test-5".to_string());
        session.spawn(".", "powershell.exe").unwrap();
        let result = session.kill();
        assert!(result.is_ok(), "kill failed: {:?}", result.err());
        assert_eq!(session.status, SessionStatus::Stopped);
    }

    #[test]
    fn test_session_write_fails_without_spawn() {
        let session = PtySession::new("test-6".to_string());
        let result = session.write(b"hello");
        assert!(result.is_err());
    }

    #[test]
    fn test_session_resize_fails_without_spawn() {
        let session = PtySession::new("test-7".to_string());
        let result = session.resize(24, 80);
        assert!(result.is_err());
    }

    #[test]
    fn test_session_kill_fails_without_spawn() {
        let mut session = PtySession::new("test-8".to_string());
        let result = session.kill();
        assert!(result.is_err());
    }

    #[test]
    fn test_session_output_reader() {
        let mut session = PtySession::new("test-9".to_string());
        session.spawn(".", "powershell.exe").unwrap();
        let reader = session.take_reader();
        assert!(reader.is_ok(), "take_reader failed: {:?}", reader.err());
        // Clean up
        let _ = session.kill();
    }
}
