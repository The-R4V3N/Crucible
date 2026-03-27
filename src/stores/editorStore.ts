import { create } from "zustand";

/** Editor state shared across the app (cursor position, language). */
interface EditorState {
  /** Current cursor line (1-based). */
  cursorLine: number;
  /** Current cursor column (1-based). */
  cursorCol: number;
  /** Monaco language ID of the active file (e.g. "typescript", "rust"). */
  language: string;
  /** Update cursor position. */
  setCursor: (line: number, col: number) => void;
  /** Update the active file's language. */
  setLanguage: (language: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  cursorLine: 1,
  cursorCol: 1,
  language: "plaintext",

  setCursor: (line, col) => set({ cursorLine: line, cursorCol: col }),

  setLanguage: (language) => set({ language }),
}));
