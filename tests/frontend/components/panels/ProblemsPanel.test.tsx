import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useProblemsStore } from "@/stores/problemsStore";
import { useFileStore } from "@/stores/fileStore";
import ProblemsPanel from "@/components/panels/ProblemsPanel";

describe("ProblemsPanel", () => {
  beforeEach(() => {
    useProblemsStore.setState({ problems: [], activeBottomTab: "changes" });
    useFileStore.setState({ tree: null, openFiles: [], activeFilePath: null, expandedDirs: new Set() });
  });

  it("shows empty state when there are no problems", () => {
    render(<ProblemsPanel />);
    expect(screen.getByText("No problems detected")).toBeInTheDocument();
  });

  it("renders error problems with correct icon and message", () => {
    useProblemsStore.setState({
      problems: [
        { filePath: "/src/App.tsx", line: 5, col: 3, message: "Type error", severity: "error" },
      ],
    });
    render(<ProblemsPanel />);
    expect(screen.getByText("Type error")).toBeInTheDocument();
    expect(screen.getByTestId("problem-icon-error")).toBeInTheDocument();
  });

  it("renders warning problems with correct icon", () => {
    useProblemsStore.setState({
      problems: [
        { filePath: "/src/App.tsx", line: 2, col: 1, message: "Unused variable", severity: "warning" },
      ],
    });
    render(<ProblemsPanel />);
    expect(screen.getByTestId("problem-icon-warning")).toBeInTheDocument();
  });

  it("shows file path and line:col for each problem", () => {
    useProblemsStore.setState({
      problems: [
        { filePath: "/src/App.tsx", line: 10, col: 4, message: "err", severity: "error" },
      ],
    });
    render(<ProblemsPanel />);
    expect(screen.getByText("App.tsx")).toBeInTheDocument();
    expect(screen.getByText("10:4")).toBeInTheDocument();
  });

  it("groups problems under their file", () => {
    useProblemsStore.setState({
      problems: [
        { filePath: "/src/App.tsx", line: 1, col: 1, message: "err1", severity: "error" },
        { filePath: "/src/App.tsx", line: 2, col: 1, message: "err2", severity: "error" },
        { filePath: "/src/utils.ts", line: 5, col: 1, message: "warn1", severity: "warning" },
      ],
    });
    render(<ProblemsPanel />);
    // Two file groups
    expect(screen.getAllByTestId("problem-file-group")).toHaveLength(2);
    // Both messages visible
    expect(screen.getByText("err1")).toBeInTheDocument();
    expect(screen.getByText("err2")).toBeInTheDocument();
    expect(screen.getByText("warn1")).toBeInTheDocument();
  });

  it("clicking a problem entry opens the file", () => {
    useProblemsStore.setState({
      problems: [
        { filePath: "/src/App.tsx", line: 5, col: 3, message: "Type error", severity: "error" },
      ],
    });
    render(<ProblemsPanel />);
    fireEvent.click(screen.getByText("Type error"));
    expect(useFileStore.getState().activeFilePath).toBe("/src/App.tsx");
  });
});
