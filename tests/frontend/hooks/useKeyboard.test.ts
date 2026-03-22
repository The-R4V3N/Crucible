import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useKeyboard } from "@/hooks/useKeyboard";

const mockProjects = [
  { name: "alpha", path: "/tmp/alpha", command: "bash" },
  { name: "beta", path: "/tmp/beta", command: "bash" },
];

describe("useKeyboard", () => {
  beforeEach(() => {
    useUiStore.setState({ sidebarVisible: true });
    useSessionStore.setState({
      sessions: {
        s1: { id: "s1", projectName: "alpha", status: "running" },
        s2: { id: "s2", projectName: "beta", status: "running" },
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
});
