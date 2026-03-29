import { create } from "zustand";

/** The main content view type. */
export type ViewType = "terminal" | "editor" | "diff";

/** Split orientation or null for no split. */
export type SplitMode = "vertical" | "horizontal" | null;

/** Terminal actions registered by TerminalManager. */
export interface TerminalActions {
  addTab: () => void;
  closeActiveTab: () => void;
}

/** UI layout state and actions. */
interface UiState {
  sidebarVisible: boolean;
  explorerVisible: boolean;
  bottomPanelVisible: boolean;
  searchVisible: boolean;
  activeView: ViewType;
  tabOrder: ViewType[];
  splitMode: SplitMode;
  splitViews: [ViewType, ViewType];
  /** Terminal actions registered by TerminalManager on mount. */
  terminalActions: TerminalActions | null;
  /** True while the user is typing a new filename in the explorer. */
  newFileRequested: boolean;
  /** True while the user is typing a new folder name in the explorer. */
  newFolderRequested: boolean;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  toggleExplorer: () => void;
  setExplorerVisible: (visible: boolean) => void;
  toggleBottomPanel: () => void;
  toggleSearch: () => void;
  setActiveView: (view: ViewType) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  splitVertical: () => void;
  splitHorizontal: () => void;
  closeSplit: () => void;
  setSplitView: (index: 0 | 1, view: ViewType) => void;
  setTerminalActions: (actions: TerminalActions) => void;
  requestNewFile: () => void;
  clearNewFileRequest: () => void;
  requestNewFolder: () => void;
  clearNewFolderRequest: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarVisible: true,
  explorerVisible: false,
  bottomPanelVisible: false,
  searchVisible: false,
  activeView: "terminal",
  tabOrder: ["terminal", "editor", "diff"] as ViewType[],
  splitMode: null,
  splitViews: ["terminal", "terminal"] as [ViewType, ViewType],
  terminalActions: null,
  newFileRequested: false,
  newFolderRequested: false,

  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

  toggleExplorer: () => set((state) => ({ explorerVisible: !state.explorerVisible })),

  setExplorerVisible: (visible: boolean) => set({ explorerVisible: visible }),

  toggleBottomPanel: () => set((state) => ({ bottomPanelVisible: !state.bottomPanelVisible })),

  toggleSearch: () => set((state) => ({ searchVisible: !state.searchVisible })),

  setActiveView: (view) => set({ activeView: view }),

  reorderTabs: (fromIndex, toIndex) =>
    set((state) => {
      const order = [...state.tabOrder];
      const [moved] = order.splice(fromIndex, 1);
      if (moved) {
        order.splice(toIndex, 0, moved);
      }
      return { tabOrder: order };
    }),

  splitVertical: () => set({ splitMode: "vertical", splitViews: ["terminal", "editor"] }),

  splitHorizontal: () => set({ splitMode: "horizontal", splitViews: ["terminal", "editor"] }),

  closeSplit: () => set({ splitMode: null }),

  setSplitView: (index, view) =>
    set((state) => {
      const views = [...state.splitViews] as [ViewType, ViewType];
      views[index] = view;
      return { splitViews: views };
    }),

  setTerminalActions: (actions) => set({ terminalActions: actions }),

  requestNewFile: () => set({ newFileRequested: true }),
  clearNewFileRequest: () => set({ newFileRequested: false }),
  requestNewFolder: () => set({ newFolderRequested: true }),
  clearNewFolderRequest: () => set({ newFolderRequested: false }),
}));
