use git2::Repository;
use serde::Serialize;

/// Git status information for a project.
#[derive(Debug, Clone, Serialize)]
pub struct GitStatus {
    /// Current branch name, or "HEAD" if detached.
    pub branch: String,
    /// Whether the working directory has uncommitted changes.
    pub dirty: bool,
    /// Total number of changed files (staged + unstaged + untracked, deduplicated).
    pub changed_files: usize,
    /// All changed file paths (union of staged, unstaged, untracked).
    pub changed_file_paths: Vec<String>,
    /// Files staged in the index (ready to commit).
    pub staged_files: Vec<String>,
    /// Tracked files with working-tree changes not yet staged.
    pub unstaged_files: Vec<String>,
    /// New files not yet tracked by git.
    pub untracked_files: Vec<String>,
}

/// Get the git status for a repository at the given path.
pub fn get_git_status(path: &str) -> Result<GitStatus, String> {
    let repo = Repository::discover(path)
        .map_err(|e| format!("not a git repository: {e}"))?;

    let branch = get_branch_name(&repo);
    let (dirty, changed_files, changed_file_paths, staged_files, unstaged_files, untracked_files) =
        get_dirty_status(&repo);

    Ok(GitStatus {
        branch,
        dirty,
        changed_files,
        changed_file_paths,
        staged_files,
        unstaged_files,
        untracked_files,
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

/// Check dirty state and categorise changed files into staged, unstaged, and untracked.
///
/// Returns `(dirty, total, all_paths, staged, unstaged, untracked)`.
/// A file with both index AND working-tree changes appears in both `staged` and `unstaged`.
fn get_dirty_status(
    repo: &Repository,
) -> (bool, usize, Vec<String>, Vec<String>, Vec<String>, Vec<String>) {
    let mut opts = git2::StatusOptions::new();
    opts.include_untracked(true).recurse_untracked_dirs(false);

    match repo.statuses(Some(&mut opts)) {
        Ok(statuses) => {
            let mut all_paths: Vec<String> = Vec::new();
            let mut staged: Vec<String> = Vec::new();
            let mut unstaged: Vec<String> = Vec::new();
            let mut untracked: Vec<String> = Vec::new();

            for entry in statuses.iter() {
                let s = entry.status();
                let path = match entry.path() {
                    Some(p) => p.to_string(),
                    None => continue,
                };

                all_paths.push(path.clone());

                // Index changes → staged
                if s.intersects(
                    git2::Status::INDEX_NEW
                        | git2::Status::INDEX_MODIFIED
                        | git2::Status::INDEX_DELETED
                        | git2::Status::INDEX_RENAMED
                        | git2::Status::INDEX_TYPECHANGE,
                ) {
                    staged.push(path.clone());
                }

                // New file not tracked → untracked (mutually exclusive with unstaged)
                if s.contains(git2::Status::WT_NEW) {
                    untracked.push(path.clone());
                } else if s.intersects(
                    git2::Status::WT_MODIFIED
                        | git2::Status::WT_DELETED
                        | git2::Status::WT_TYPECHANGE
                        | git2::Status::WT_RENAMED,
                ) {
                    unstaged.push(path.clone());
                }
            }

            let total = all_paths.len();
            (total > 0, total, all_paths, staged, unstaged, untracked)
        }
        Err(_) => (
            false,
            0,
            Vec::new(),
            Vec::new(),
            Vec::new(),
            Vec::new(),
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_git_status_on_current_repo() {
        // The Crucible repo itself is a git repo, so this should work
        let result = get_git_status(".");
        assert!(result.is_ok(), "git status failed: {:?}", result.err());
        let status = result.unwrap();
        assert!(!status.branch.is_empty());
    }

    #[test]
    fn test_git_status_not_a_repo() {
        let dir = std::env::temp_dir().join("crucible_test_not_git");
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
        // changed_files is usize so always non-negative — just verify it compiles
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

    #[test]
    fn test_git_status_has_staged_unstaged_untracked_fields() {
        let result = get_git_status(".").unwrap();
        // These fields must exist and be Vec<String>
        let _staged: &Vec<String> = &result.staged_files;
        let _unstaged: &Vec<String> = &result.unstaged_files;
        let _untracked: &Vec<String> = &result.untracked_files;
    }

    #[test]
    fn test_git_status_categorised_paths_cover_all_changed() {
        let result = get_git_status(".").unwrap();
        // Every path in changed_file_paths must appear in at least one category
        for path in &result.changed_file_paths {
            let in_any = result.staged_files.contains(path)
                || result.unstaged_files.contains(path)
                || result.untracked_files.contains(path);
            assert!(in_any, "path '{path}' not in staged, unstaged, or untracked");
        }
    }

    #[test]
    fn test_git_status_no_path_overlap_between_unstaged_and_untracked() {
        let result = get_git_status(".").unwrap();
        // A file cannot be both unstaged (tracked worktree change) and untracked (new file)
        for path in &result.untracked_files {
            assert!(
                !result.unstaged_files.contains(path),
                "path '{path}' appears in both unstaged and untracked"
            );
        }
    }
}
