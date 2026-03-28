/** Keybinding definition. */
export interface Keybinding {
  /** Key combination (e.g., "Ctrl+B", "F1"). */
  key: string;
  /** Human-readable description. */
  description: string;
  /** Scope where this binding applies. */
  scope: "global" | "terminal" | "editor";
}

/** All defined keyboard shortcuts. */
export const keybindings: Keybinding[] = [
  { key: "Ctrl+Shift+P", description: "Open command palette", scope: "global" },
  { key: "Ctrl+P", description: "Open file palette", scope: "global" },
  { key: "Ctrl+B", description: "Toggle sidebar", scope: "global" },
  { key: "F1", description: "Project 1", scope: "global" },
  { key: "F2", description: "Project 2", scope: "global" },
  { key: "F3", description: "Project 3", scope: "global" },
  { key: "F4", description: "Project 4", scope: "global" },
  { key: "F5", description: "Project 5", scope: "global" },
  { key: "F6", description: "Project 6", scope: "global" },
  { key: "F7", description: "Project 7", scope: "global" },
  { key: "F8", description: "Project 8", scope: "global" },
  { key: "F9", description: "Project 9", scope: "global" },
  { key: "F10", description: "Project 10", scope: "global" },
  { key: "F11", description: "Project 11", scope: "global" },
  { key: "F12", description: "Project 12", scope: "global" },
  // Terminal
  { key: "Ctrl+\\", description: "Split vertical", scope: "terminal" },
  { key: "Ctrl+Shift+\\", description: "Split horizontal", scope: "terminal" },
  { key: "Ctrl+W", description: "Close split / close tab", scope: "terminal" },
  { key: "Ctrl+R", description: "Restart active session", scope: "terminal" },
  // Editor
  { key: "Ctrl+S", description: "Save file", scope: "editor" },
  { key: "Ctrl+F", description: "Find in file", scope: "editor" },
  { key: "Ctrl+O", description: "Open file", scope: "editor" },
];
