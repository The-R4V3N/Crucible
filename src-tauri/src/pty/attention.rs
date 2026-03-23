use std::time::{Duration, Instant};

/// Patterns that indicate the agent is waiting for user input.
const PROMPT_PATTERNS: &[&str] = &[
    "? ",           // Yes/no prompts
    "> ",           // Generic input prompt
    "$ ",           // Shell prompt
    "PS ",          // PowerShell prompt
    ">>> ",         // Python REPL
    "Enter ",       // "Enter your choice" style prompts
    "(y/n)",        // Confirmation prompts
    "(Y/n)",        // Confirmation prompts
    "[Y/n]",        // Confirmation prompts
    "[y/N]",        // Confirmation prompts
];

/// Duration of inactivity before triggering idle attention.
const IDLE_TIMEOUT: Duration = Duration::from_secs(3);

/// Tracks attention state for a PTY session.
pub struct AttentionDetector {
    /// Whether the session currently needs attention.
    needs_attention: bool,
    /// Timestamp of the last output received.
    last_output: Instant,
    /// Whether we've already fired an idle attention event.
    idle_fired: bool,
}

impl AttentionDetector {
    /// Create a new attention detector.
    pub fn new() -> Self {
        Self {
            needs_attention: false,
            last_output: Instant::now(),
            idle_fired: false,
        }
    }

    /// Process new PTY output and check if attention is needed.
    /// Returns true if attention state changed to needing attention.
    pub fn process_output(&mut self, data: &str) -> bool {
        self.last_output = Instant::now();
        self.idle_fired = false;

        let last_line = data
            .lines()
            .last()
            .unwrap_or("")
            .trim_end();

        let detected = PROMPT_PATTERNS
            .iter()
            .any(|pattern| last_line.contains(pattern));

        if detected && !self.needs_attention {
            self.needs_attention = true;
            return true;
        }

        if !detected && self.needs_attention {
            // Output arrived that doesn't look like a prompt — agent is working
            self.needs_attention = false;
        }

        false
    }

    /// Check if idle timeout has been reached.
    /// Returns true if attention state changed to needing attention.
    pub fn check_idle(&mut self) -> bool {
        if self.idle_fired || self.needs_attention {
            return false;
        }

        if self.last_output.elapsed() >= IDLE_TIMEOUT {
            self.needs_attention = true;
            self.idle_fired = true;
            return true;
        }

        false
    }

    /// Clear the attention state (user switched to this session).
    pub fn clear(&mut self) {
        self.needs_attention = false;
        self.idle_fired = false;
    }

    /// Whether the session currently needs attention.
    pub fn needs_attention(&self) -> bool {
        self.needs_attention
    }
}

impl Default for AttentionDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_detector_does_not_need_attention() {
        let detector = AttentionDetector::new();
        assert!(!detector.needs_attention());
    }

    #[test]
    fn test_detect_yes_no_prompt() {
        let mut detector = AttentionDetector::new();
        let changed = detector.process_output("Do you want to continue? (y/n)");
        assert!(changed, "should detect (y/n) prompt");
        assert!(detector.needs_attention());
    }

    #[test]
    fn test_detect_generic_prompt() {
        let mut detector = AttentionDetector::new();
        let changed = detector.process_output("Enter your name: > ");
        assert!(changed, "should detect > prompt");
        assert!(detector.needs_attention());
    }

    #[test]
    fn test_detect_powershell_prompt() {
        let mut detector = AttentionDetector::new();
        let changed = detector.process_output("PS D:\\Development\\WARP> ");
        assert!(changed, "should detect PS prompt");
    }

    #[test]
    fn test_no_detection_on_regular_output() {
        let mut detector = AttentionDetector::new();
        let changed = detector.process_output("Compiling warp v0.1.0");
        assert!(!changed);
        assert!(!detector.needs_attention());
    }

    #[test]
    fn test_clear_resets_attention() {
        let mut detector = AttentionDetector::new();
        detector.process_output("? Continue?");
        assert!(detector.needs_attention());
        detector.clear();
        assert!(!detector.needs_attention());
    }

    #[test]
    fn test_no_duplicate_attention_trigger() {
        let mut detector = AttentionDetector::new();
        let first = detector.process_output("? Continue?");
        let second = detector.process_output("? Continue?");
        assert!(first, "first detection should trigger");
        assert!(!second, "second should not re-trigger");
    }

    #[test]
    fn test_regular_output_clears_attention() {
        let mut detector = AttentionDetector::new();
        detector.process_output("? Continue?");
        assert!(detector.needs_attention());
        detector.process_output("Building project...");
        assert!(!detector.needs_attention());
    }

    #[test]
    fn test_idle_timeout_not_immediate() {
        let mut detector = AttentionDetector::new();
        detector.process_output("some output");
        let changed = detector.check_idle();
        assert!(!changed, "should not trigger immediately");
    }

    #[test]
    fn test_idle_does_not_fire_twice() {
        let mut detector = AttentionDetector::new();
        // Simulate old timestamp
        detector.last_output = Instant::now() - Duration::from_secs(5);
        let first = detector.check_idle();
        let second = detector.check_idle();
        assert!(first);
        assert!(!second, "should not fire twice");
    }
}
