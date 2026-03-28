import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSessionStore } from "@/stores/sessionStore";
import ProjectList from "@/components/sidebar/ProjectList";

const mockProjects = [
  { name: "alpha", path: "/tmp/alpha", command: "bash" },
  { name: "beta", path: "/tmp/beta", command: "bash" },
];

describe("ProjectList", () => {
  beforeEach(() => {
    useSessionStore.setState({ sessions: {}, activeSessionId: null });
  });

  it("renders all projects", () => {
    render(<ProjectList projects={mockProjects} />);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("shows status dots for each project", () => {
    render(<ProjectList projects={mockProjects} />);
    expect(screen.getByTestId("status-dot-alpha")).toBeInTheDocument();
    expect(screen.getByTestId("status-dot-beta")).toBeInTheDocument();
  });

  it("highlights active project", () => {
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
      },
      activeSessionId: "s1",
    });
    render(<ProjectList projects={mockProjects} />);
    const item = screen.getByTestId("project-item-alpha");
    expect(item.className).toContain("bg-warp-bg");
  });

  it("clicking project switches active session", () => {
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
    render(<ProjectList projects={mockProjects} />);
    fireEvent.click(screen.getByTestId("project-item-beta"));
    expect(useSessionStore.getState().activeSessionId).toBe("s2");
  });

  it("shows green dot for running session", () => {
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
      },
      activeSessionId: "s1",
    });
    render(<ProjectList projects={mockProjects} />);
    const dot = screen.getByTestId("status-dot-alpha");
    expect(dot.className).toContain("bg-warp-success");
  });

  it("shows red dot for stopped session", () => {
    useSessionStore.setState({
      sessions: {
        s1: {
          id: "s1",
          projectName: "alpha",
          status: "stopped",
          needsAttention: false,
          tabKey: "",
          label: "",
        },
      },
      activeSessionId: "s1",
    });
    render(<ProjectList projects={mockProjects} />);
    const dot = screen.getByTestId("status-dot-alpha");
    expect(dot.className).toContain("bg-warp-error");
  });
});
