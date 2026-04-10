import { useProblemsStore } from "@/stores/problemsStore";
import { useFileStore } from "@/stores/fileStore";
import type { Problem } from "@/stores/problemsStore";

/** Groups problems by file path. */
function groupByFile(problems: Problem[]): Map<string, Problem[]> {
  const map = new Map<string, Problem[]>();
  for (const p of problems) {
    const group = map.get(p.filePath) ?? [];
    group.push(p);
    map.set(p.filePath, group);
  }
  return map;
}

/** Extract the filename from a path. */
function fileName(filePath: string): string {
  return filePath.replace(/\\/g, "/").split("/").pop() ?? filePath;
}

/** Icon for problem severity. */
function SeverityIcon({ severity }: { severity: Problem["severity"] }) {
  if (severity === "error") {
    return (
      <span data-testid="problem-icon-error" className="text-red-400 font-bold">
        ✕
      </span>
    );
  }
  if (severity === "warning") {
    return (
      <span data-testid="problem-icon-warning" className="text-yellow-400 font-bold">
        ⚠
      </span>
    );
  }
  return (
    <span data-testid="problem-icon-info" className="text-blue-400">
      ℹ
    </span>
  );
}

/** Problems panel — lists TypeScript/ESLint diagnostics grouped by file. */
function ProblemsPanel() {
  const problems = useProblemsStore((s) => s.problems);
  const openFile = useFileStore((s) => s.openFile);

  if (problems.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-crucible-text-dim">
        No problems detected
      </div>
    );
  }

  const groups = groupByFile(problems);

  return (
    <div className="overflow-y-auto" data-testid="problems-panel">
      {Array.from(groups.entries()).map(([filePath, fileProblems]) => (
        <div key={filePath} data-testid="problem-file-group">
          <div className="sticky top-0 flex items-center gap-2 bg-crucible-sidebar px-3 py-1 text-xs font-medium text-crucible-text">
            <span>{fileName(filePath)}</span>
            <span className="text-crucible-text-dim">{fileProblems.length}</span>
          </div>
          {fileProblems.map((problem, i) => (
            <button
              key={i}
              onClick={() => openFile(filePath, fileName(filePath))}
              className="flex w-full items-start gap-2 px-4 py-1 text-left text-xs hover:bg-crucible-bg/50"
            >
              <SeverityIcon severity={problem.severity} />
              <span className="flex-1 text-crucible-text">{problem.message}</span>
              <span className="shrink-0 text-crucible-text-dim">
                {problem.line}:{problem.col}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default ProblemsPanel;
