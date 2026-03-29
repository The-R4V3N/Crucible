pub mod search;
pub mod tree;
pub mod watcher;

pub use search::{search_files, SearchMatch};
pub use tree::{build_tree, FileNode};
pub use watcher::{start_watcher, FileChangedPayload};

use std::path::Path;

/// Read the contents of a file as a string.
pub fn read_file(path: &Path) -> Result<String, String> {
    if !path.exists() {
        return Err(format!("file not found: {}", path.display()));
    }
    if !path.is_file() {
        return Err(format!("path is not a file: {}", path.display()));
    }
    std::fs::read_to_string(path)
        .map_err(|e| format!("failed to read file: {e}"))
}

/// Create a directory and all required parent directories.
pub fn create_dir(path: &Path) -> Result<(), String> {
    std::fs::create_dir_all(path)
        .map_err(|e| format!("failed to create directory: {e}"))
}

/// Write content to a file, creating parent directories if needed.
pub fn write_file(path: &Path, content: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("failed to create directories: {e}"))?;
        }
    }
    std::fs::write(path, content)
        .map_err(|e| format!("failed to write file: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_read_file_returns_content() {
        let dir = std::env::temp_dir().join("warp_files_test_read");
        fs::create_dir_all(&dir).unwrap();
        let file = dir.join("test.txt");
        fs::write(&file, "hello world").unwrap();

        let content = read_file(&file).unwrap();
        assert_eq!(content, "hello world");

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_read_file_not_found() {
        let result = read_file(Path::new("/nonexistent/file.txt"));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("file not found"));
    }

    #[test]
    fn test_read_file_on_directory() {
        let dir = std::env::temp_dir().join("warp_files_test_dir");
        fs::create_dir_all(&dir).unwrap();

        let result = read_file(&dir);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not a file"));

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_write_file_creates_file() {
        let dir = std::env::temp_dir().join("warp_files_test_write");
        let _ = fs::remove_dir_all(&dir);
        let file = dir.join("output.txt");

        write_file(&file, "test content").unwrap();

        let content = fs::read_to_string(&file).unwrap();
        assert_eq!(content, "test content");

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_write_file_overwrites_existing() {
        let dir = std::env::temp_dir().join("warp_files_test_overwrite");
        fs::create_dir_all(&dir).unwrap();
        let file = dir.join("existing.txt");
        fs::write(&file, "old content").unwrap();

        write_file(&file, "new content").unwrap();

        let content = fs::read_to_string(&file).unwrap();
        assert_eq!(content, "new content");

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_create_dir_creates_directory() {
        let dir = std::env::temp_dir().join("warp_files_test_create_dir");
        let _ = fs::remove_dir_all(&dir);

        create_dir(&dir).unwrap();

        assert!(dir.exists());
        assert!(dir.is_dir());

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_create_dir_creates_nested_directories() {
        let dir = std::env::temp_dir().join("warp_files_test_create_dir_nested/a/b/c");
        let _ = fs::remove_dir_all(std::env::temp_dir().join("warp_files_test_create_dir_nested"));

        create_dir(&dir).unwrap();

        assert!(dir.exists());
        assert!(dir.is_dir());

        let _ = fs::remove_dir_all(std::env::temp_dir().join("warp_files_test_create_dir_nested"));
    }

    #[test]
    fn test_create_dir_is_idempotent() {
        let dir = std::env::temp_dir().join("warp_files_test_create_dir_idem");
        fs::create_dir_all(&dir).unwrap();

        // calling again on an existing dir should succeed
        assert!(create_dir(&dir).is_ok());

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_write_file_creates_parent_dirs() {
        let dir = std::env::temp_dir().join("warp_files_test_nested");
        let _ = fs::remove_dir_all(&dir);
        let file = dir.join("deep/nested/file.txt");

        write_file(&file, "deep content").unwrap();

        let content = fs::read_to_string(&file).unwrap();
        assert_eq!(content, "deep content");

        let _ = fs::remove_dir_all(&dir);
    }
}
