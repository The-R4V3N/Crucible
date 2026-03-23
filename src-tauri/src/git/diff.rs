use git2::Repository;
use serde::Serialize;

/// A single file diff entry.
#[derive(Debug, Clone, Serialize)]
pub struct FileDiff {
    /// Path of the changed file (relative to repo root).
    pub path: String,
    /// The old (original) content, or empty for new files.
    pub old_content: String,
    /// The new (modified) content, or empty for deleted files.
    pub new_content: String,
}

/// Get the diff (old vs new content) for a specific file in the working directory.
pub fn get_file_diff(repo_path: &str, file_path: &str) -> Result<FileDiff, String> {
    let repo = Repository::discover(repo_path)
        .map_err(|e| format!("not a git repository: {e}"))?;

    let workdir = repo
        .workdir()
        .ok_or("bare repository, no working directory")?;

    let relative_path = if file_path.starts_with(workdir.to_string_lossy().as_ref()) {
        file_path
            .strip_prefix(workdir.to_string_lossy().as_ref())
            .unwrap_or(file_path)
    } else {
        file_path
    };
    let relative_path = relative_path.replace('\\', "/");

    // Get the HEAD version of the file
    let old_content = get_head_content(&repo, &relative_path).unwrap_or_default();

    // Get the working directory version
    let full_path = workdir.join(&relative_path);
    let new_content = std::fs::read_to_string(&full_path)
        .unwrap_or_default();

    Ok(FileDiff {
        path: relative_path,
        old_content,
        new_content,
    })
}

/// Read the content of a file from HEAD.
fn get_head_content(repo: &Repository, path: &str) -> Result<String, String> {
    let head = repo.head().map_err(|e| e.to_string())?;
    let tree = head
        .peel_to_tree()
        .map_err(|e| e.to_string())?;

    let entry = tree
        .get_path(std::path::Path::new(path))
        .map_err(|e| e.to_string())?;

    let blob = repo
        .find_blob(entry.id())
        .map_err(|e| e.to_string())?;

    String::from_utf8(blob.content().to_vec())
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_file_diff_on_tracked_file() {
        // Use a file that exists in the repo and HEAD
        let result = get_file_diff(".", "ARCHITECTURE.md");
        assert!(result.is_ok(), "diff failed: {:?}", result.err());
        let diff = result.unwrap();
        assert!(!diff.old_content.is_empty(), "HEAD content should exist");
        assert!(!diff.new_content.is_empty(), "working dir content should exist");
    }

    #[test]
    fn test_get_file_diff_not_a_repo() {
        let dir = std::env::temp_dir().join("warp_diff_not_repo");
        std::fs::create_dir_all(&dir).unwrap();

        let result = get_file_diff(dir.to_str().unwrap(), "test.txt");
        assert!(result.is_err());

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_get_file_diff_untracked_file_has_empty_old() {
        // A file that doesn't exist in HEAD will have empty old_content
        let result = get_file_diff(".", "nonexistent_file_xyz.txt");
        assert!(result.is_ok());
        let diff = result.unwrap();
        assert!(diff.old_content.is_empty());
    }

    #[test]
    fn test_file_diff_serializes() {
        let diff = FileDiff {
            path: "test.rs".to_string(),
            old_content: "old".to_string(),
            new_content: "new".to_string(),
        };
        let json = serde_json::to_string(&diff).unwrap();
        assert!(json.contains("test.rs"));
    }
}
