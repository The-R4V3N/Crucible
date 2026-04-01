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
  /** Which panel is currently shown in the sidebar area. */
  activePanel: "explorer" | "search" | "source-control" | null;
  /** The last non-null panel, used to restore when Ctrl+B re-opens the sidebar. */
  lastActivePanel: "explorer" | "search" | "source-control" | null;
  /** True while the user is typing a new filename in the explorer. */
  newFileRequested: boolean;
  /** True while the user is typing a new folder name in the explorer. */
  newFolderRequested: boolean;
  /** Open context menu state. */
  contextMenu: { x: number; y: number; targetPath: string; isDir: boolean } | null;
  /** Path of the node currently being renamed inline. */
  renameTargetPath: string | null;
  /** Path pending delete confirmation. */
  deleteConfirmPath: string | null;
  /** Target directory for new file from context menu (null = use tree root). */
  newFileTargetDir: string | null;
  /** Target directory for new folder from context menu (null = use tree root). */
  newFolderTargetDir: string | null;
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
  togglePanel: (panel: "explorer" | "search" | "source-control") => void;
  requestNewFile: (targetDir?: string) => void;
  clearNewFileRequest: () => void;
  requestNewFolder: (targetDir?: string) => void;
  clearNewFolderRequest: () => void;
  setContextMenu: (menu: { x: number; y: number; targetPath: string; isDir: boolean }) => void;
  clearContextMenu: () => void;
  setRenameTarget: (path: string) => void;
  clearRenameTarget: () => void;
  setDeleteConfirm: (path: string) => void;
  clearDeleteConfirm: () => void;
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
  activePanel: null,
  lastActivePanel: null,
  newFileRequested: false,
  newFolderRequested: false,
  contextMenu: null,
  renameTargetPath: null,
  deleteConfirmPath: null,
  newFileTargetDir: null,
  newFolderTargetDir: null,

  togglePanel: (panel) =>
    set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),

  toggleSidebar: () =>
    set((state) => {
      if (state.activePanel !== null) {
        return { activePanel: null, lastActivePanel: state.activePanel };
      }
      return { activePanel: state.lastActivePanel ?? "explorer" };
    }),

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

  requestNewFile: (targetDir?: string) =>
    set({ newFileRequested: true, newFileTargetDir: targetDir ?? null }),
  clearNewFileRequest: () => set({ newFileRequested: false, newFileTargetDir: null }),
  requestNewFolder: (targetDir?: string) =>
    set({ newFolderRequested: true, newFolderTargetDir: targetDir ?? null }),
  clearNewFolderRequest: () => set({ newFolderRequested: false, newFolderTargetDir: null }),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  clearContextMenu: () => set({ contextMenu: null }),
  setRenameTarget: (path) => set({ renameTargetPath: path }),
  clearRenameTarget: () => set({ renameTargetPath: null }),
  setDeleteConfirm: (path) => set({ deleteConfirmPath: path }),
  clearDeleteConfirm: () => set({ deleteConfirmPath: null }),
}));
