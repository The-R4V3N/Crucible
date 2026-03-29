import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/stores/uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUiStore.setState({ sidebarVisible: true, activePanel: null, lastActivePanel: null });
  });

  it("sidebar is visible by default", () => {
    expect(useUiStore.getState().sidebarVisible).toBe(true);
  });

  it("toggleSidebar closes the active panel and remembers it", () => {
    useUiStore.setState({ activePanel: "explorer" });
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().activePanel).toBeNull();
    expect(useUiStore.getState().lastActivePanel).toBe("explorer");
  });

  it("toggleSidebar restores the last active panel", () => {
    useUiStore.setState({ activePanel: null, lastActivePanel: "search" as const });
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().activePanel).toBe("search");
  });

  it("toggleSidebar opens explorer when no previous panel", () => {
    useUiStore.setState({ activePanel: null, lastActivePanel: null });
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().activePanel).toBe("explorer");
  });

  it("setSidebarVisible sets explicit value", () => {
    useUiStore.getState().setSidebarVisible(false);
    expect(useUiStore.getState().sidebarVisible).toBe(false);
  });
});
