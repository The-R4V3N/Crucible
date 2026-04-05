import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SourceControl from "@/components/sidebar/SourceControl";
import { useUiStore } from "@/stores/uiStore";
import { useFileStore } from "@/stores/fileStore";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Minimal clean status with the full new shape. */
const clean = () => ({
  branch: "main",
  dirty: false,
  changed_files: 0,
  changed_file_paths: [],
  staged_files: [],
  unstaged_files: [],
  untracked_files: [],
});

/** Status with staged + unstaged + untracked files. */
const mixed = () => ({
  branch: "feature/foo",
  dirty: true,
  changed_files: 4,
  changed_file_paths: ["src/App.tsx", "src/lib/ipc.ts", "src/new.ts", "src/extra.ts"],
  staged_files: ["src/App.tsx"],
  unstaged_files: ["src/lib/ipc.ts"],
  untracked_files: ["src/new.ts", "src/extra.ts"],
});

// ── branch / dirty indicator ──────────────────────────────────────────────────

describe("SourceControl — branch and dirty indicator", () => {
  it("renders nothing when gitStatus is null", () => {
    const { container } = render(<SourceControl gitStatus={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows branch name", () => {
    render(<SourceControl gitStatus={clean()} />);
    expect(screen.getByTestId("git-branch")).toHaveTextContent("main");
  });

  it("shows dirty indicator when dirty", () => {
    render(<SourceControl gitStatus={{ ...clean(), dirty: true, changed_files: 1,
      changed_file_paths: ["a.ts"], unstaged_files: ["a.ts"] }} />);
    expect(screen.getByTestId("git-dirty")).toBeInTheDocument();
  });

  it("does not show dirty indicator when clean", () => {
    render(<SourceControl gitStatus={clean()} />);
    expect(screen.queryByTestId("git-dirty")).not.toBeInTheDocument();
  });
});

// ── sections visibility ───────────────────────────────────────────────────────

describe("SourceControl — sections", () => {
  it("shows staged section when there are staged files", () => {
    render(<SourceControl gitStatus={mixed()} />);
    expect(screen.getByTestId("staged-section")).toBeInTheDocument();
  });

  it("shows unstaged section when there are unstaged files", () => {
    render(<SourceControl gitStatus={mixed()} />);
    expect(screen.getByTestId("unstaged-section")).toBeInTheDocument();
  });

  it("shows untracked section when there are untracked files", () => {
    render(<SourceControl gitStatus={mixed()} />);
    expect(screen.getByTestId("untracked-section")).toBeInTheDocument();
  });

  it("hides staged section when no staged files", () => {
    render(<SourceControl gitStatus={{ ...clean(), dirty: true, changed_files: 1,
      changed_file_paths: ["a.ts"], unstaged_files: ["a.ts"] }} />);
    expect(screen.queryByTestId("staged-section")).not.toBeInTheDocument();
  });

  it("hides unstaged section when no unstaged files", () => {
    render(<SourceControl gitStatus={{ ...clean(), dirty: true, changed_files: 1,
      changed_file_paths: ["a.ts"], staged_files: ["a.ts"] }} />);
    expect(screen.queryByTestId("unstaged-section")).not.toBeInTheDocument();
  });

  it("hides untracked section when no untracked files", () => {
    render(<SourceControl gitStatus={{ ...clean(), dirty: true, changed_files: 1,
      changed_file_paths: ["a.ts"], unstaged_files: ["a.ts"] }} />);
    expect(screen.queryByTestId("untracked-section")).not.toBeInTheDocument();
  });

  it("shows staged file name in staged section", () => {
    render(<SourceControl gitStatus={mixed()} />);
    expect(screen.getByTestId("staged-file-src/App.tsx")).toBeInTheDocument();
  });

  it("shows unstaged file name in unstaged section", () => {
    render(<SourceControl gitStatus={mixed()} />);
    expect(screen.getByTestId("unstaged-file-src/lib/ipc.ts")).toBeInTheDocument();
  });

  it("shows untracked file name in untracked section", () => {
    render(<SourceControl gitStatus={mixed()} />);
    expect(screen.getByTestId("untracked-file-src/new.ts")).toBeInTheDocument();
  });
});

// ── section collapse / expand ─────────────────────────────────────────────────

describe("SourceControl — collapse/expand", () => {
  it("collapses staged section on header click", () => {
    render(<SourceControl gitStatus={mixed()} />);
    const header = screen.getByTestId("staged-section-header");
    fireEvent.click(header);
    expect(screen.queryByTestId("staged-file-src/App.tsx")).not.toBeInTheDocument();
  });

  it("re-expands staged section on second header click", () => {
    render(<SourceControl gitStatus={mixed()} />);
    const header = screen.getByTestId("staged-section-header");
    fireEvent.click(header);
    fireEvent.click(header);
    expect(screen.getByTestId("staged-file-src/App.tsx")).toBeInTheDocument();
  });

  it("collapses unstaged section independently", () => {
    render(<SourceControl gitStatus={mixed()} />);
    fireEvent.click(screen.getByTestId("unstaged-section-header"));
    expect(screen.queryByTestId("unstaged-file-src/lib/ipc.ts")).not.toBeInTheDocument();
    // staged section should still be visible
    expect(screen.getByTestId("staged-file-src/App.tsx")).toBeInTheDocument();
  });
});

// ── per-file action buttons ──────────────────────────────────────────────────

describe("SourceControl — per-file actions", () => {
  it("unstage button in staged section calls onUnstage with file path", () => {
    const onUnstage = vi.fn();
    render(<SourceControl gitStatus={mixed()} onUnstage={onUnstage} />);
    fireEvent.click(screen.getByTestId("unstage-btn-src/App.tsx"));
    expect(onUnstage).toHaveBeenCalledWith("src/App.tsx");
  });

  it("stage button in unstaged section calls onStage with file path", () => {
    const onStage = vi.fn();
    render(<SourceControl gitStatus={mixed()} onStage={onStage} />);
    fireEvent.click(screen.getByTestId("stage-btn-src/lib/ipc.ts"));
    expect(onStage).toHaveBeenCalledWith("src/lib/ipc.ts");
  });

  it("discard button in unstaged section calls onDiscard with file path", () => {
    const onDiscard = vi.fn();
    render(<SourceControl gitStatus={mixed()} onDiscard={onDiscard} />);
    fireEvent.click(screen.getByTestId("discard-btn-src/lib/ipc.ts"));
    expect(onDiscard).toHaveBeenCalledWith("src/lib/ipc.ts");
  });

  it("stage button in untracked section calls onStage with file path", () => {
    const onStage = vi.fn();
    render(<SourceControl gitStatus={mixed()} onStage={onStage} />);
    fireEvent.click(screen.getByTestId("stage-btn-src/new.ts"));
    expect(onStage).toHaveBeenCalledWith("src/new.ts");
  });

  it("untracked files have no discard button", () => {
    render(<SourceControl gitStatus={mixed()} />);
    expect(screen.queryByTestId("discard-btn-src/new.ts")).not.toBeInTheDocument();
  });

  it("staged files have no stage button", () => {
    render(<SourceControl gitStatus={mixed()} />);
    expect(screen.queryByTestId("stage-btn-src/App.tsx")).not.toBeInTheDocument();
  });
});

// ── stage all / unstage all ──────────────────────────────────────────────────

describe("SourceControl — stage all / unstage all", () => {
  it("stage-all button calls onStageAll", () => {
    const onStageAll = vi.fn();
    render(<SourceControl gitStatus={mixed()} onStageAll={onStageAll} />);
    fireEvent.click(screen.getByTestId("stage-all-btn"));
    expect(onStageAll).toHaveBeenCalledTimes(1);
  });

  it("unstage-all button calls onUnstageAll", () => {
    const onUnstageAll = vi.fn();
    render(<SourceControl gitStatus={mixed()} onUnstageAll={onUnstageAll} />);
    fireEvent.click(screen.getByTestId("unstage-all-btn"));
    expect(onUnstageAll).toHaveBeenCalledTimes(1);
  });

  it("hides stage-all button when nothing to stage", () => {
    render(<SourceControl gitStatus={{ ...clean(), dirty: true, changed_files: 1,
      changed_file_paths: ["a.ts"], staged_files: ["a.ts"] }} />);
    expect(screen.queryByTestId("stage-all-btn")).not.toBeInTheDocument();
  });

  it("hides unstage-all button when nothing staged", () => {
    render(<SourceControl gitStatus={{ ...clean(), dirty: true, changed_files: 1,
      changed_file_paths: ["a.ts"], unstaged_files: ["a.ts"] }} />);
    expect(screen.queryByTestId("unstage-all-btn")).not.toBeInTheDocument();
  });
});

// ── commit UI ────────────────────────────────────────────────────────────────

describe("SourceControl — commit", () => {
  it("renders commit message input", () => {
    render(<SourceControl gitStatus={mixed()} />);
    expect(screen.getByTestId("commit-message")).toBeInTheDocument();
  });

  it("commit button is disabled when message is empty", () => {
    render(<SourceControl gitStatus={mixed()} />);
    expect(screen.getByTestId("commit-btn")).toBeDisabled();
  });

  it("commit button is enabled when message is not empty", () => {
    render(<SourceControl gitStatus={mixed()} />);
    const input = screen.getByTestId("commit-message");
    fireEvent.change(input, { target: { value: "add feature" } });
    expect(screen.getByTestId("commit-btn")).not.toBeDisabled();
  });

  it("commit button is disabled when only staged files exist but message is empty", () => {
    render(<SourceControl gitStatus={{ ...clean(), dirty: true, changed_files: 1,
      changed_file_paths: ["a.ts"], staged_files: ["a.ts"] }} />);
    expect(screen.getByTestId("commit-btn")).toBeDisabled();
  });

  it("calls onCommit with the message when commit button is clicked", () => {
    const onCommit = vi.fn();
    render(<SourceControl gitStatus={mixed()} onCommit={onCommit} />);
    const input = screen.getByTestId("commit-message");
    fireEvent.change(input, { target: { value: "add feature" } });
    fireEvent.click(screen.getByTestId("commit-btn"));
    expect(onCommit).toHaveBeenCalledWith("add feature");
  });

  it("clears commit message after successful commit", () => {
    render(<SourceControl gitStatus={mixed()} onCommit={vi.fn()} />);
    const input = screen.getByTestId("commit-message");
    fireEvent.change(input, { target: { value: "add feature" } });
    fireEvent.click(screen.getByTestId("commit-btn"));
    expect(input).toHaveValue("");
  });

  it("does not call onCommit when message is whitespace only", () => {
    const onCommit = vi.fn();
    render(<SourceControl gitStatus={mixed()} onCommit={onCommit} />);
    const input = screen.getByTestId("commit-message");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByTestId("commit-btn"));
    expect(onCommit).not.toHaveBeenCalled();
  });
});

// ── file click (open in editor) ──────────────────────────────────────────────

describe("SourceControl — file click opens editor", () => {
  it("calls onFileClick when a staged file name is clicked", () => {
    const onFileClick = vi.fn();
    render(<SourceControl gitStatus={mixed()} onFileClick={onFileClick} />);
    fireEvent.click(screen.getByTestId("staged-file-src/App.tsx"));
    expect(onFileClick).toHaveBeenCalledWith("src/App.tsx");
  });

  it("calls onFileClick when an unstaged file name is clicked", () => {
    const onFileClick = vi.fn();
    render(<SourceControl gitStatus={mixed()} onFileClick={onFileClick} />);
    fireEvent.click(screen.getByTestId("unstaged-file-src/lib/ipc.ts"));
    expect(onFileClick).toHaveBeenCalledWith("src/lib/ipc.ts");
  });

  it("calls onFileClick when an untracked file name is clicked", () => {
    const onFileClick = vi.fn();
    render(<SourceControl gitStatus={mixed()} onFileClick={onFileClick} />);
    fireEvent.click(screen.getByTestId("untracked-file-src/new.ts"));
    expect(onFileClick).toHaveBeenCalledWith("src/new.ts");
  });

  describe("default file click (no onFileClick prop)", () => {
    beforeEach(() => {
      useUiStore.setState({
        activeView: "terminal",
        splitMode: null,
        splitViews: ["terminal", "terminal"] as [
          "terminal" | "editor" | "diff",
          "terminal" | "editor" | "diff",
        ],
      });
      useFileStore.setState({ openFiles: [], activeFilePath: null });
    });

    it("opens file in fileStore and switches to editor when staged file clicked", () => {
      render(<SourceControl gitStatus={mixed()} />);
      fireEvent.click(screen.getByTestId("staged-file-src/App.tsx"));
      expect(useFileStore.getState().activeFilePath).toBe("src/App.tsx");
      expect(useUiStore.getState().activeView).toBe("editor");
    });

    it("closes split mode when clicking a file while split is active", () => {
      useUiStore.getState().splitVertical();
      expect(useUiStore.getState().splitMode).toBe("vertical");
      render(<SourceControl gitStatus={mixed()} />);
      fireEvent.click(screen.getByTestId("unstaged-file-src/lib/ipc.ts"));
      expect(useUiStore.getState().splitMode).toBeNull();
      expect(useUiStore.getState().activeView).toBe("editor");
    });

    it("prepends projectPath to git-relative path on click", () => {
      render(<SourceControl gitStatus={mixed()} projectPath="D:/Development/Crucible" />);
      fireEvent.click(screen.getByTestId("untracked-file-src/new.ts"));
      expect(useFileStore.getState().activeFilePath).toBe("D:/Development/Crucible/src/new.ts");
    });
  });
});
