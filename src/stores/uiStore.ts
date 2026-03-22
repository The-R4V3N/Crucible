import { create } from "zustand";

/** UI layout state and actions. */
interface UiState {
  sidebarVisible: boolean;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarVisible: true,

  toggleSidebar: () =>
    set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
}));
