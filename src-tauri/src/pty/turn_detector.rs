use std::time::{SystemTime, UNIX_EPOCH};

/// Prompt patterns that mark the start of a new Claude agent turn.
///
/// These are distinct from the general attention patterns — they specifically
/// indicate Claude is ready for the next user input, not just any prompt.
const CLAUDE_PROMPT_PATTERNS: &[&str] = &[
    "\n> ",   // Claude Code primary input prompt
    "\r\n> ", // same, with Windows line endings
    "\n◆ ",   // Claude tool call / action indicator
    "\r\n◆ ", // same, Windows line endings
];

/// A detected turn boundary in the PTY output stream.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TurnBoundary {
    /// Monotonically increasing turn number for this session (starts at 1).
    pub turn_id: u32,
    /// Unix timestamp in milliseconds when the boundary was detected.
    pub timestamp_ms: u64,
}

/// Detects agent turn boundaries in a PTY output stream.
///
/// A "turn" is a single Claude agent interaction: one prompt → one response.
/// The boundary fires when Claude emits its input prompt, marking the end of
/// its previous response and the start of waiting for the next user input.
pub struct TurnDetector {
    /// Number of turns detected so far.
    turn_count: u32,
    /// Accumulated output buffer for pattern matching across chunk boundaries.
    buffer: String,
    /// Whether we are currently inside an agent response (between turns).
    in_response: bool,
}

impl TurnDetector {
    /// Create a new turn detector.
    pub fn new() -> Self {
        Self {
            turn_count: 0,
            buffer: String::new(),
            in_response: false,
        }
    }

    /// Process a chunk of PTY output.
    ///
    /// Returns `Some(TurnBoundary)` if a new turn boundary was detected,
    /// `None` otherwise.
    pub fn process_output(&mut self, data: &str) -> Option<TurnBoundary> {
        if data.is_empty() {
            return None;
        }

        // Keep a small trailing buffer to catch patterns split across chunks.
        // We only need to retain enough to match the longest pattern (4 bytes: "\r\n> ").
        self.buffer.push_str(data);
        let max_pattern_len = CLAUDE_PROMPT_PATTERNS
            .iter()
            .map(|p| p.len())
            .max()
            .unwrap_or(0);
        if self.buffer.len() > max_pattern_len * 2 {
            let trim_at = self.buffer.len() - max_pattern_len;
            self.buffer = self.buffer[trim_at..].to_string();
        }

        let detected = CLAUDE_PROMPT_PATTERNS
            .iter()
            .any(|pattern| self.buffer.contains(pattern));

        if detected {
            if self.in_response || self.turn_count == 0 {
                // A new boundary: either transitioning from a response back to prompt,
                // or this is the very first prompt we've seen.
                self.turn_count += 1;
                self.in_response = false;
                return Some(TurnBoundary {
                    turn_id: self.turn_count,
                    timestamp_ms: now_ms(),
                });
            }
            // Already at a prompt — don't double-fire.
            return None;
        }

        // Non-prompt output: agent is working / responding.
        if self.turn_count > 0 {
            self.in_response = true;
        }

        None
    }

    /// How many turns have been detected so far.
    pub fn turn_count(&self) -> u32 {
        self.turn_count
    }

    /// Returns `true` if we are currently inside an agent response.
    pub fn in_response(&self) -> bool {
        self.in_response
    }
}

impl Default for TurnDetector {
    fn default() -> Self {
        Self::new()
    }
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_detector_has_zero_turns() {
        let detector = TurnDetector::new();
        assert_eq!(detector.turn_count(), 0);
    }

    #[test]
    fn test_new_detector_not_in_response() {
        let detector = TurnDetector::new();
        assert!(!detector.in_response());
    }

    #[test]
    fn test_detects_claude_prompt_boundary() {
        let mut detector = TurnDetector::new();
        let boundary = detector.process_output("\n> ");
        assert!(boundary.is_some(), "should detect \\n> as a turn boundary");
    }

    #[test]
    fn test_boundary_has_turn_id_one_on_first_detection() {
        let mut detector = TurnDetector::new();
        let boundary = detector.process_output("\n> ").unwrap();
        assert_eq!(boundary.turn_id, 1);
    }

    #[test]
    fn test_boundary_has_nonzero_timestamp() {
        let mut detector = TurnDetector::new();
        let boundary = detector.process_output("\n> ").unwrap();
        assert!(boundary.timestamp_ms > 0);
    }

    #[test]
    fn test_turn_count_increments_after_detection() {
        let mut detector = TurnDetector::new();
        detector.process_output("\n> ");
        assert_eq!(detector.turn_count(), 1);
    }

    #[test]
    fn test_assigns_sequential_turn_ids() {
        let mut detector = TurnDetector::new();
        // First turn: prompt appears after agent does some work
        detector.process_output("Analyzing your code...\n");
        let b1 = detector.process_output("\n> ").unwrap();
        assert_eq!(b1.turn_id, 1);

        // Agent does more work, then prompts again
        detector.process_output("I found 3 issues.\n");
        let b2 = detector.process_output("\n> ").unwrap();
        assert_eq!(b2.turn_id, 2);

        assert_eq!(detector.turn_count(), 2);
    }

    #[test]
    fn test_no_false_positive_on_regular_output() {
        let mut detector = TurnDetector::new();
        let boundary = detector.process_output("Compiling crucible v0.1.0...\n");
        assert!(boundary.is_none(), "regular output should not trigger a turn boundary");
    }

    #[test]
    fn test_no_false_positive_on_empty_input() {
        let mut detector = TurnDetector::new();
        let boundary = detector.process_output("");
        assert!(boundary.is_none());
    }

    #[test]
    fn test_no_false_positive_on_mid_line_gt() {
        let mut detector = TurnDetector::new();
        // A `>` that appears mid-line (e.g. in code output) must not trigger
        let boundary = detector.process_output("error: expected `>` token\n");
        assert!(boundary.is_none(), "mid-line > should not trigger a turn boundary");
    }

    #[test]
    fn test_does_not_double_fire_on_consecutive_prompts() {
        let mut detector = TurnDetector::new();
        detector.process_output("\n> ");
        // Same prompt again without any intervening output — should not re-fire
        let second = detector.process_output("\n> ");
        assert!(second.is_none(), "should not fire twice without intervening agent output");
        assert_eq!(detector.turn_count(), 1);
    }

    #[test]
    fn test_detects_windows_line_ending_variant() {
        let mut detector = TurnDetector::new();
        let boundary = detector.process_output("\r\n> ");
        assert!(boundary.is_some(), "should detect \\r\\n> variant");
    }

    #[test]
    fn test_detects_tool_call_indicator() {
        let mut detector = TurnDetector::new();
        let boundary = detector.process_output("\n◆ ");
        assert!(boundary.is_some(), "should detect ◆ tool call indicator");
    }

    #[test]
    fn test_new_turn_after_agent_output() {
        let mut detector = TurnDetector::new();
        // Initial prompt
        detector.process_output("\n> ");
        assert_eq!(detector.turn_count(), 1);

        // Agent produces output (not a prompt)
        detector.process_output("Running cargo build...\nFinished in 2.3s\n");

        // Second prompt — should fire turn 2
        let boundary = detector.process_output("\n> ");
        assert!(boundary.is_some());
        assert_eq!(boundary.unwrap().turn_id, 2);
    }

    #[test]
    fn test_in_response_true_after_non_prompt_output() {
        let mut detector = TurnDetector::new();
        detector.process_output("\n> ");           // turn 1 boundary
        detector.process_output("Working...\n");   // agent responding
        assert!(detector.in_response(), "should be in_response while agent is working");
    }

    #[test]
    fn test_in_response_false_after_prompt() {
        let mut detector = TurnDetector::new();
        detector.process_output("\n> ");
        assert!(!detector.in_response(), "should not be in_response when prompt is shown");
    }

    #[test]
    fn test_boundary_detected_within_larger_chunk() {
        let mut detector = TurnDetector::new();
        // Prompt appears embedded in a larger output chunk
        let boundary = detector.process_output("Done processing.\n\n> ");
        assert!(boundary.is_some(), "should detect boundary even when embedded in a larger chunk");
        assert_eq!(boundary.unwrap().turn_id, 1);
    }
}
