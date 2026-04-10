import { useEditorStore } from "@/stores/editorStore";
import { useUiStore } from "@/stores/uiStore";
import { useProblemsStore } from "@/stores/problemsStore";
import type { GitStatusInfo } from "@/lib/ipc";

interface StatusBarProps {
  gitStatus?: GitStatusInfo | null;
}

/** VS Code-style status bar showing git branch, language, cursor position, and problem count. */
function StatusBar({ gitStatus }: StatusBarProps) {
  const cursorLine = useEditorStore((s) => s.cursorLine);
  const cursorCol = useEditorStore((s) => s.cursorCol);
  const language = useEditorStore((s) => s.language);
  const activeView = useUiStore((s) => s.activeView);
  const isEditorActive = activeView === "editor";
  const errorCount = useProblemsStore((s) => s.errorCount());
  const warningCount = useProblemsStore((s) => s.warningCount());
  const hasProblems = errorCount > 0 || warningCount > 0;

  return (
    <div
      data-testid="status-bar"
      className="flex h-6 items-center justify-between bg-crucible-accent px-3 text-xs text-crucible-bg font-mono select-none"
    >
      {/* Left: git branch */}
      <div className="flex items-center gap-2">
        {gitStatus && (
          <span data-testid="git-branch" className="flex items-center gap-1">
            <span>⎇</span>
            <span>{gitStatus.branch}</span>
            {gitStatus.dirty && <span data-testid="git-dirty">•</span>}
          </span>
        )}
      </div>

      {/* Right: problem count + language + cursor position (editor only) */}
      <div className="flex items-center gap-4">
        {hasProblems && (
          <span className="flex items-center gap-1.5">
            {errorCount > 0 && (
              <span data-testid="problem-count" className="flex items-center gap-0.5">
                <span>✕</span>
                {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span data-testid="warning-count" className="flex items-center gap-0.5">
                <span>⚠</span>
                {warningCount}
              </span>
            )}
          </span>
        )}
        {isEditorActive && (
          <>
            <span data-testid="language-mode">{language}</span>
            <span data-testid="cursor-position">
              Ln {cursorLine}, Col {cursorCol}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default StatusBar;
