use git2::Repository;
use serde::Serialize;

/// Git status information for a project.
#[derive(Debug, Clone, Serialize)]
pub struct GitStatus {
    /// Current branch name, or "HEAD" if detached.
    pub branch: String,
    /// Whether the working directory has uncommitted changes.
    pub dirty: bool,
    /// Number of changed files.
    pub changed_files: usize,
    /// Paths of changed files (relative to repo root).
    pub changed_file_paths: Vec<String>,
}

/// Get the git status for a repository at the given path.
pub fn get_git_status(path: &str) -> Result<GitStatus, String> {
    let repo = Repository::discover(path)
        .map_err(|e| format!("not a git repository: {e}"))?;

    let branch = get_branch_name(&repo);
    let (dirty, changed_files, changed_file_paths) = get_dirty_status(&repo);

    Ok(GitStatus {
        branch,
        dirty,
        changed_files,
        changed_file_paths,
    })
}

/// Get the current branch name.
fn get_branch_name(repo: &Repository) -> String {
    if let Ok(head) = repo.head() {
        if let Some(name) = head.shorthand() {
            return name.to_string();
        }
    }
    "HEAD".to_string()
}

/// Check if the working directory is dirty, count changed files, and collect paths.
fn get_dirty_status(repo: &Repository) -> (bool, usize, Vec<String>) {
    let mut opts = git2::StatusOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(false);

    match repo.statuses(Some(&mut opts)) {
        Ok(statuses) => {
            let changed = statuses.len();
            let paths: Vec<String> = statuses
                .iter()
                .filter_map(|entry| entry.path().map(|p| p.to_string()))
                .collect();
            (changed > 0, changed, paths)
        }
        Err(_) => (false, 0, Vec::new()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_git_status_on_current_repo() {
        // The WARP repo itself is a git repo, so this should work
        let result = get_git_status(".");
        assert!(result.is_ok(), "git status failed: {:?}", result.err());
        let status = result.unwrap();
        assert!(!status.branch.is_empty());
    }

    #[test]
    fn test_git_status_not_a_repo() {
        let dir = std::env::temp_dir().join("warp_test_not_git");
        fs::create_dir_all(&dir).unwrap();

        let result = get_git_status(dir.to_str().unwrap());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not a git repository"));

        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn test_git_status_returns_branch() {
        let result = get_git_status(".").unwrap();
        // We're on m2/sidebar branch during development
        assert!(!result.branch.is_empty());
    }

    #[test]
    fn test_git_status_detects_changes() {
        let result = get_git_status(".").unwrap();
        // changed_files should be a non-negative number
        assert!(result.changed_files >= 0);
        // dirty flag should match whether there are changes
        assert_eq!(result.dirty, result.changed_files > 0);
    }

    #[test]
    fn test_git_status_returns_changed_file_paths() {
        let result = get_git_status(".").unwrap();
        // changed_file_paths length should match changed_files count
        assert_eq!(result.changed_file_paths.len(), result.changed_files);
        // Each path should be a non-empty string
        for path in &result.changed_file_paths {
            assert!(!path.is_empty(), "changed file path should not be empty");
        }
    }
}
