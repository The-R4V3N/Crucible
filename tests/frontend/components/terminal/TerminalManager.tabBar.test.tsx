import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSessionStore } from "@/stores/sessionStore";
import { useConfigStore } from "@/stores/configStore";

// Stub TerminalView so we don't need xterm in these tests
vi.mock("@/components/terminal/TerminalView", () => ({
  default: vi.fn(({ tabKey }: { tabKey: string }) => (
    <div data-testid={`terminal-view-${tabKey}`} />
  )),
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn() }));

import TerminalManager from "@/components/terminal/TerminalManager";

describe("TerminalManager terminal tabs", () => {
  beforeEach(() => {
    useSessionStore.setState({ sessions: {}, activeSessionId: null });
    useConfigStore.setState({
      config: {
        projects: [{ name: "alpha", path: "/alpha", command: "bash" }],
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

  it("renders the terminal-tab-bar", () => {
    render(<TerminalManager />);
    expect(screen.getByTestId("terminal-tab-bar")).toBeInTheDocument();
  });

  it("renders one initial terminal pane per project", () => {
    render(<TerminalManager />);
    expect(screen.getByTestId("terminal-view-alpha")).toBeInTheDocument();
  });

  it("clicking + adds a second terminal pane for the active project", () => {
    // Set up an active session so the tab bar knows which project is active
    useSessionStore.setState({
      sessions: {
        s1: {
          id: "s1",
          projectName: "alpha",
          tabKey: "alpha",
          label: "bash",
          status: "running",
          needsAttention: false,
          turns: [],
        },
      },
      activeSessionId: "s1",
    });

    render(<TerminalManager />);
    fireEvent.click(screen.getByTestId("tab-add-btn"));

    // A second terminal pane should be mounted
    const views = screen.getAllByTestId(/^terminal-view-/);
    expect(views.length).toBe(2);
  });

  it("closing a tab removes its terminal pane", () => {
    useSessionStore.setState({
      sessions: {
        s1: {
          id: "s1",
          projectName: "alpha",
          tabKey: "alpha",
          label: "bash",
          status: "running",
          needsAttention: false,
          turns: [],
        },
        s2: {
          id: "s2",
          projectName: "alpha",
          tabKey: "alpha-2",
          label: "bash",
          status: "running",
          needsAttention: false,
          turns: [],
        },
      },
      activeSessionId: "s1",
    });

    // Start with two tabs
    const { rerender } = render(<TerminalManager />);
    // Manually trigger adding a second tab by simulating the state that TerminalManager
    // would create — we pre-seed the session store, but the tab list is in component state.
    // We need the component to already have two tabs.
    // Re-render after clicking + to add the second tab.
    fireEvent.click(screen.getByTestId("tab-add-btn"));
    rerender(<TerminalManager />);

    const viewsBefore = screen.getAllByTestId(/^terminal-view-/);
    expect(viewsBefore.length).toBe(2);

    // Close the second tab (its close button)
    const closeBtns = screen.queryAllByTestId(/^tab-close-/);
    expect(closeBtns.length).toBeGreaterThan(0);
    fireEvent.click(closeBtns[0]!);

    const viewsAfter = screen.getAllByTestId(/^terminal-view-/);
    expect(viewsAfter.length).toBe(1);
  });
});
