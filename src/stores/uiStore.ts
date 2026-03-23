import { create } from "zustand";

/** The main content view type. */
export type ViewType = "terminal" | "editor" | "diff";

/** UI layout state and actions. */
interface UiState {
  sidebarVisible: boolean;
  explorerVisible: boolean;
  activeView: ViewType;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  toggleExplorer: () => void;
  setActiveView: (view: ViewType) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarVisible: true,
  explorerVisible: false,
  activeView: "terminal",

  toggleSidebar: () =>
    set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

  toggleExplorer: () =>
    set((state) => ({ explorerVisible: !state.explorerVisible })),

  setActiveView: (view) => set({ activeView: view }),
}));
