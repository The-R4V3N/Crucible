use std::collections::HashMap;

use super::error::PtyError;
use super::session::{PtySession, SessionStatus};

/// Manages multiple PTY sessions by ID.
pub struct PtyManager {
    sessions: HashMap<String, PtySession>,
}

impl PtyManager {
    /// Create a new empty PTY manager.
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }

    /// Create a new PTY session and spawn a process.
    /// Returns the session ID.
    pub fn create_session(
        &mut self,
        id: String,
        cwd: &str,
        command: &str,
    ) -> Result<String, PtyError> {
        let mut session = PtySession::new(id.clone());
        session.spawn(cwd, command)?;
        self.sessions.insert(id.clone(), session);
        Ok(id)
    }

    /// Get a reference to a session by ID.
    pub fn get_session(&self, id: &str) -> Result<&PtySession, PtyError> {
        self.sessions
            .get(id)
            .ok_or_else(|| PtyError::SessionNotFound(id.to_string()))
    }

    /// Get a mutable reference to a session by ID.
    pub fn get_session_mut(&mut self, id: &str) -> Result<&mut PtySession, PtyError> {
        self.sessions
            .get_mut(id)
            .ok_or_else(|| PtyError::SessionNotFound(id.to_string()))
    }

    /// Write data to a session's PTY.
    pub fn write_to_session(&self, id: &str, data: &[u8]) -> Result<(), PtyError> {
        let session = self.get_session(id)?;
        session.write(data)
    }

    /// Resize a session's PTY.
    pub fn resize_session(&self, id: &str, rows: u16, cols: u16) -> Result<(), PtyError> {
        let session = self.get_session(id)?;
        session.resize(rows, cols)
    }

    /// Kill a session's PTY process.
    pub fn kill_session(&mut self, id: &str) -> Result<(), PtyError> {
        let session = self.get_session_mut(id)?;
        session.kill()
    }

    /// Remove a session from the manager.
    pub fn remove_session(&mut self, id: &str) -> Option<PtySession> {
        self.sessions.remove(id)
    }

    /// Get the status of a session.
    pub fn session_status(&self, id: &str) -> Result<SessionStatus, PtyError> {
        let session = self.get_session(id)?;
        Ok(session.status.clone())
    }
}

impl Default for PtyManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_manager_create_session() {
        let mut manager = PtyManager::new();
        let result = manager.create_session(
            "s1".to_string(),
            ".",
            "powershell.exe",
        );
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "s1");
        // Clean up
        let _ = manager.kill_session("s1");
    }

    #[test]
    fn test_manager_session_not_found() {
        let manager = PtyManager::new();
        let result = manager.get_session("nonexistent");
        assert!(result.is_err());
        match result.unwrap_err() {
            PtyError::SessionNotFound(id) => assert_eq!(id, "nonexistent"),
            other => panic!("expected SessionNotFound, got: {:?}", other),
        }
    }

    #[test]
    fn test_manager_write_to_session() {
        let mut manager = PtyManager::new();
        manager
            .create_session("s2".to_string(), ".", "powershell.exe")
            .unwrap();
        let result = manager.write_to_session("s2", b"echo test\r\n");
        assert!(result.is_ok());
        // Clean up
        let _ = manager.kill_session("s2");
    }

    #[test]
    fn test_manager_kill_session() {
        let mut manager = PtyManager::new();
        manager
            .create_session("s3".to_string(), ".", "powershell.exe")
            .unwrap();
        let result = manager.kill_session("s3");
        assert!(result.is_ok());
        let status = manager.session_status("s3").unwrap();
        assert_eq!(status, SessionStatus::Stopped);
    }

    #[test]
    fn test_manager_resize_session() {
        let mut manager = PtyManager::new();
        manager
            .create_session("s4".to_string(), ".", "powershell.exe")
            .unwrap();
        let result = manager.resize_session("s4", 50, 150);
        assert!(result.is_ok());
        // Clean up
        let _ = manager.kill_session("s4");
    }
}
