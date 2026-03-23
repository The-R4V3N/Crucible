import { create } from "zustand";
import type { FileNode } from "@/lib/ipc";

/** An open file tab. */
export interface OpenFile {
  path: string;
  name: string;
}

/** File store state and actions. */
interface FileState {
  tree: FileNode | null;
  openFiles: OpenFile[];
  activeFilePath: string | null;
  expandedDirs: Set<string>;
  setTree: (tree: FileNode) => void;
  openFile: (path: string, name: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  toggleDir: (path: string) => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  tree: null,
  openFiles: [],
  activeFilePath: null,
  expandedDirs: new Set<string>(),

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
}));
