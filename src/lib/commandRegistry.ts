import { useUiStore } from "@/stores/uiStore";

export interface Command {
  id: string;
  label: string;
  keybinding?: string;
  execute: () => void;
}

export function getCommands(): Command[] {
  return [
    {
      id: "ui.toggleSidebar",
      label: "Toggle Sidebar",
      keybinding: "Ctrl+B",
      execute: () => useUiStore.getState().toggleSidebar(),
    },
    {
      id: "ui.toggleExplorer",
      label: "Toggle Explorer",
      keybinding: "Ctrl+E",
      execute: () => useUiStore.getState().toggleExplorer(),
    },
    {
      id: "ui.toggleBottomPanel",
      label: "Toggle Bottom Panel",
      keybinding: "Ctrl+`",
      execute: () => useUiStore.getState().toggleBottomPanel(),
    },
    {
      id: "ui.toggleSearch",
      label: "Toggle Search",
      keybinding: "Ctrl+Shift+F",
      execute: () => useUiStore.getState().toggleSearch(),
    },
    {
      id: "ui.viewTerminal",
      label: "Switch to Terminal",
      keybinding: "Ctrl+1",
      execute: () => useUiStore.getState().setActiveView("terminal"),
    },
    {
      id: "ui.viewEditor",
      label: "Switch to Editor",
      keybinding: "Ctrl+2",
      execute: () => useUiStore.getState().setActiveView("editor"),
    },
    {
      id: "ui.viewDiff",
      label: "Switch to Diff",
      keybinding: "Ctrl+3",
      execute: () => useUiStore.getState().setActiveView("diff"),
    },
    {
      id: "ui.splitVertical",
      label: "Split Vertical",
      keybinding: "Ctrl+\\",
      execute: () => useUiStore.getState().splitVertical(),
    },
    {
      id: "ui.splitHorizontal",
      label: "Split Horizontal",
      keybinding: "Ctrl+Shift+\\",
      execute: () => useUiStore.getState().splitHorizontal(),
    },
    {
      id: "ui.closeSplit",
      label: "Close Split",
      keybinding: "Ctrl+W",
      execute: () => useUiStore.getState().closeSplit(),
    },
    {
      id: "terminal.prevTurn",
      label: "Previous Agent Turn",
      keybinding: "Alt+↑",
      execute: () => window.dispatchEvent(new CustomEvent("terminal:navigate-turn", { detail: { direction: "prev" } })),
    },
    {
      id: "terminal.nextTurn",
      label: "Next Agent Turn",
      keybinding: "Alt+↓",
      execute: () => window.dispatchEvent(new CustomEvent("terminal:navigate-turn", { detail: { direction: "next" } })),
    },
  ];
}
