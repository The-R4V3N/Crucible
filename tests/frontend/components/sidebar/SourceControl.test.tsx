import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SourceControl from "@/components/sidebar/SourceControl";

describe("SourceControl", () => {
  it("renders nothing when gitStatus is null", () => {
    const { container } = render(<SourceControl gitStatus={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows branch name", () => {
    render(
      <SourceControl
        gitStatus={{ branch: "main", dirty: false, changed_files: 0, changed_file_paths: [] }}
      />,
    );
    expect(screen.getByTestId("git-branch")).toHaveTextContent("main");
  });

  it("shows dirty indicator when dirty", () => {
    render(
      <SourceControl
        gitStatus={{ branch: "main", dirty: true, changed_files: 3, changed_file_paths: ["a.ts", "b.ts", "c.ts"] }}
      />,
    );
    expect(screen.getByTestId("git-dirty")).toBeInTheDocument();
  });

  it("does not show dirty indicator when clean", () => {
    render(
      <SourceControl
        gitStatus={{ branch: "main", dirty: false, changed_files: 0, changed_file_paths: [] }}
      />,
    );
    expect(screen.queryByTestId("git-dirty")).not.toBeInTheDocument();
  });

  it("shows changed file count", () => {
    render(
      <SourceControl
        gitStatus={{ branch: "main", dirty: true, changed_files: 5, changed_file_paths: ["a", "b", "c", "d", "e"] }}
      />,
    );
    expect(screen.getByTestId("git-changed-count")).toHaveTextContent(
      "5 files changed",
    );
  });

  it("shows singular file when 1 changed", () => {
    render(
      <SourceControl
        gitStatus={{ branch: "main", dirty: true, changed_files: 1, changed_file_paths: ["a.ts"] }}
      />,
    );
    expect(screen.getByTestId("git-changed-count")).toHaveTextContent(
      "1 file changed",
    );
  });

  it("shows individual changed file names", () => {
    render(
      <SourceControl
        gitStatus={{
          branch: "main",
          dirty: true,
          changed_files: 2,
          changed_file_paths: ["src/App.tsx", "src/lib/ipc.ts"],
        }}
      />,
    );
    expect(screen.getByText("src/App.tsx")).toBeInTheDocument();
    expect(screen.getByText("src/lib/ipc.ts")).toBeInTheDocument();
  });

  it("does not show file list when no changes", () => {
    render(
      <SourceControl
        gitStatus={{ branch: "main", dirty: false, changed_files: 0, changed_file_paths: [] }}
        onFileClick={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("changed-files-list")).not.toBeInTheDocument();
  });

  it("calls onFileClick when a changed file is clicked", () => {
    const onFileClick = vi.fn();
    render(
      <SourceControl
        gitStatus={{
          branch: "main",
          dirty: true,
          changed_files: 2,
          changed_file_paths: ["src/App.tsx", "src/lib/ipc.ts"],
        }}
        onFileClick={onFileClick}
      />,
    );
    fireEvent.click(screen.getByText("src/App.tsx"));
    expect(onFileClick).toHaveBeenCalledWith("src/App.tsx");
  });
});
