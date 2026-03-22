import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { useSessionStore } from "@/stores/sessionStore";
import Sidebar from "@/components/sidebar/Sidebar";

const mockProjects = [
  { name: "project-a", path: "/tmp/a", command: "bash" },
  { name: "project-b", path: "/tmp/b", command: "bash" },
];

describe("Sidebar", () => {
  beforeEach(() => {
    useUiStore.setState({ sidebarVisible: true });
    useSessionStore.setState({ sessions: {}, activeSessionId: null });
  });

  it("renders when visible", () => {
    render(<Sidebar projects={mockProjects} />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("does not render when hidden", () => {
    useUiStore.setState({ sidebarVisible: false });
    render(<Sidebar projects={mockProjects} />);
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
  });

  it("shows WARP logo", () => {
    render(<Sidebar projects={mockProjects} />);
    expect(screen.getByText("WARP")).toBeInTheDocument();
  });

  it("renders project list", () => {
    render(<Sidebar projects={mockProjects} />);
    expect(screen.getByTestId("project-list")).toBeInTheDocument();
  });
});
