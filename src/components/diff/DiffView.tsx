import { useState, useEffect } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { gitDiff } from "@/lib/ipc";

interface DiffViewProps {
  /** Path to the git repository. */
  repoPath: string;
  /** File path to show diff for, or null for placeholder. */
  filePath: string | null;
}

/** Side-by-side diff view using Monaco DiffEditor. */
function DiffView({ repoPath, filePath }: DiffViewProps) {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!filePath) {
      setOriginal("");
      setModified("");
      return;
    }

    setLoading(true);
    gitDiff(repoPath, filePath)
      .then((diff) => {
        setOriginal(diff.old_content);
        setModified(diff.new_content);
      })
      .catch(() => {
        setOriginal("");
        setModified("// Failed to load diff");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [repoPath, filePath]);

  if (!filePath) {
    return (
      <div
        data-testid="diff-placeholder"
        className="flex h-full items-center justify-center text-crucible-text-dim"
      >
        <span>Select a file to view diff</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-crucible-text-dim">
        Loading diff...
      </div>
    );
  }

  return (
    <div className="h-full" data-testid="diff-view">
      <DiffEditor
        original={original}
        modified={modified}
        theme="vs-dark"
        options={{
          fontFamily: '"Cascadia Code", Consolas, monospace',
          fontSize: 14,
          readOnly: true,
          renderSideBySide: true,
          automaticLayout: true,
          minimap: { enabled: false },
        }}
      />
    </div>
  );
}

export default DiffView;
