import { create } from "zustand";
import type { FileNode } from "@/lib/ipc";

/** An open file tab. */
export interface OpenFile {
  path: string;
  name: string;
  isDirty?: boolean;
}

/** File store state and actions. */
interface FileState {
  tree: FileNode | null;
  openFiles: OpenFile[];
  activeFilePath: string | null;
  expandedDirs: Set<string>;
  /** Incremented by triggerSave — EditorView reacts and writes to disk. */
  saveRequest: number;
  /** Incremented by triggerRevert — EditorView reacts and reloads from disk. */
  revertRequest: number;
  setTree: (tree: FileNode) => void;
  openFile: (path: string, name: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  toggleDir: (path: string) => void;
  markDirty: (path: string) => void;
  markClean: (path: string) => void;
  triggerSave: () => void;
  triggerRevert: () => void;
  collapseAll: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  tree: null,
  openFiles: [],
  activeFilePath: null,
  expandedDirs: new Set<string>(),
  saveRequest: 0,
  revertRequest: 0,

  setTree: (tree) => set({ tree }),

  openFile: (path, name) =>
    set((state) => {
      const alreadyOpen = state.openFiles.some((f) => f.path === path);
      if (alreadyOpen) {
        return { activeFilePath: path };
      }
      return {
        openFiles: [...state.openFiles, { path, name }],
        activeFilePath: path,
      };
    }),

  closeFile: (path) =>
    set((state) => {
      const remaining = state.openFiles.filter((f) => f.path !== path);
      let activeFilePath = state.activeFilePath;
      if (activeFilePath === path) {
        activeFilePath = remaining.length > 0 ? remaining[remaining.length - 1]!.path : null;
      }
      return { openFiles: remaining, activeFilePath };
    }),

  setActiveFile: (path) => set({ activeFilePath: path }),

  toggleDir: (path) =>
    set((state) => {
      const next = new Set(state.expandedDirs);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedDirs: next };
    }),

  markDirty: (path) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) => (f.path === path ? { ...f, isDirty: true } : f)),
    })),

  markClean: (path) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) => (f.path === path ? { ...f, isDirty: false } : f)),
    })),

  triggerSave: () => set((state) => ({ saveRequest: state.saveRequest + 1 })),

  triggerRevert: () => set((state) => ({ revertRequest: state.revertRequest + 1 })),

  collapseAll: () => set({ expandedDirs: new Set<string>() }),
}));
