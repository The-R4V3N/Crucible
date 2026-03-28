import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSessionStore } from "@/stores/sessionStore";
import TerminalTabBar from "@/components/terminal/TerminalTabBar";
import type { TerminalTab } from "@/components/terminal/TerminalTabBar";

const TABS: TerminalTab[] = [
  { tabKey: "proj-a-1", projectName: "project-a", cwd: "/a", command: "bash" },
  { tabKey: "proj-a-2", projectName: "project-a", cwd: "/a", command: "bash" },
  { tabKey: "proj-b-1", projectName: "project-b", cwd: "/b", command: "powershell" },
];

describe("TerminalTabBar", () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessions: {
        "sess-1": {
          id: "sess-1",
          projectName: "project-a",
          tabKey: "proj-a-1",
          label: "bash",
          status: "running",
          needsAttention: false,
        },
        "sess-2": {
          id: "sess-2",
          projectName: "project-a",
          tabKey: "proj-a-2",
          label: "bash",
          status: "running",
          needsAttention: false,
        },
        "sess-3": {
          id: "sess-3",
          projectName: "project-b",
          tabKey: "proj-b-1",
          label: "powershell",
          status: "running",
          needsAttention: false,
        },
      },
      activeSessionId: "sess-1",
    });
  });

  it("renders the tab bar", () => {
    render(<TerminalTabBar tabs={TABS} onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId("terminal-tab-bar")).toBeInTheDocument();
  });

  it("shows tabs for the active project only", () => {
    render(<TerminalTabBar tabs={TABS} onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId("tab-proj-a-1")).toBeInTheDocument();
    expect(screen.getByTestId("tab-proj-a-2")).toBeInTheDocument();
    expect(screen.queryByTestId("tab-proj-b-1")).not.toBeInTheDocument();
  });

  it("marks the active tab with data-active", () => {
    render(<TerminalTabBar tabs={TABS} onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId("tab-proj-a-1")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("tab-proj-a-2")).toHaveAttribute("data-active", "false");
  });

  it("clicking a tab calls setActiveSession with session id", () => {
    const setActiveSession = vi.spyOn(useSessionStore.getState(), "setActiveSession");
    render(<TerminalTabBar tabs={TABS} onAdd={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId("tab-proj-a-2"));
    expect(setActiveSession).toHaveBeenCalledWith("sess-2");
  });

  it("clicking + calls onAdd", () => {
    const onAdd = vi.fn();
    render(<TerminalTabBar tabs={TABS} onAdd={onAdd} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId("tab-add-btn"));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("clicking × on a tab calls onClose with the tabKey", () => {
    const onClose = vi.fn();
    render(<TerminalTabBar tabs={TABS} onAdd={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("tab-close-proj-a-2"));
    expect(onClose).toHaveBeenCalledWith("proj-a-2");
  });

  it("shows session label in the tab", () => {
    render(<TerminalTabBar tabs={TABS} onAdd={vi.fn()} onClose={vi.fn()} />);
    const tab = screen.getByTestId("tab-proj-a-1");
    expect(tab).toHaveTextContent("bash");
  });

  it("does not show close button for the last tab in a project", () => {
    // When there is only one tab for the active project, × is hidden
    useSessionStore.setState({
      sessions: {
        "sess-only": {
          id: "sess-only",
          projectName: "solo",
          tabKey: "solo-1",
          label: "cmd",
          status: "running",
          needsAttention: false,
        },
      },
      activeSessionId: "sess-only",
    });
    const singleTab: TerminalTab[] = [
      { tabKey: "solo-1", projectName: "solo", cwd: "/s", command: "cmd" },
    ];
    render(<TerminalTabBar tabs={singleTab} onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByTestId("tab-close-solo-1")).not.toBeInTheDocument();
  });
});
