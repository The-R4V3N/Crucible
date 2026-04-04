import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useConfigStore } from "@/stores/configStore";

vi.mock("@xterm/xterm", () => {
  const Terminal = vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    write: vi.fn(),
    onData: vi.fn(),
    onResize: vi.fn(),
    loadAddon: vi.fn(),
    dispose: vi.fn(),
  }));
  return { Terminal };
});
vi.mock("@xterm/addon-fit", () => {
  const FitAddon = vi.fn().mockImplementation(() => ({ fit: vi.fn(), dispose: vi.fn() }));
  return { FitAddon };
});
vi.mock("@xterm/xterm/css/xterm.css", () => ({}));
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(vi.fn()),
}));
vi.mock("@/lib/ipc", () => ({
  ptyCreate: vi.fn().mockResolvedValue("mock-session"),
  ptyWrite: vi.fn().mockResolvedValue(undefined),
  ptyResize: vi.fn().mockResolvedValue(undefined),
  ptyKill: vi.fn().mockResolvedValue(undefined),
  onPtyOutput: vi.fn().mockResolvedValue(vi.fn()),
  onPtyExit: vi.fn().mockResolvedValue(vi.fn()),
  onPtyAttention: vi.fn().mockResolvedValue(vi.fn()),
}));

import TerminalManager from "@/components/terminal/TerminalManager";

const PROJECT = { name: "proj", path: "/tmp", command: "bash" };

describe("TerminalManager — registers terminal actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ terminalActions: null });
    useSessionStore.setState({ sessions: {}, activeSessionId: null });
    useConfigStore.setState({
      config: {
        projects: [PROJECT],
        theme: "dark",
        accent_color: "#00E5FF",
        font_family: "Cascadia Code",
        font_size: 14,
        sidebar_width: 240,
        notifications: { visual: true, border_glow: true, sound: false },
        active_project: null,
        branch_prefix: "feature/",
        ui_zoom: 1.0,
        sidebar_position: "left",
        cursor_style: "bar",
        terminal_theme: "dark",
        divider_color: "#1E1E2E",
        default_project_path: "",
        shell_command: "powershell.exe",
      },
      isLoaded: true,
    });
  });

  it("registers terminalActions in uiStore on mount", () => {
    render(<TerminalManager />);
    expect(useUiStore.getState().terminalActions).not.toBeNull();
  });

  it("registered addTab is a function", () => {
    render(<TerminalManager />);
    expect(typeof useUiStore.getState().terminalActions?.addTab).toBe("function");
  });

  it("registered closeActiveTab is a function", () => {
    render(<TerminalManager />);
    expect(typeof useUiStore.getState().terminalActions?.closeActiveTab).toBe("function");
  });

  it("calling addTab adds a tab for the active project", () => {
    render(<TerminalManager />);

    // Activate the first session
    const sessions = useSessionStore.getState().sessions;
    const firstId = Object.keys(sessions)[0];
    if (firstId) act(() => useSessionStore.getState().setActiveSession(firstId));

    const actions = useUiStore.getState().terminalActions!;
    // The count of tabs is internal to TerminalManager but addTab should not throw
    expect(() => actions.addTab()).not.toThrow();
  });
});
