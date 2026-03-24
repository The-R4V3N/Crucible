use serde::Serialize;
use std::fs;
use std::path::Path;

/// A single search result match.
#[derive(Debug, Clone, Serialize)]
pub struct SearchMatch {
    /// File path where the match was found.
    pub path: String,
    /// Line number (1-indexed).
    pub line: usize,
    /// The matching line content (trimmed).
    pub content: String,
}

/// Search for a pattern in all files under the given directory.
/// Returns matching lines with file path and line number.
pub fn search_files(root: &Path, query: &str, max_results: usize) -> Result<Vec<SearchMatch>, String> {
    if !root.exists() || !root.is_dir() {
        return Err(format!("invalid search path: {}", root.display()));
    }

    if query.is_empty() {
        return Ok(Vec::new());
    }

    let query_lower = query.to_lowercase();
    let mut results = Vec::new();

    search_dir(root, root, &query_lower, max_results, &mut results)?;

    Ok(results)
}

/// Recursively search a directory.
fn search_dir(
    root: &Path,
    dir: &Path,
    query: &str,
    max_results: usize,
    results: &mut Vec<SearchMatch>,
) -> Result<(), String> {
    if results.len() >= max_results {
        return Ok(());
    }

    let entries = fs::read_dir(dir)
        .map_err(|e| format!("failed to read directory: {e}"))?;

    for entry in entries.flatten() {
        if results.len() >= max_results {
            break;
        }

        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip ignored directories and files
        if should_skip(&name) {
            continue;
        }

        if path.is_dir() {
            search_dir(root, &path, query, max_results, results)?;
        } else if path.is_file() {
            search_file(root, &path, query, max_results, results);
        }
    }

    Ok(())
}

/// Search a single file for the query.
fn search_file(
    root: &Path,
    file: &Path,
    query: &str,
    max_results: usize,
    results: &mut Vec<SearchMatch>,
) {
    // Skip binary-looking files
    let ext = file.extension().and_then(|e| e.to_str()).unwrap_or("");
    if is_binary_extension(ext) {
        return;
    }

    let content = match fs::read_to_string(file) {
        Ok(c) => c,
        Err(_) => return, // Skip files that can't be read as UTF-8
    };

    let relative_path = file
        .strip_prefix(root)
        .unwrap_or(file)
        .to_string_lossy()
        .replace('\\', "/");

    for (i, line) in content.lines().enumerate() {
        if results.len() >= max_results {
            break;
        }

        if line.to_lowercase().contains(query) {
            results.push(SearchMatch {
                path: relative_path.clone(),
                line: i + 1,
                content: line.trim().to_string(),
            });
        }
    }
}

/// Check if a name should be skipped during search.
fn should_skip(name: &str) -> bool {
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

/// Check if a file extension indicates a binary file.
fn is_binary_extension(ext: &str) -> bool {
    matches!(
        ext,
        "exe" | "dll" | "so" | "dylib" | "bin" | "obj" | "o"
            | "png" | "jpg" | "jpeg" | "gif" | "bmp" | "ico" | "svg"
            | "woff" | "woff2" | "ttf" | "eot"
            | "zip" | "tar" | "gz" | "7z" | "rar"
            | "pdf" | "doc" | "docx" | "xls" | "xlsx"
            | "wasm" | "lock"
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_search_dir(suffix: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!("warp_search_{suffix}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("src")).unwrap();
        fs::write(dir.join("src/main.rs"), "fn main() {\n    println!(\"hello world\");\n}\n").unwrap();
        fs::write(dir.join("src/lib.rs"), "pub fn greet() {\n    println!(\"hello\");\n}\n").unwrap();
        fs::write(dir.join("README.md"), "# Hello Project\nThis is a test.\n").unwrap();
        dir
    }

    fn cleanup(dir: &Path) {
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn test_search_finds_matches() {
        let dir = create_search_dir("finds");
        let results = search_files(&dir, "hello", 100).unwrap();
        assert!(!results.is_empty(), "should find 'hello' in test files");
        cleanup(&dir);
    }

    #[test]
    fn test_search_case_insensitive() {
        let dir = create_search_dir("case");
        let results = search_files(&dir, "HELLO", 100).unwrap();
        assert!(!results.is_empty(), "should find 'HELLO' case-insensitively");
        cleanup(&dir);
    }

    #[test]
    fn test_search_returns_line_numbers() {
        let dir = create_search_dir("lines");
        let results = search_files(&dir, "println", 100).unwrap();
        for result in &results {
            assert!(result.line > 0, "line number should be 1-indexed");
        }
        cleanup(&dir);
    }

    #[test]
    fn test_search_respects_max_results() {
        let dir = create_search_dir("max");
        let results = search_files(&dir, "hello", 1).unwrap();
        assert_eq!(results.len(), 1, "should respect max_results limit");
        cleanup(&dir);
    }

    #[test]
    fn test_search_empty_query() {
        let dir = create_search_dir("empty");
        let results = search_files(&dir, "", 100).unwrap();
        assert!(results.is_empty(), "empty query should return no results");
        cleanup(&dir);
    }

    #[test]
    fn test_search_no_matches() {
        let dir = create_search_dir("nomatch");
        let results = search_files(&dir, "zzzznonexistent", 100).unwrap();
        assert!(results.is_empty(), "should return no results for nonexistent query");
        cleanup(&dir);
    }

    #[test]
    fn test_search_invalid_path() {
        let result = search_files(Path::new("/nonexistent/path/xyz"), "test", 100);
        assert!(result.is_err());
    }

    #[test]
    fn test_search_relative_paths() {
        let dir = create_search_dir("relpaths");
        let results = search_files(&dir, "hello", 100).unwrap();
        let dir_str = dir.to_string_lossy().to_string();
        for result in &results {
            assert!(!result.path.contains(&dir_str), "paths should be relative");
            assert!(!result.path.contains('\\'), "paths should not contain backslashes");
        }
        cleanup(&dir);
    }
}
