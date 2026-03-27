import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { useSessionStore } from "@/stores/sessionStore";
import { usePaletteStore } from "@/stores/paletteStore";
import { useKeyboard } from "@/hooks/useKeyboard";

const mockProjects = [
  { name: "alpha", path: "/tmp/alpha", command: "bash" },
  { name: "beta", path: "/tmp/beta", command: "bash" },
];

describe("useKeyboard", () => {
  beforeEach(() => {
    useUiStore.setState({ sidebarVisible: true });
    usePaletteStore.setState({
      open: false,
      mode: "command",
      query: "",
      activeIndex: 0,
    });
    useSessionStore.setState({
      sessions: {
        s1: {
          id: "s1",
          projectName: "alpha",
          status: "running",
          needsAttention: false,
        },
        s2: {
          id: "s2",
          projectName: "beta",
          status: "running",
          needsAttention: false,
        },
      },
      activeSessionId: "s1",
    });
  });

  it("Ctrl+B toggles sidebar", () => {
    renderHook(() => useKeyboard({ projects: mockProjects }));
    expect(useUiStore.getState().sidebarVisible).toBe(true);

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
    );
    expect(useUiStore.getState().sidebarVisible).toBe(false);

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
    );
    expect(useUiStore.getState().sidebarVisible).toBe(true);
  });

  it("F1 switches to first project", () => {
    useSessionStore.setState({ activeSessionId: "s2" });
    renderHook(() => useKeyboard({ projects: mockProjects }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "F1" }));
    expect(useSessionStore.getState().activeSessionId).toBe("s1");
  });

  it("F2 switches to second project", () => {
    renderHook(() => useKeyboard({ projects: mockProjects }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "F2" }));
    expect(useSessionStore.getState().activeSessionId).toBe("s2");
  });

  it("F3 does nothing with only 2 projects", () => {
    renderHook(() => useKeyboard({ projects: mockProjects }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "F3" }));
    // Should remain on s1 (unchanged)
    expect(useSessionStore.getState().activeSessionId).toBe("s1");
  });

  it("Ctrl+Shift+P opens command palette", () => {
    renderHook(() => useKeyboard({ projects: mockProjects }));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "P", ctrlKey: true, shiftKey: true }),
    );
    const s = usePaletteStore.getState();
    expect(s.open).toBe(true);
    expect(s.mode).toBe("command");
  });

  it("Ctrl+P opens file palette", () => {
    renderHook(() => useKeyboard({ projects: mockProjects }));
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "p",
        ctrlKey: true,
        shiftKey: false,
      }),
    );
    const s = usePaletteStore.getState();
    expect(s.open).toBe(true);
    expect(s.mode).toBe("file");
  });

  it("Ctrl+B does not toggle sidebar when palette is open", () => {
    usePaletteStore.setState({ open: true });
    renderHook(() => useKeyboard({ projects: mockProjects }));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
    );
    expect(useUiStore.getState().sidebarVisible).toBe(true);
  });
});
