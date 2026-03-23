import { create } from "zustand";

/** The main content view type. */
export type ViewType = "terminal" | "editor" | "diff";

/** Split orientation or null for no split. */
export type SplitMode = "vertical" | "horizontal" | null;

/** UI layout state and actions. */
interface UiState {
  sidebarVisible: boolean;
  explorerVisible: boolean;
  activeView: ViewType;
  splitMode: SplitMode;
  splitViews: [ViewType, ViewType];
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  toggleExplorer: () => void;
  setActiveView: (view: ViewType) => void;
  splitVertical: () => void;
  splitHorizontal: () => void;
  closeSplit: () => void;
  setSplitView: (index: 0 | 1, view: ViewType) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarVisible: true,
  explorerVisible: false,
  activeView: "terminal",
  splitMode: null,
  splitViews: ["terminal", "terminal"] as [ViewType, ViewType],

  toggleSidebar: () =>
    set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

  toggleExplorer: () =>
    set((state) => ({ explorerVisible: !state.explorerVisible })),

  setActiveView: (view) => set({ activeView: view }),

  splitVertical: () =>
    set({ splitMode: "vertical", splitViews: ["terminal", "editor"] }),

  splitHorizontal: () =>
    set({ splitMode: "horizontal", splitViews: ["terminal", "editor"] }),

  closeSplit: () => set({ splitMode: null }),

  setSplitView: (index, view) =>
    set((state) => {
      const views = [...state.splitViews] as [ViewType, ViewType];
      views[index] = view;
      return { splitViews: views };
    }),
}));
