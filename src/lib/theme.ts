/** Crucible color tokens — matches CSS variables in globals.css and tailwind.config.js */
export const colors = {
  bg: "#1E1E1E",
  sidebar: "#252526",
  border: "#3E3E3E",
  text: "#CCCCCC",
  textDim: "#808080",
  accent: "#00E5FF",
  success: "#4EC9B0",
  warning: "#E5C07B",
  error: "#F44747",
  attention: "#007ACC",
} as const;

/** Crucible font settings */
export const fonts = {
  mono: '"Cascadia Code", Consolas, monospace',
  size: 14,
} as const;
