use git2::Repository;

/// Stage a file (add to the git index).
pub fn git_stage(repo_path: &str, file_path: &str) -> Result<(), String> {
    let repo = Repository::discover(repo_path)
        .map_err(|e| format!("not a git repository: {e}"))?;
    let mut index = repo.index().map_err(|e| e.to_string())?;
    index
        .add_path(std::path::Path::new(file_path))
        .map_err(|e| format!("failed to stage '{file_path}': {e}"))?;
    index.write().map_err(|e| e.to_string())?;
    Ok(())
}

/// Unstage a file (restore index entry to HEAD state, or remove if no HEAD).
pub fn git_unstage(repo_path: &str, file_path: &str) -> Result<(), String> {
    let repo = Repository::discover(repo_path)
        .map_err(|e| format!("not a git repository: {e}"))?;

    match repo.head() {
        Ok(head) => {
            // HEAD exists: reset the index entry to the HEAD tree's version.
            let obj = head
                .peel(git2::ObjectType::Commit)
                .map_err(|e| e.to_string())?;
            repo.reset_default(Some(&obj), std::iter::once(file_path))
                .map_err(|e| format!("failed to unstage '{file_path}': {e}"))?;
        }
        Err(_) => {
            // No HEAD (initial repo): just remove the entry from the index.
            let mut index = repo.index().map_err(|e| e.to_string())?;
            index
                .remove_path(std::path::Path::new(file_path))
                .map_err(|e| format!("failed to unstage '{file_path}': {e}"))?;
            index.write().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Discard working-tree changes to a file (restore content from HEAD).
pub fn git_discard(repo_path: &str, file_path: &str) -> Result<(), String> {
    let repo = Repository::discover(repo_path)
        .map_err(|e| format!("not a git repository: {e}"))?;

    let workdir = repo
        .workdir()
        .ok_or("bare repository has no working directory")?;

    let normalized = file_path.replace('\\', "/");

    let head = repo.head().map_err(|e| e.to_string())?;
    let tree = head.peel_to_tree().map_err(|e| e.to_string())?;
    let entry = tree
        .get_path(std::path::Path::new(&normalized))
        .map_err(|e| format!("'{file_path}' not found in HEAD: {e}"))?;
    let blob = repo
        .find_blob(entry.id())
        .map_err(|e| e.to_string())?;

    let full_path = workdir.join(&normalized);
    std::fs::write(&full_path, blob.content())
        .map_err(|e| format!("failed to write '{file_path}': {e}"))?;

    Ok(())
}

/// Create a commit with all currently staged changes.
pub fn git_commit(repo_path: &str, message: &str) -> Result<(), String> {
    if message.trim().is_empty() {
        return Err("commit message cannot be empty".to_string());
    }

    let repo = Repository::discover(repo_path)
        .map_err(|e| format!("not a git repository: {e}"))?;

    let config = repo.config().map_err(|e| e.to_string())?;
    let name = config
        .get_string("user.name")
        .unwrap_or_else(|_| "WARP User".to_string());
    let email = config
        .get_string("user.email")
        .unwrap_or_else(|_| "warp@example.com".to_string());
    let sig = git2::Signature::now(&name, &email).map_err(|e| e.to_string())?;

    let mut index = repo.index().map_err(|e| e.to_string())?;
    let tree_id = index.write_tree().map_err(|e| e.to_string())?;
    let tree = repo.find_tree(tree_id).map_err(|e| e.to_string())?;

    let parents: Vec<git2::Commit> = match repo.head() {
        Ok(head) => vec![head.peel_to_commit().map_err(|e| e.to_string())?],
        Err(_) => vec![],
    };
    let parent_refs: Vec<&git2::Commit> = parents.iter().collect();

    repo.commit(Some("HEAD"), &sig, &sig, message, &tree, &parent_refs)
        .map_err(|e| format!("failed to create commit: {e}"))?;

    Ok(())
}

// ── helpers used only in tests ──────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    /// Initialise a fresh git repo in a unique temp directory.
    fn setup_test_repo(suffix: &str) -> (PathBuf, Repository) {
        let dir = std::env::temp_dir().join(format!("warp_ops_test_{suffix}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        let repo = Repository::init(&dir).unwrap();
        {
            let mut cfg = repo.config().unwrap();
            cfg.set_str("user.name", "Test User").unwrap();
            cfg.set_str("user.email", "test@example.com").unwrap();
        }
        (dir, repo)
    }

    /// Create an initial commit so HEAD exists (required by unstage / discard).
    fn make_initial_commit(repo: &Repository, dir: &PathBuf) {
        let file = dir.join("initial.txt");
        fs::write(&file, "initial content").unwrap();

        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("initial.txt")).unwrap();
        index.write().unwrap();

        let tree_id = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = git2::Signature::now("Test User", "test@example.com").unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "initial commit", &tree, &[])
            .unwrap();
    }

    // ── git_stage ────────────────────────────────────────────────────────────

    #[test]
    fn test_git_stage_adds_file_to_index() {
        let (dir, _repo) = setup_test_repo("stage_add");
        let path = dir.to_str().unwrap();

        fs::write(dir.join("new_file.txt"), "hello").unwrap();

        let result = git_stage(path, "new_file.txt");
        assert!(result.is_ok(), "stage failed: {:?}", result.err());

        let repo = Repository::open(&dir).unwrap();
        let index = repo.index().unwrap();
        assert!(
            index.get_path(std::path::Path::new("new_file.txt"), 0).is_some(),
            "file should be in index after staging"
        );

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_git_stage_returns_error_for_invalid_repo() {
        let dir = std::env::temp_dir().join("warp_not_repo_stage");
        fs::create_dir_all(&dir).unwrap();

        let result = git_stage(dir.to_str().unwrap(), "file.txt");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not a git repository"));

        let _ = fs::remove_dir_all(&dir);
    }

    // ── git_unstage ──────────────────────────────────────────────────────────

    #[test]
    fn test_git_unstage_removes_new_file_from_index() {
        let (dir, repo) = setup_test_repo("unstage_new");
        let path = dir.to_str().unwrap();

        make_initial_commit(&repo, &dir);

        // Stage a brand-new file
        fs::write(dir.join("staged.txt"), "staged content").unwrap();
        git_stage(path, "staged.txt").unwrap();

        // Confirm it's in the index
        {
            let r = Repository::open(&dir).unwrap();
            let idx = r.index().unwrap();
            assert!(idx.get_path(std::path::Path::new("staged.txt"), 0).is_some());
        }

        let result = git_unstage(path, "staged.txt");
        assert!(result.is_ok(), "unstage failed: {:?}", result.err());

        // Confirm it's gone from the index
        let r = Repository::open(&dir).unwrap();
        let idx = r.index().unwrap();
        assert!(
            idx.get_path(std::path::Path::new("staged.txt"), 0).is_none(),
            "file should be removed from index after unstaging"
        );

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_git_unstage_restores_modified_file_in_index() {
        let (dir, repo) = setup_test_repo("unstage_mod");
        let path = dir.to_str().unwrap();

        // Commit initial.txt with "original"
        fs::write(dir.join("initial.txt"), "original").unwrap();
        {
            let mut idx = repo.index().unwrap();
            idx.add_path(std::path::Path::new("initial.txt")).unwrap();
            idx.write().unwrap();
            let tree_id = idx.write_tree().unwrap();
            let tree = repo.find_tree(tree_id).unwrap();
            let sig = git2::Signature::now("Test User", "test@example.com").unwrap();
            repo.commit(Some("HEAD"), &sig, &sig, "initial commit", &tree, &[])
                .unwrap();
        }

        // Modify and stage it
        fs::write(dir.join("initial.txt"), "modified").unwrap();
        git_stage(path, "initial.txt").unwrap();

        // Unstage it — index should revert to HEAD version
        let result = git_unstage(path, "initial.txt");
        assert!(result.is_ok(), "unstage failed: {:?}", result.err());

        // Index entry blob should match HEAD content ("original")
        let r = Repository::open(&dir).unwrap();
        let idx = r.index().unwrap();
        let entry = idx.get_path(std::path::Path::new("initial.txt"), 0)
            .expect("initial.txt should still be in index");
        let blob = r.find_blob(entry.id).unwrap();
        let content = std::str::from_utf8(blob.content()).unwrap();
        assert_eq!(content, "original", "index should be back to HEAD content");

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_git_unstage_returns_error_for_invalid_repo() {
        let dir = std::env::temp_dir().join("warp_not_repo_unstage");
        fs::create_dir_all(&dir).unwrap();

        let result = git_unstage(dir.to_str().unwrap(), "file.txt");
        assert!(result.is_err());

        let _ = fs::remove_dir_all(&dir);
    }

    // ── git_discard ──────────────────────────────────────────────────────────

    #[test]
    fn test_git_discard_reverts_file_to_head_content() {
        let (dir, repo) = setup_test_repo("discard_revert");
        let path = dir.to_str().unwrap();

        // Commit initial.txt with "original content"
        fs::write(dir.join("initial.txt"), "original content").unwrap();
        {
            let mut idx = repo.index().unwrap();
            idx.add_path(std::path::Path::new("initial.txt")).unwrap();
            idx.write().unwrap();
            let tree_id = idx.write_tree().unwrap();
            let tree = repo.find_tree(tree_id).unwrap();
            let sig = git2::Signature::now("Test User", "test@example.com").unwrap();
            repo.commit(Some("HEAD"), &sig, &sig, "initial commit", &tree, &[])
                .unwrap();
        }

        // Modify the file in the working tree
        fs::write(dir.join("initial.txt"), "modified content").unwrap();
        assert_eq!(
            fs::read_to_string(dir.join("initial.txt")).unwrap(),
            "modified content"
        );

        let result = git_discard(path, "initial.txt");
        assert!(result.is_ok(), "discard failed: {:?}", result.err());

        assert_eq!(
            fs::read_to_string(dir.join("initial.txt")).unwrap(),
            "original content",
            "file should be back to HEAD content"
        );

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_git_discard_returns_error_for_invalid_repo() {
        let dir = std::env::temp_dir().join("warp_not_repo_discard");
        fs::create_dir_all(&dir).unwrap();

        let result = git_discard(dir.to_str().unwrap(), "file.txt");
        assert!(result.is_err());

        let _ = fs::remove_dir_all(&dir);
    }

    // ── git_commit ───────────────────────────────────────────────────────────

    #[test]
    fn test_git_commit_creates_commit_with_message() {
        let (dir, repo) = setup_test_repo("commit_msg");
        let path = dir.to_str().unwrap();

        fs::write(dir.join("file.txt"), "content").unwrap();
        git_stage(path, "file.txt").unwrap();

        let result = git_commit(path, "test commit message");
        assert!(result.is_ok(), "commit failed: {:?}", result.err());

        let head = repo.head().unwrap();
        let commit = head.peel_to_commit().unwrap();
        assert_eq!(commit.message().unwrap(), "test commit message");

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_git_commit_returns_error_for_empty_message() {
        let (dir, _repo) = setup_test_repo("commit_empty");
        let path = dir.to_str().unwrap();

        fs::write(dir.join("file.txt"), "content").unwrap();
        // Note: git_stage panics in stub, but empty-message check happens before repo open
        let result = git_commit(path, "");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("commit message cannot be empty"));

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_git_commit_returns_error_for_whitespace_message() {
        let (dir, _repo) = setup_test_repo("commit_ws");
        let path = dir.to_str().unwrap();

        let result = git_commit(path, "   \t  ");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("commit message cannot be empty"));

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_git_commit_returns_error_for_invalid_repo() {
        let dir = std::env::temp_dir().join("warp_not_repo_commit");
        fs::create_dir_all(&dir).unwrap();

        let result = git_commit(dir.to_str().unwrap(), "valid message");
        assert!(result.is_err());

        let _ = fs::remove_dir_all(&dir);
    }
}
