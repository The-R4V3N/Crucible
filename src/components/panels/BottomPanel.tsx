import { useUiStore } from "@/stores/uiStore";
import { useProblemsStore } from "@/stores/problemsStore";
import ProblemsPanel from "./ProblemsPanel";

interface BottomPanelProps {
  /** List of changed file paths. */
  changedFiles: string[];
  /** Callback when a file is clicked. */
  onFileClick: (filePath: string) => void;
}

/** Collapsible bottom panel with Changes and Problems tabs. */
function BottomPanel({ changedFiles, onFileClick }: BottomPanelProps) {
  const bottomPanelVisible = useUiStore((s) => s.bottomPanelVisible);
  const activeBottomTab = useProblemsStore((s) => s.activeBottomTab);
  const setActiveBottomTab = useProblemsStore((s) => s.setActiveBottomTab);

  if (!bottomPanelVisible) return null;

  return (
    <div
      data-testid="bottom-panel"
      className="border-t border-crucible-border bg-crucible-sidebar"
      style={{ height: "200px" }}
    >
      {/* Tab bar */}
      <div className="flex items-center border-b border-crucible-border">
        <button
          data-testid="tab-changes"
          onClick={() => setActiveBottomTab("changes")}
          className={`px-4 py-1.5 text-xs transition-colors ${
            activeBottomTab === "changes"
              ? "border-b-2 border-crucible-accent text-crucible-text"
              : "text-crucible-text-dim hover:text-crucible-text"
          }`}
        >
          Changed Files
          {changedFiles.length > 0 && (
            <span className="ml-1.5 text-crucible-text-dim">{changedFiles.length}</span>
          )}
        </button>
        <button
          data-testid="tab-problems"
          onClick={() => setActiveBottomTab("problems")}
          className={`px-4 py-1.5 text-xs transition-colors ${
            activeBottomTab === "problems"
              ? "border-b-2 border-crucible-accent text-crucible-text"
              : "text-crucible-text-dim hover:text-crucible-text"
          }`}
        >
          Problems
        </button>
      </div>

      {/* Tab content */}
      <div className="overflow-y-auto" style={{ maxHeight: "160px" }}>
        {activeBottomTab === "changes" ? (
          <>
            {changedFiles.length === 0 ? (
              <div className="px-4 py-2 text-xs text-crucible-text-dim">No changed files</div>
            ) : (
              changedFiles.map((filePath) => (
                <button
                  key={filePath}
                  onClick={() => onFileClick(filePath)}
                  className="flex w-full items-center gap-2 rounded px-4 py-1 text-left text-xs text-crucible-text-dim hover:bg-crucible-bg/50 hover:text-crucible-text"
                >
                  <span className="truncate">{filePath}</span>
                </button>
              ))
            )}
          </>
        ) : (
          <ProblemsPanel />
        )}
      </div>
    </div>
  );
}

export default BottomPanel;
