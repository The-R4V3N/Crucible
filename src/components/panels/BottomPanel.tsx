import { useUiStore } from "@/stores/uiStore";

interface BottomPanelProps {
  /** List of changed file paths. */
  changedFiles: string[];
  /** Callback when a file is clicked. */
  onFileClick: (filePath: string) => void;
}

/** Collapsible bottom panel showing changed files. */
function BottomPanel({ changedFiles, onFileClick }: BottomPanelProps) {
  const bottomPanelVisible = useUiStore((s) => s.bottomPanelVisible);

  if (!bottomPanelVisible) return null;

  return (
    <div
      data-testid="bottom-panel"
      className="border-t border-warp-border bg-warp-sidebar"
      style={{ height: "200px" }}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs uppercase tracking-wider text-warp-text-dim">
          Changed Files
        </span>
        <span className="text-xs text-warp-text-dim">
          {changedFiles.length}
        </span>
      </div>
      <div className="overflow-y-auto px-2" style={{ maxHeight: "168px" }}>
        {changedFiles.length === 0 ? (
          <div className="px-2 py-1 text-xs text-warp-text-dim">
            No changed files
          </div>
        ) : (
          changedFiles.map((filePath) => (
            <button
              key={filePath}
              onClick={() => onFileClick(filePath)}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-warp-text-dim hover:bg-warp-bg/50 hover:text-warp-text"
            >
              <span className="truncate">{filePath}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default BottomPanel;
