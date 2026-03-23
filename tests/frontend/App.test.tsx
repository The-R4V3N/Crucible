import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useConfigStore } from "@/stores/configStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useUiStore } from "@/stores/uiStore";

// Mock xterm.js
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
  const FitAddon = vi.fn().mockImplementation(() => ({
    fit: vi.fn(),
    dispose: vi.fn(),
  }));
  return { FitAddon };
});

vi.mock("@xterm/xterm/css/xterm.css", () => ({}));

vi.mock("@/hooks/useSession", () => ({
  useSession: vi.fn().mockReturnValue({
    sessionId: null,
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
  }),
}));

vi.mock("@/lib/ipc", () => ({
  configLoad: vi.fn().mockResolvedValue({
    projects: [{ name: "test-project", path: "/tmp", command: "bash" }],
    theme: "dark",
    accent_color: "#00E5FF",
    font_family: "Cascadia Code",
    font_size: 14,
    sidebar_width: 240,
    notifications: { visual: true, border_glow: true, sound: false },
  }),
  ptyCreate: vi.fn().mockResolvedValue("mock-session"),
  ptyWrite: vi.fn().mockResolvedValue(undefined),
  ptyResize: vi.fn().mockResolvedValue(undefined),
  ptyKill: vi.fn().mockResolvedValue(undefined),
  onPtyOutput: vi.fn().mockResolvedValue(vi.fn()),
  onPtyExit: vi.fn().mockResolvedValue(vi.fn()),
  gitStatus: vi.fn().mockResolvedValue({ branch: "main", dirty: false, changed_files: 0, changed_file_paths: [] }),
  gitDiff: vi.fn().mockResolvedValue({ path: "", old_content: "", new_content: "" }),
  fileTree: vi.fn().mockResolvedValue({ name: "root", path: "/tmp", is_dir: true, children: [] }),
  fileRead: vi.fn().mockResolvedValue(""),
  fileWrite: vi.fn().mockResolvedValue(undefined),
  fileWatchStart: vi.fn().mockResolvedValue(undefined),
  onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
}));

vi.mock("@monaco-editor/react", () => ({
  default: vi.fn(() => <div data-testid="monaco-editor" />),
  DiffEditor: vi.fn(() => <div data-testid="monaco-diff-editor" />),
}));

import App from "@/App";

describe("App", () => {
  beforeEach(() => {
    useConfigStore.setState({ config: null, isLoaded: false });
    useSessionStore.setState({ sessions: {}, activeSessionId: null });
    useUiStore.setState({ sidebarVisible: true, explorerVisible: false, activeView: "terminal" });
  });

  it("shows loading state initially", () => {
    render(<App />);
    expect(screen.getByText("WARP")).toBeInTheDocument();
  });

  it("renders sidebar and terminal after config loads", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    });
    expect(screen.getByTestId("terminal-manager")).toBeInTheDocument();
  });
});
