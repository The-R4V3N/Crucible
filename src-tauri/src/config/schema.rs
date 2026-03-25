use serde::{Deserialize, Serialize};
use std::path::Path;

/// Configuration for a single project.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    /// Display name for the project.
    pub name: String,
    /// Absolute path to the project directory.
    pub path: String,
    /// Command to run in the terminal. Defaults to powershell.exe.
    #[serde(default = "default_command")]
    pub command: String,
}

/// Notification settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationConfig {
    /// Enable visual notifications in sidebar.
    #[serde(default = "default_true")]
    pub visual: bool,
    /// Enable border glow on terminals needing attention.
    #[serde(default = "default_true")]
    pub border_glow: bool,
    /// Enable sound notifications.
    #[serde(default)]
    pub sound: bool,
}

/// Root WARP configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WarpConfig {
    /// List of projects to manage.
    pub projects: Vec<ProjectConfig>,
    /// Theme name (currently only "dark").
    #[serde(default = "default_theme")]
    pub theme: String,
    /// Accent color hex.
    #[serde(default = "default_accent")]
    pub accent_color: String,
    /// Font family for the terminal.
    #[serde(default = "default_font_family")]
    pub font_family: String,
    /// Font size in pixels.
    #[serde(default = "default_font_size")]
    pub font_size: u16,
    /// Sidebar width in pixels.
    #[serde(default = "default_sidebar_width")]
    pub sidebar_width: u16,
    /// Notification settings.
    #[serde(default)]
    pub notifications: NotificationConfig,
    /// Last active project name (for session restore).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub active_project: Option<String>,
}

impl Default for NotificationConfig {
    fn default() -> Self {
        Self {
            visual: true,
            border_glow: true,
            sound: false,
        }
    }
}

/// Load configuration from a JSON file at the given path.
pub fn load_config(path: &Path) -> Result<WarpConfig, String> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("failed to read config file: {e}"))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("failed to parse config file: {e}"))
}

/// Save configuration to a JSON file at the given path.
pub fn save_config(config: &WarpConfig, path: &Path) -> Result<(), String> {
    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("failed to serialize config: {e}"))?;

    std::fs::write(path, content)
        .map_err(|e| format!("failed to write config file: {e}"))
}

fn default_command() -> String {
    "powershell.exe".to_string()
}

fn default_theme() -> String {
    "dark".to_string()
}

fn default_accent() -> String {
    "#00E5FF".to_string()
}

fn default_font_family() -> String {
    "Cascadia Code".to_string()
}

fn default_font_size() -> u16 {
    14
}

fn default_sidebar_width() -> u16 {
    240
}

fn default_true() -> bool {
    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_parse_valid_config() {
        let json = r#"{
            "projects": [
                { "name": "test", "path": "/tmp/test", "command": "bash" }
            ]
        }"#;
        let config: WarpConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.projects.len(), 1);
        assert_eq!(config.projects[0].name, "test");
        assert_eq!(config.projects[0].command, "bash");
    }

    #[test]
    fn test_default_command() {
        let json = r#"{
            "projects": [
                { "name": "test", "path": "/tmp/test" }
            ]
        }"#;
        let config: WarpConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.projects[0].command, "powershell.exe");
    }

    #[test]
    fn test_default_values() {
        let json = r#"{ "projects": [] }"#;
        let config: WarpConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.theme, "dark");
        assert_eq!(config.accent_color, "#00E5FF");
        assert_eq!(config.font_size, 14);
        assert_eq!(config.sidebar_width, 240);
        assert!(config.notifications.visual);
        assert!(!config.notifications.sound);
    }

    #[test]
    fn test_load_config_from_file() {
        let dir = std::env::temp_dir();
        let path = dir.join("warp_test_config.json");
        let mut file = std::fs::File::create(&path).unwrap();
        file.write_all(br#"{ "projects": [{ "name": "p1", "path": "." }] }"#)
            .unwrap();

        let config = load_config(&path).unwrap();
        assert_eq!(config.projects.len(), 1);
        assert_eq!(config.projects[0].name, "p1");

        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn test_load_config_file_not_found() {
        let result = load_config(Path::new("/nonexistent/config.json"));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("failed to read"));
    }

    #[test]
    fn test_load_config_invalid_json() {
        let dir = std::env::temp_dir();
        let path = dir.join("warp_test_bad_config.json");
        std::fs::write(&path, "not json").unwrap();

        let result = load_config(&path);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("failed to parse"));

        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn test_save_and_load_roundtrip() {
        let config = WarpConfig {
            projects: vec![ProjectConfig {
                name: "roundtrip".to_string(),
                path: "/tmp".to_string(),
                command: "bash".to_string(),
            }],
            theme: "dark".to_string(),
            accent_color: "#00E5FF".to_string(),
            font_family: "Cascadia Code".to_string(),
            font_size: 14,
            sidebar_width: 240,
            notifications: NotificationConfig::default(),
            active_project: Some("roundtrip".to_string()),
        };

        let dir = std::env::temp_dir();
        let path = dir.join("warp_test_roundtrip.json");

        save_config(&config, &path).unwrap();
        let loaded = load_config(&path).unwrap();

        assert_eq!(loaded.projects[0].name, "roundtrip");
        assert_eq!(loaded.theme, "dark");
        assert_eq!(loaded.active_project, Some("roundtrip".to_string()));

        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn test_active_project_defaults_to_none() {
        let json = r#"{ "projects": [] }"#;
        let config: WarpConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.active_project, None);
    }

    #[test]
    fn test_active_project_omitted_from_json_when_none() {
        let config = WarpConfig {
            projects: vec![],
            theme: "dark".to_string(),
            accent_color: "#00E5FF".to_string(),
            font_family: "Cascadia Code".to_string(),
            font_size: 14,
            sidebar_width: 240,
            notifications: NotificationConfig::default(),
            active_project: None,
        };
        let json = serde_json::to_string(&config).unwrap();
        assert!(!json.contains("active_project"));
    }
}
