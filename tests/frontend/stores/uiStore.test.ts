import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/stores/uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUiStore.setState({ sidebarVisible: true });
  });

  it("sidebar is visible by default", () => {
    expect(useUiStore.getState().sidebarVisible).toBe(true);
  });

  it("toggleSidebar hides sidebar", () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarVisible).toBe(false);
  });

  it("toggleSidebar shows sidebar again", () => {
    useUiStore.getState().toggleSidebar();
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarVisible).toBe(true);
  });

  it("setSidebarVisible sets explicit value", () => {
    useUiStore.getState().setSidebarVisible(false);
    expect(useUiStore.getState().sidebarVisible).toBe(false);
  });
});
