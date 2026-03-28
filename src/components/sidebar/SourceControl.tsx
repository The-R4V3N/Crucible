import type { GitStatusInfo } from "@/lib/ipc";
import { useFileStore } from "@/stores/fileStore";
import { useUiStore } from "@/stores/uiStore";

interface SourceControlProps {
  /** Git status for the active project. */
  gitStatus: GitStatusInfo | null;
  /** Callback when a changed file is clicked. Defaults to opening in editor. */
  onFileClick?: (filePath: string) => void;
  /** Project root path, prepended to git-relative file paths. */
  projectPath?: string;
}

/** Source control panel showing git branch and changed files. */
function SourceControl({ gitStatus, onFileClick, projectPath }: SourceControlProps) {
  const openFile = useFileStore((s) => s.openFile);
  const setActiveView = useUiStore((s) => s.setActiveView);

  const handleFileClick = (filePath: string) => {
    if (onFileClick) {
      onFileClick(filePath);
    } else {
      // Build absolute path from project root + git-relative path
      let fullPath = filePath;
      if (projectPath) {
        const base = projectPath.endsWith("/") ? projectPath.slice(0, -1) : projectPath;
        fullPath = `${base}/${filePath}`;
      }
      const name = filePath.split("/").pop() ?? filePath;
      openFile(fullPath, name);
      // Close split mode so the editor shows as a single view
      if (useUiStore.getState().splitMode) {
        useUiStore.getState().closeSplit();
      }
      setActiveView("editor");
    }
  };
  if (!gitStatus) return null;

  return (
    <div data-testid="source-control" className="border-t border-warp-border px-4 py-3">
      <div className="mb-1 text-xs uppercase tracking-wider text-warp-text-dim">Source Control</div>

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
        <div className="mt-1 text-xs text-warp-text-dim" data-testid="git-changed-count">
          {gitStatus.changed_files} file{gitStatus.changed_files !== 1 ? "s" : ""} changed
        </div>
      )}

      {/* Changed files list */}
      {gitStatus.changed_file_paths.length > 0 && (
        <div className="mt-2 flex flex-col gap-0.5" data-testid="changed-files-list">
          {gitStatus.changed_file_paths.map((filePath) => (
            <button
              key={filePath}
              onClick={() => handleFileClick(filePath)}
              className="truncate text-xs text-warp-text-dim hover:text-warp-text cursor-pointer text-left w-full"
              title={filePath}
            >
              {filePath}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SourceControl;
