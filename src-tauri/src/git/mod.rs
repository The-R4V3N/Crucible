pub mod diff;
pub mod ops;
pub mod status;

pub use diff::FileDiff;
pub use ops::{git_commit, git_discard, git_stage, git_unstage};
pub use status::GitStatus;
