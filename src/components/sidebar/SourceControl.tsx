import { useState } from "react";
import type { GitStatusInfo } from "@/lib/ipc";
import { useFileStore } from "@/stores/fileStore";
import { useUiStore } from "@/stores/uiStore";

interface SourceControlProps {
  /** Git status for the active project. */
  gitStatus: GitStatusInfo | null;
  /** Called when a file name is clicked (opens in editor). */
  onFileClick?: (filePath: string) => void;
  /** Project root path, prepended to git-relative file paths. */
  projectPath?: string;
  /** Stage a single file. */
  onStage?: (filePath: string) => void;
  /** Unstage a single file. */
  onUnstage?: (filePath: string) => void;
  /** Discard working-tree changes to a file. */
  onDiscard?: (filePath: string) => void;
  /** Commit all staged changes with the given message. */
  onCommit?: (message: string) => void;
  /** Stage all unstaged + untracked files. */
  onStageAll?: () => void;
  /** Unstage all staged files. */
  onUnstageAll?: () => void;
}

/** Source control panel with VS Code-style staged/unstaged/untracked sections. */
function SourceControl({
  gitStatus,
  onFileClick,
  projectPath,
  onStage,
  onUnstage,
  onDiscard,
  onCommit,
  onStageAll,
  onUnstageAll,
}: SourceControlProps) {
  const openFile = useFileStore((s) => s.openFile);
  const setActiveView = useUiStore((s) => s.setActiveView);

  const [stagedOpen, setStagedOpen] = useState(true);
  const [unstagedOpen, setUnstagedOpen] = useState(true);
  const [untrackedOpen, setUntrackedOpen] = useState(true);
  const [commitMsg, setCommitMsg] = useState("");

  if (!gitStatus) return null;

  const staged_files = gitStatus.staged_files ?? [];
  const unstaged_files = gitStatus.unstaged_files ?? [];
  const untracked_files = gitStatus.untracked_files ?? [];
  const hasStaged = staged_files.length > 0;
  const hasUnstaged = unstaged_files.length > 0;
  const hasUntracked = untracked_files.length > 0;
  const hasAnythingToStage = hasUnstaged || hasUntracked;

  const handleFileClick = (filePath: string) => {
    if (onFileClick) {
      onFileClick(filePath);
      return;
    }
    let fullPath = filePath;
    if (projectPath) {
      const base = projectPath.endsWith("/") ? projectPath.slice(0, -1) : projectPath;
      fullPath = `${base}/${filePath}`;
    }
    const name = filePath.split("/").pop() ?? filePath;
    openFile(fullPath, name);
    if (useUiStore.getState().splitMode) {
      useUiStore.getState().closeSplit();
    }
    setActiveView("editor");
  };

  const handleCommit = () => {
    if (!commitMsg.trim()) return;
    onCommit?.(commitMsg);
    setCommitMsg("");
  };

  return (
    <div
      data-testid="source-control"
      className="border-t border-crucible-border px-3 py-3 flex flex-col gap-2"
    >
      {/* Header */}
      <div className="text-xs uppercase tracking-wider text-crucible-text-dim">Source Control</div>

      {/* Branch */}
      <div className="flex items-center gap-1.5 text-sm text-crucible-text">
        <span className="text-crucible-accent">⎇</span>
        <span data-testid="git-branch">{gitStatus.branch}</span>
        {gitStatus.dirty && (
          <span className="text-crucible-warning" data-testid="git-dirty">
            •
          </span>
        )}
      </div>

      {/* Staged Changes */}
      {hasStaged && (
        <div data-testid="staged-section" className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <button
              data-testid="staged-section-header"
              onClick={() => setStagedOpen((o) => !o)}
              className="flex items-center gap-1 text-xs font-medium text-crucible-text-dim uppercase tracking-wide hover:text-crucible-text"
            >
              <span>{stagedOpen ? "▾" : "▸"}</span>
              <span>Staged Changes ({staged_files.length})</span>
            </button>
            {hasStaged && (
              <button
                data-testid="unstage-all-btn"
                onClick={onUnstageAll}
                title="Unstage All"
                className="text-xs text-crucible-text-dim hover:text-crucible-text px-1"
              >
                −
              </button>
            )}
          </div>

          {stagedOpen &&
            staged_files.map((filePath) => (
              <div key={filePath} className="flex items-center gap-1 pl-3 group">
                <button
                  data-testid={`staged-file-${filePath}`}
                  onClick={() => handleFileClick(filePath)}
                  title={filePath}
                  className="flex-1 truncate text-xs text-left text-crucible-text-dim hover:text-crucible-text"
                >
                  {filePath.split("/").pop()}
                </button>
                <button
                  data-testid={`unstage-btn-${filePath}`}
                  onClick={() => onUnstage?.(filePath)}
                  title={`Unstage ${filePath}`}
                  className="hidden group-hover:flex text-xs text-crucible-text-dim hover:text-crucible-accent px-0.5"
                >
                  −
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Unstaged Changes */}
      {hasUnstaged && (
        <div data-testid="unstaged-section" className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <button
              data-testid="unstaged-section-header"
              onClick={() => setUnstagedOpen((o) => !o)}
              className="flex items-center gap-1 text-xs font-medium text-crucible-text-dim uppercase tracking-wide hover:text-crucible-text"
            >
              <span>{unstagedOpen ? "▾" : "▸"}</span>
              <span>Unstaged Changes ({unstaged_files.length})</span>
            </button>
            {hasAnythingToStage && (
              <button
                data-testid="stage-all-btn"
                onClick={onStageAll}
                title="Stage All"
                className="text-xs text-crucible-text-dim hover:text-crucible-text px-1"
              >
                +
              </button>
            )}
          </div>

          {unstagedOpen &&
            unstaged_files.map((filePath) => (
              <div key={filePath} className="flex items-center gap-1 pl-3 group">
                <button
                  data-testid={`unstaged-file-${filePath}`}
                  onClick={() => handleFileClick(filePath)}
                  title={filePath}
                  className="flex-1 truncate text-xs text-left text-crucible-text-dim hover:text-crucible-text"
                >
                  {filePath.split("/").pop()}
                </button>
                <button
                  data-testid={`stage-btn-${filePath}`}
                  onClick={() => onStage?.(filePath)}
                  title={`Stage ${filePath}`}
                  className="hidden group-hover:flex text-xs text-crucible-text-dim hover:text-crucible-accent px-0.5"
                >
                  +
                </button>
                <button
                  data-testid={`discard-btn-${filePath}`}
                  onClick={() => onDiscard?.(filePath)}
                  title={`Discard changes to ${filePath}`}
                  className="hidden group-hover:flex text-xs text-crucible-text-dim hover:text-red-400 px-0.5"
                >
                  ↺
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Untracked Files */}
      {hasUntracked && (
        <div data-testid="untracked-section" className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <button
              data-testid="untracked-section-header"
              onClick={() => setUntrackedOpen((o) => !o)}
              className="flex items-center gap-1 text-xs font-medium text-crucible-text-dim uppercase tracking-wide hover:text-crucible-text"
            >
              <span>{untrackedOpen ? "▾" : "▸"}</span>
              <span>Untracked Files ({untracked_files.length})</span>
            </button>
            {!hasUnstaged && hasUntracked && (
              <button
                data-testid="stage-all-btn"
                onClick={onStageAll}
                title="Stage All"
                className="text-xs text-crucible-text-dim hover:text-crucible-text px-1"
              >
                +
              </button>
            )}
          </div>

          {untrackedOpen &&
            untracked_files.map((filePath) => (
              <div key={filePath} className="flex items-center gap-1 pl-3 group">
                <button
                  data-testid={`untracked-file-${filePath}`}
                  onClick={() => handleFileClick(filePath)}
                  title={filePath}
                  className="flex-1 truncate text-xs text-left text-crucible-text-dim hover:text-crucible-text"
                >
                  {filePath.split("/").pop()}
                </button>
                <button
                  data-testid={`stage-btn-${filePath}`}
                  onClick={() => onStage?.(filePath)}
                  title={`Stage ${filePath}`}
                  className="hidden group-hover:flex text-xs text-crucible-text-dim hover:text-crucible-accent px-0.5"
                >
                  +
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Commit */}
      <div className="flex flex-col gap-1.5 pt-1">
        <textarea
          data-testid="commit-message"
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder="Commit message"
          rows={2}
          className="w-full resize-none rounded border border-crucible-border bg-crucible-bg px-2 py-1 text-xs text-crucible-text placeholder-crucible-text-dim focus:outline-none focus:border-crucible-accent"
        />
        <button
          data-testid="commit-btn"
          onClick={handleCommit}
          disabled={!commitMsg.trim()}
          className="w-full rounded bg-crucible-accent px-2 py-1 text-xs font-medium text-black disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        >
          Commit
        </button>
      </div>
    </div>
  );
}

export default SourceControl;
