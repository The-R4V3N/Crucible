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
    /// Git branch prefix for new branches.
    #[serde(default = "default_branch_prefix")]
    pub branch_prefix: String,
    /// UI zoom scale factor (1.0 = 100%).
    #[serde(default = "default_ui_zoom")]
    pub ui_zoom: f32,
    /// Sidebar position: "left" or "right".
    #[serde(default = "default_sidebar_position")]
    pub sidebar_position: String,
    /// Terminal cursor style: "bar", "block", or "underline".
    #[serde(default = "default_cursor_style")]
    pub cursor_style: String,
    /// Terminal theme: "dark" or "light".
    #[serde(default = "default_terminal_theme")]
    pub terminal_theme: String,
    /// Divider color hex between terminal panes.
    #[serde(default = "default_divider_color")]
    pub divider_color: String,
    /// Default project path for new projects.
    #[serde(default)]
    pub default_project_path: String,
    /// Shell command to use in terminal.
    #[serde(default = "default_command")]
    pub shell_command: String,
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

fn default_branch_prefix() -> String {
    "feature/".to_string()
}

fn default_ui_zoom() -> f32 {
    1.0
}

fn default_sidebar_position() -> String {
    "left".to_string()
}

fn default_cursor_style() -> String {
    "bar".to_string()
}

fn default_terminal_theme() -> String {
    "dark".to_string()
}

fn default_divider_color() -> String {
    "#1E1E2E".to_string()
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
            branch_prefix: "feature/".to_string(),
            ui_zoom: 1.0,
            sidebar_position: "left".to_string(),
            cursor_style: "bar".to_string(),
            terminal_theme: "dark".to_string(),
            divider_color: "#1E1E2E".to_string(),
            default_project_path: String::new(),
            shell_command: "powershell.exe".to_string(),
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
    fn test_new_config_fields_have_defaults() {
        let json = r#"{ "projects": [] }"#;
        let config: WarpConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.branch_prefix, "feature/");
        assert!((config.ui_zoom - 1.0_f32).abs() < f32::EPSILON);
        assert_eq!(config.sidebar_position, "left");
        assert_eq!(config.cursor_style, "bar");
        assert_eq!(config.terminal_theme, "dark");
        assert_eq!(config.divider_color, "#1E1E2E");
        assert_eq!(config.default_project_path, "");
        assert_eq!(config.shell_command, "powershell.exe");
    }

    #[test]
    fn test_new_fields_roundtrip() {
        let json = r##"{
            "projects": [],
            "branch_prefix": "fix/",
            "ui_zoom": 1.25,
            "sidebar_position": "right",
            "cursor_style": "block",
            "terminal_theme": "light",
            "divider_color": "#FF0000",
            "default_project_path": "C:/Projects",
            "shell_command": "bash.exe"
        }"##;
        let config: WarpConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.branch_prefix, "fix/");
        assert!((config.ui_zoom - 1.25_f32).abs() < 0.001);
        assert_eq!(config.sidebar_position, "right");
        assert_eq!(config.cursor_style, "block");
        assert_eq!(config.terminal_theme, "light");
        assert_eq!(config.divider_color, "#FF0000");
        assert_eq!(config.default_project_path, "C:/Projects");
        assert_eq!(config.shell_command, "bash.exe");
    }

    #[test]
    fn test_old_config_without_new_fields_still_loads() {
        // Simulate an existing config.json that was saved before these fields existed
        let json = r##"{
            "projects": [{ "name": "p1", "path": "/tmp" }],
            "theme": "dark",
            "accent_color": "#00E5FF",
            "font_family": "Cascadia Code",
            "font_size": 14,
            "sidebar_width": 240
        }"##;
        let config: WarpConfig = serde_json::from_str(json).unwrap();
        // Should load without error and use defaults for new fields
        assert_eq!(config.branch_prefix, "feature/");
        assert_eq!(config.cursor_style, "bar");
        assert_eq!(config.projects[0].name, "p1");
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
            branch_prefix: "feature/".to_string(),
            ui_zoom: 1.0,
            sidebar_position: "left".to_string(),
            cursor_style: "bar".to_string(),
            terminal_theme: "dark".to_string(),
            divider_color: "#1E1E2E".to_string(),
            default_project_path: String::new(),
            shell_command: "powershell.exe".to_string(),
        };
        let json = serde_json::to_string(&config).unwrap();
        assert!(!json.contains("active_project"));
    }
}
