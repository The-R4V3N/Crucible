/// PTY-related errors.
#[derive(Debug, thiserror::Error)]
pub enum PtyError {
    /// Failed to spawn a new PTY session.
    #[error("failed to spawn PTY: {0}")]
    SpawnFailed(String),

    /// Failed to write data to PTY.
    #[error("failed to write to PTY: {0}")]
    WriteFailed(String),

    /// Failed to resize PTY.
    #[error("failed to resize PTY: {0}")]
    ResizeFailed(String),

    /// Failed to kill PTY process.
    #[error("failed to kill PTY: {0}")]
    KillFailed(String),

    /// Session with given ID was not found.
    #[error("session not found: {0}")]
    SessionNotFound(String),
}
