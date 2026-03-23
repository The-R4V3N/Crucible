use serde::Serialize;
use std::path::Path;

/// A node in the file tree.
#[derive(Debug, Clone, Serialize)]
pub struct FileNode {
    /// File or directory name.
    pub name: String,
    /// Full path to the file or directory.
    pub path: String,
    /// Whether this node is a directory.
    pub is_dir: bool,
    /// Children nodes (empty for files).
    pub children: Vec<FileNode>,
}

/// Build a file tree for the given directory path.
/// Skips hidden files/dirs (starting with .) and common ignore patterns.
pub fn build_tree(root: &Path, max_depth: usize) -> Result<FileNode, String> {
    if !root.exists() {
        return Err(format!("path does not exist: {}", root.display()));
    }
    if !root.is_dir() {
        return Err(format!("path is not a directory: {}", root.display()));
    }

    let name = root
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| root.to_string_lossy().to_string());

    let children = if max_depth > 0 {
        read_children(root, max_depth - 1)?
    } else {
        Vec::new()
    };

    Ok(FileNode {
        name,
        path: root.to_string_lossy().to_string(),
        is_dir: true,
        children,
    })
}

/// Read children of a directory, sorted (dirs first, then files).
fn read_children(dir: &Path, remaining_depth: usize) -> Result<Vec<FileNode>, String> {
    let mut entries = std::fs::read_dir(dir)
        .map_err(|e| format!("failed to read directory: {e}"))?
        .filter_map(|e| e.ok())
        .collect::<Vec<_>>();

    // Sort: directories first, then alphabetically
    entries.sort_by(|a, b| {
        let a_dir = a.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
        let b_dir = b.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
        b_dir.cmp(&a_dir).then(a.file_name().cmp(&b.file_name()))
    });

    let mut nodes = Vec::new();
    for entry in entries {
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files and common ignore patterns
        if should_ignore(&name) {
            continue;
        }

        let path = entry.path();
        let is_dir = entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false);

        let children = if is_dir && remaining_depth > 0 {
            read_children(&path, remaining_depth - 1).unwrap_or_default()
        } else {
            Vec::new()
        };

        nodes.push(FileNode {
            name,
            path: path.to_string_lossy().to_string(),
            is_dir,
            children,
        });
    }

    Ok(nodes)
}

/// Check if a file/directory should be ignored in the tree.
fn should_ignore(name: &str) -> bool {
    matches!(
        name,
        "node_modules"
            | "target"
            | "dist"
            | "build"
            | ".git"
            | ".omc"
            | ".claude"
            | ".DS_Store"
            | "Thumbs.db"
    ) || name.starts_with('.')
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn create_test_dir(suffix: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!("warp_tree_{suffix}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("src")).unwrap();
        fs::write(dir.join("README.md"), "hello").unwrap();
        fs::write(dir.join("src/main.rs"), "fn main() {}").unwrap();
        fs::write(dir.join(".hidden"), "secret").unwrap();
        dir
    }

    fn cleanup(dir: &Path) {
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn test_build_tree_returns_root_node() {
        let dir = create_test_dir("root");
        let tree = build_tree(&dir, 3).unwrap();
        assert!(tree.is_dir);
        cleanup(&dir);
    }

    #[test]
    fn test_build_tree_includes_files_and_dirs() {
        let dir = create_test_dir("includes");
        let tree = build_tree(&dir, 3).unwrap();
        let names: Vec<&str> = tree.children.iter().map(|n| n.name.as_str()).collect();
        assert!(names.contains(&"src"), "should contain src dir");
        assert!(names.contains(&"README.md"), "should contain README.md");
        cleanup(&dir);
    }

    #[test]
    fn test_build_tree_skips_hidden_files() {
        let dir = create_test_dir("hidden");
        let tree = build_tree(&dir, 3).unwrap();
        let names: Vec<&str> = tree.children.iter().map(|n| n.name.as_str()).collect();
        assert!(!names.contains(&".hidden"), "should skip hidden files");
        cleanup(&dir);
    }

    #[test]
    fn test_build_tree_dirs_first() {
        let dir = create_test_dir("dirsfirst");
        let tree = build_tree(&dir, 3).unwrap();
        if let Some(first) = tree.children.first() {
            assert!(first.is_dir, "directories should come first");
        }
        cleanup(&dir);
    }

    #[test]
    fn test_build_tree_nested_children() {
        let dir = create_test_dir("nested");
        let tree = build_tree(&dir, 3).unwrap();
        let src = tree.children.iter().find(|n| n.name == "src").unwrap();
        assert!(src.is_dir);
        let src_names: Vec<&str> = src.children.iter().map(|n| n.name.as_str()).collect();
        assert!(src_names.contains(&"main.rs"));
        cleanup(&dir);
    }

    #[test]
    fn test_build_tree_max_depth_zero() {
        let dir = create_test_dir("depth0");
        let tree = build_tree(&dir, 0).unwrap();
        assert!(tree.children.is_empty(), "depth 0 should have no children");
        cleanup(&dir);
    }

    #[test]
    fn test_build_tree_nonexistent_path() {
        let result = build_tree(Path::new("/nonexistent/warp_path_xyz"), 3);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("does not exist"));
    }

    #[test]
    fn test_build_tree_file_path() {
        let dir = create_test_dir("filepath");
        let file_path = dir.join("README.md");
        let result = build_tree(&file_path, 3);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("not a directory") || err.contains("not a file"),
            "unexpected error: {err}"
        );
        cleanup(&dir);
    }
}
