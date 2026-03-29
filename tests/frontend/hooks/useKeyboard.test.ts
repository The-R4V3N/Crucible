import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { useSessionStore } from "@/stores/sessionStore";
import { usePaletteStore } from "@/stores/paletteStore";
import { useKeyboard } from "@/hooks/useKeyboard";

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(vi.fn()),
}));

import { listen } from "@tauri-apps/api/event";
const mockListen = vi.mocked(listen);

const mockProjects = [
  { name: "alpha", path: "/tmp/alpha", command: "bash" },
  { name: "beta", path: "/tmp/beta", command: "bash" },
];

describe("useKeyboard", () => {
  beforeEach(() => {
    useUiStore.setState({ activePanel: "explorer", lastActivePanel: null });
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
          tabKey: "",
          label: "",
        },
        s2: {
          id: "s2",
          projectName: "beta",
          status: "running",
          needsAttention: false,
          tabKey: "",
          label: "",
        },
      },
      activeSessionId: "s1",
    });
  });

  it("Ctrl+B closes the sidebar when a panel is open", () => {
    useUiStore.setState({ activePanel: "explorer" });
    renderHook(() => useKeyboard({ projects: mockProjects }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b", ctrlKey: true }));
    expect(useUiStore.getState().activePanel).toBeNull();
  });

  it("Ctrl+B restores the last active panel when sidebar is closed", () => {
    useUiStore.setState({ activePanel: null, lastActivePanel: "explorer" as const });
    renderHook(() => useKeyboard({ projects: mockProjects }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b", ctrlKey: true }));
    expect(useUiStore.getState().activePanel).toBe("explorer");
  });

  it("Ctrl+B opens explorer by default when no previous panel", () => {
    useUiStore.setState({ activePanel: null, lastActivePanel: null });
    renderHook(() => useKeyboard({ projects: mockProjects }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b", ctrlKey: true }));
    expect(useUiStore.getState().activePanel).toBe("explorer");
  });

  it("Ctrl+B remembers the closed panel for the next open", () => {
    useUiStore.setState({ activePanel: "search" });
    renderHook(() => useKeyboard({ projects: mockProjects }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b", ctrlKey: true }));
    expect(useUiStore.getState().activePanel).toBeNull();
    expect(useUiStore.getState().lastActivePanel).toBe("search");
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
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "P", ctrlKey: true, shiftKey: true }));
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
    useUiStore.setState({ activePanel: "explorer" });
    usePaletteStore.setState({ open: true });
    renderHook(() => useKeyboard({ projects: mockProjects }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b", ctrlKey: true }));
    expect(useUiStore.getState().activePanel).toBe("explorer");
  });

  it("subscribes to palette:open-command Tauri event on mount", () => {
    renderHook(() => useKeyboard({ projects: mockProjects }));
    expect(mockListen).toHaveBeenCalledWith("palette:open-command", expect.any(Function));
  });

  it("subscribes to palette:open-file Tauri event on mount", () => {
    renderHook(() => useKeyboard({ projects: mockProjects }));
    expect(mockListen).toHaveBeenCalledWith("palette:open-file", expect.any(Function));
  });

  it("palette:open-command event opens command palette", async () => {
    renderHook(() => useKeyboard({ projects: mockProjects }));
    const calls = mockListen.mock.calls;
    const commandCall = calls.find((c) => c[0] === "palette:open-command");
    expect(commandCall).toBeDefined();
    const handler = commandCall![1] as () => void;
    await act(async () => {
      handler();
    });
    const s = usePaletteStore.getState();
    expect(s.open).toBe(true);
    expect(s.mode).toBe("command");
  });

  it("palette:open-file event opens file palette", async () => {
    renderHook(() => useKeyboard({ projects: mockProjects }));
    const calls = mockListen.mock.calls;
    const fileCall = calls.find((c) => c[0] === "palette:open-file");
    expect(fileCall).toBeDefined();
    const handler = fileCall![1] as () => void;
    await act(async () => {
      handler();
    });
    const s = usePaletteStore.getState();
    expect(s.open).toBe(true);
    expect(s.mode).toBe("file");
  });

  it("unlistens Tauri events on unmount", async () => {
    const unlisten = vi.fn();
    mockListen.mockResolvedValue(unlisten);
    const { unmount } = renderHook(() => useKeyboard({ projects: mockProjects }));
    // Wait for async listen to resolve
    await act(async () => {});
    unmount();
    expect(unlisten).toHaveBeenCalled();
  });
});
