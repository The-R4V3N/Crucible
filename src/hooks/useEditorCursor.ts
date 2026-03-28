import { useEffect } from "react";
import type * as Monaco from "monaco-editor";
import { useEditorStore } from "@/stores/editorStore";

type MonacoEditor = Monaco.editor.IStandaloneCodeEditor;

/**
 * Wires a Monaco editor instance to the editorStore cursor position.
 * Attaches onDidChangeCursorPosition and syncs line/col on every change.
 * Cleans up the listener on unmount or when the editor changes.
 */
export function useEditorCursor(editor: MonacoEditor | null) {
  useEffect(() => {
    if (!editor) return;

    const { dispose } = editor.onDidChangeCursorPosition((e) => {
      if (!e.position) return;
      useEditorStore.getState().setCursor(e.position.lineNumber, e.position.column);
    });

    return () => {
      try {
        dispose();
      } catch {
        // Monaco's IDisposable accesses internals that are already torn down
        // when editor.dispose() ran before this passive-effect cleanup fires.
        // The listener is already gone — safe to ignore.
      }
    };
  }, [editor]);
}
