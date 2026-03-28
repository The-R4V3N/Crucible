import { describe, it, expect, vi, beforeEach } from "vitest";

const mockToggleSidebar = vi.fn();
const mockToggleExplorer = vi.fn();
const mockToggleBottomPanel = vi.fn();
const mockToggleSearch = vi.fn();
const mockSetActiveView = vi.fn();
const mockSplitVertical = vi.fn();
const mockSplitHorizontal = vi.fn();
const mockCloseSplit = vi.fn();

vi.mock("@/stores/uiStore", () => ({
  useUiStore: {
    getState: () => ({
      toggleSidebar: mockToggleSidebar,
      toggleExplorer: mockToggleExplorer,
      toggleBottomPanel: mockToggleBottomPanel,
      toggleSearch: mockToggleSearch,
      setActiveView: mockSetActiveView,
      splitVertical: mockSplitVertical,
      splitHorizontal: mockSplitHorizontal,
      closeSplit: mockCloseSplit,
    }),
  },
}));

import { getCommands } from "@/lib/commandRegistry";

describe("getCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array", () => {
    expect(Array.isArray(getCommands())).toBe(true);
  });

  it("returns at least one command", () => {
    expect(getCommands().length).toBeGreaterThan(0);
  });

  it("every command has id, label, and execute", () => {
    for (const cmd of getCommands()) {
      expect(typeof cmd.id).toBe("string");
      expect(typeof cmd.label).toBe("string");
      expect(typeof cmd.execute).toBe("function");
    }
  });

  it("all command ids are unique", () => {
    const ids = getCommands().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains ui.toggleSidebar", () => {
    const ids = getCommands().map((c) => c.id);
    expect(ids).toContain("ui.toggleSidebar");
  });

  it("contains ui.splitVertical", () => {
    const ids = getCommands().map((c) => c.id);
    expect(ids).toContain("ui.splitVertical");
  });

  it("contains view commands for terminal, editor, diff", () => {
    const ids = getCommands().map((c) => c.id);
    expect(ids).toContain("ui.viewTerminal");
    expect(ids).toContain("ui.viewEditor");
    expect(ids).toContain("ui.viewDiff");
  });

  it("commands with keybinding have a string value", () => {
    for (const cmd of getCommands()) {
      if (cmd.keybinding !== undefined) {
        expect(typeof cmd.keybinding).toBe("string");
      }
    }
  });

  it("ui.toggleSidebar execute calls toggleSidebar action", () => {
    const cmd = getCommands().find((c) => c.id === "ui.toggleSidebar")!;
    cmd.execute();
    expect(mockToggleSidebar).toHaveBeenCalledOnce();
  });

  it("ui.splitVertical execute calls splitVertical action", () => {
    const cmd = getCommands().find((c) => c.id === "ui.splitVertical")!;
    cmd.execute();
    expect(mockSplitVertical).toHaveBeenCalledOnce();
  });

  it("ui.viewTerminal execute calls setActiveView with terminal", () => {
    const cmd = getCommands().find((c) => c.id === "ui.viewTerminal")!;
    cmd.execute();
    expect(mockSetActiveView).toHaveBeenCalledWith("terminal");
  });
});
