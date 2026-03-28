import { create } from "zustand";

export type PaletteMode = "command" | "file";

interface PaletteState {
  open: boolean;
  mode: PaletteMode;
  query: string;
  activeIndex: number;
  openCommandPalette: () => void;
  openFilePalette: () => void;
  close: () => void;
  setQuery: (q: string) => void;
  setActiveIndex: (i: number) => void;
}

export const usePaletteStore = create<PaletteState>((set) => ({
  open: false,
  mode: "command",
  query: "",
  activeIndex: 0,

  openCommandPalette: () => set({ open: true, mode: "command", query: "", activeIndex: 0 }),

  openFilePalette: () => set({ open: true, mode: "file", query: "", activeIndex: 0 }),

  close: () => set({ open: false, query: "", activeIndex: 0 }),

  setQuery: (q) => set({ query: q, activeIndex: 0 }),

  setActiveIndex: (i) => set({ activeIndex: i }),
}));
