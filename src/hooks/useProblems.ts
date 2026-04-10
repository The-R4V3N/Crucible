import { useEffect } from "react";
import type * as Monaco from "monaco-editor";
import { useProblemsStore } from "@/stores/problemsStore";
import type { Problem } from "@/stores/problemsStore";

/** Map Monaco MarkerSeverity to our Problem severity. */
function mapSeverity(
  severity: number,
  MarkerSeverity: typeof Monaco.MarkerSeverity,
): Problem["severity"] {
  if (severity === MarkerSeverity.Error) return "error";
  if (severity === MarkerSeverity.Warning) return "warning";
  return "info";
}

/**
 * Subscribes to Monaco's global marker change events and syncs them
 * into the problems store. Pass the monaco namespace from onMount.
 */
export function useProblems(monaco: typeof Monaco | null) {
  useEffect(() => {
    if (!monaco) return;

    const sync = () => {
      const markers = monaco.editor.getModelMarkers({});
      const problems: Problem[] = markers.map((m) => ({
        filePath: m.resource.path,
        line: m.startLineNumber,
        col: m.startColumn,
        message: m.message,
        severity: mapSeverity(m.severity, monaco.MarkerSeverity),
        source: m.source,
        code:
          m.code != null ? String(typeof m.code === "object" ? m.code.value : m.code) : undefined,
      }));
      useProblemsStore.getState().setProblems(problems);
    };

    const disposable = monaco.editor.onDidChangeMarkers(sync);
    return () => disposable.dispose();
  }, [monaco]);
}
