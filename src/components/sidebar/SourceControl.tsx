import type { GitStatusInfo } from "@/lib/ipc";

interface SourceControlProps {
  /** Git status for the active project. */
  gitStatus: GitStatusInfo | null;
}

/** Source control panel showing git branch and changed files. */
function SourceControl({ gitStatus }: SourceControlProps) {
  if (!gitStatus) return null;

  return (
    <div
      data-testid="source-control"
      className="border-t border-warp-border px-4 py-3"
    >
      <div className="mb-1 text-xs uppercase tracking-wider text-warp-text-dim">
        Source Control
      </div>

      {/* Branch */}
      <div className="flex items-center gap-1.5 text-sm text-warp-text">
        <span className="text-warp-accent">⎇</span>
        <span data-testid="git-branch">{gitStatus.branch}</span>
        {gitStatus.dirty && (
          <span className="text-warp-warning" data-testid="git-dirty">
            •
          </span>
        )}
      </div>

      {/* Changed files count */}
      {gitStatus.changed_files > 0 && (
        <div
          className="mt-1 text-xs text-warp-text-dim"
          data-testid="git-changed-count"
        >
          {gitStatus.changed_files} file{gitStatus.changed_files !== 1 ? "s" : ""} changed
        </div>
      )}

      {/* Changed files list */}
      {gitStatus.changed_file_paths.length > 0 && (
        <div
          className="mt-2 flex flex-col gap-0.5"
          data-testid="changed-files-list"
        >
          {gitStatus.changed_file_paths.map((filePath) => (
            <div
              key={filePath}
              className="truncate text-xs text-warp-text-dim hover:text-warp-text cursor-pointer"
              title={filePath}
            >
              {filePath}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SourceControl;
