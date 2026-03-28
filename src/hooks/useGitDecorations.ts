import { useEffect, useRef } from "react";
import type * as Monaco from "monaco-editor";
import { gitDiff } from "@/lib/ipc";
import { computeLineDiff } from "@/lib/lineDiff";

type Editor = Monaco.editor.IStandaloneCodeEditor;
type DecorationsCollection = Monaco.editor.IEditorDecorationsCollection;

interface UseGitDecorationsOptions {
  editor: Editor | null;
  filePath: string | null;
  repoPath: string | null;
}

const CLASS_ADDED = "gutter-added";
const CLASS_MODIFIED = "gutter-modified";
const CLASS_DELETED = "gutter-deleted";

export function useGitDecorations({ editor, filePath, repoPath }: UseGitDecorationsOptions): void {
  const collectionRef = useRef<DecorationsCollection | null>(null);

  useEffect(() => {
    if (!editor || !filePath || !repoPath) {
      collectionRef.current?.clear();
      return;
    }

    let cancelled = false;

    gitDiff(repoPath, filePath)
      .then((diff) => {
        if (cancelled) return;

        const changes = computeLineDiff(diff.old_content, diff.new_content);

        const decorations: Monaco.editor.IModelDeltaDecoration[] = changes.map((change) => ({
          range: {
            startLineNumber: change.line,
            startColumn: 1,
            endLineNumber: change.line,
            endColumn: 1,
          },
          options: {
            linesDecorationsClassName:
              change.type === "added"
                ? CLASS_ADDED
                : change.type === "modified"
                  ? CLASS_MODIFIED
                  : CLASS_DELETED,
            isWholeLine: false,
          },
        }));

        if (!collectionRef.current) {
          collectionRef.current = editor.createDecorationsCollection([]);
        }
        collectionRef.current.set(decorations);
      })
      .catch(() => {
        // Silently clear decorations on error (e.g. file not tracked)
        collectionRef.current?.clear();
      });

    return () => {
      cancelled = true;
    };
  }, [editor, filePath, repoPath]);
}
