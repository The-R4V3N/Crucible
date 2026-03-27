import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SourceControl from "@/components/sidebar/SourceControl";
import { useUiStore } from "@/stores/uiStore";
import { useFileStore } from "@/stores/fileStore";

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

  describe("default file click (no onFileClick prop)", () => {
    beforeEach(() => {
      // Reset stores to known state
      useUiStore.setState({
        activeView: "terminal",
        splitMode: null,
        splitViews: ["terminal", "terminal"] as [
          "terminal" | "editor" | "diff",
          "terminal" | "editor" | "diff",
        ],
      });
      useFileStore.setState({
        openFiles: [],
        activeFilePath: null,
      });
    });

    it("opens file in fileStore and switches to editor view", () => {
      render(
        <SourceControl
          gitStatus={{
            branch: "main",
            dirty: true,
            changed_files: 1,
            changed_file_paths: ["src/App.tsx"],
          }}
        />,
      );

      fireEvent.click(screen.getByText("src/App.tsx"));

      // File should be opened in fileStore
      const fileState = useFileStore.getState();
      expect(fileState.activeFilePath).toBe("src/App.tsx");
      expect(fileState.openFiles).toContainEqual({
        path: "src/App.tsx",
        name: "App.tsx",
      });

      // Should switch to editor view
      expect(useUiStore.getState().activeView).toBe("editor");
    });

    it("closes split mode when clicking a file while split is active", () => {
      // Activate split mode first
      useUiStore.getState().splitVertical();
      expect(useUiStore.getState().splitMode).toBe("vertical");

      render(
        <SourceControl
          gitStatus={{
            branch: "main",
            dirty: true,
            changed_files: 1,
            changed_file_paths: ["src/App.tsx"],
          }}
        />,
      );

      fireEvent.click(screen.getByText("src/App.tsx"));

      // Split mode should be closed
      expect(useUiStore.getState().splitMode).toBeNull();
      // Should be in editor view
      expect(useUiStore.getState().activeView).toBe("editor");
    });

    it("does not leave splitMode active after clicking file from terminal view", () => {
      // Start from terminal, no split
      useUiStore.setState({ activeView: "terminal", splitMode: null });

      render(
        <SourceControl
          gitStatus={{
            branch: "main",
            dirty: true,
            changed_files: 1,
            changed_file_paths: ["src/utils.ts"],
          }}
        />,
      );

      fireEvent.click(screen.getByText("src/utils.ts"));

      // Must NOT be in split mode
      expect(useUiStore.getState().splitMode).toBeNull();
      // Must be showing editor
      expect(useUiStore.getState().activeView).toBe("editor");
      // File must be open
      expect(useFileStore.getState().activeFilePath).toBe("src/utils.ts");
    });

    it("prepends projectPath to git-relative file paths", () => {
      render(
        <SourceControl
          gitStatus={{
            branch: "main",
            dirty: true,
            changed_files: 1,
            changed_file_paths: ["src/App.tsx"],
          }}
          projectPath="D:/Development/Nexus"
        />,
      );

      fireEvent.click(screen.getByText("src/App.tsx"));

      // File path should be absolute (projectPath + git-relative path)
      const fileState = useFileStore.getState();
      expect(fileState.activeFilePath).toBe("D:/Development/Nexus/src/App.tsx");
      expect(fileState.openFiles).toContainEqual({
        path: "D:/Development/Nexus/src/App.tsx",
        name: "App.tsx",
      });
    });

    it("handles projectPath with trailing slash", () => {
      render(
        <SourceControl
          gitStatus={{
            branch: "main",
            dirty: true,
            changed_files: 1,
            changed_file_paths: ["README.md"],
          }}
          projectPath="D:/Development/Nexus/"
        />,
      );

      fireEvent.click(screen.getByText("README.md"));

      expect(useFileStore.getState().activeFilePath).toBe(
        "D:/Development/Nexus/README.md",
      );
    });

    it("works without projectPath (backwards compatible)", () => {
      render(
        <SourceControl
          gitStatus={{
            branch: "main",
            dirty: true,
            changed_files: 1,
            changed_file_paths: ["src/App.tsx"],
          }}
        />,
      );

      fireEvent.click(screen.getByText("src/App.tsx"));

      // Without projectPath, uses raw git-relative path
      expect(useFileStore.getState().activeFilePath).toBe("src/App.tsx");
    });
  });
});
