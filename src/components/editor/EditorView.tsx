import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useFileStore } from "@/stores/fileStore";
import { useEditorStore } from "@/stores/editorStore";
import { useEditorCursor } from "@/hooks/useEditorCursor";
import { fileRead } from "@/lib/ipc";
import EditorTabs from "./EditorTabs";

/** Detect language from file extension. */
function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    rs: "rust",
    json: "json",
    html: "html",
    css: "css",
    md: "markdown",
    toml: "toml",
    yaml: "yaml",
    yml: "yaml",
    py: "python",
    sh: "shell",
    bash: "shell",
  };
  return langMap[ext ?? ""] ?? "plaintext";
}

/** Monaco editor view with tabs and file content. */
function EditorView() {
  const activeFilePath = useFileStore((s) => s.activeFilePath);
  const openFiles = useFileStore((s) => s.openFiles);
  const markDirty = useFileStore((s) => s.markDirty);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editorInstance, setEditorInstance] =
    useState<Monaco.editor.IStandaloneCodeEditor | null>(null);
  // Ref to the editor container div — used by the ResizeObserver below.
  const editorContainerRef = useRef<HTMLDivElement>(null);
  // Ref tracks the live editor for synchronous disposal in useLayoutEffect.
  // State updates (setEditorInstance) are async; this ref is available immediately.
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  // Sync cursor position to editorStore via the hook
  useEditorCursor(editorInstance);

  // Synchronously dispose the Monaco editor when the active file changes or the
  // component unmounts. useLayoutEffect cleanup fires before React applies DOM
  // mutations, so Monaco's internal timers (cursor blink setInterval, rAF loops)
  // are cancelled BEFORE their container node is removed. This closes the crash
  // window for "Cannot read properties of undefined (reading '_isDisposed')".
  useLayoutEffect(() => {
    return () => {
      const ed = editorRef.current;
      if (ed) {
        editorRef.current = null;
        ed.dispose();
      }
    };
  }, [activeFilePath]);


  // Manual layout management via ResizeObserver.
  // We use automaticLayout: false on the Editor (below) so Monaco does NOT create
  // its own ResizeObserver. Monaco's internal observer fires asynchronously after
  // the editor's DOM element is removed, accessing already-torn-down internals and
  // crashing with "Cannot read properties of undefined (reading '_isDisposed')".
  // By controlling the observer ourselves we can disconnect it in the effect cleanup
  // before the editor is disposed or the component unmounts.
  useEffect(() => {
    if (!editorInstance || !editorContainerRef.current) return;
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      editorInstance.layout();
    });
    observer.observe(editorContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [editorInstance]);

  // Load file content and sync language when active file changes
  useEffect(() => {
    if (!activeFilePath) {
      setEditorInstance(null);
      setContent("");
      return;
    }

    // Clear stale editor ref before loading so useEditorCursor doesn't hold
    // a reference to a disposed Monaco instance during the loading phase.
    setEditorInstance(null);
    useEditorStore.getState().setLanguage(detectLanguage(activeFilePath));

    setLoading(true);
    fileRead(activeFilePath)
      .then((text) => {
        setContent(text);
      })
      .catch(() => {
        setContent("// Failed to read file");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeFilePath]);

  if (openFiles.length === 0 || !activeFilePath) {
    return (
      <div
        data-testid="editor-placeholder"
        className="flex h-full items-center justify-center text-warp-text-dim"
      >
        <span>Open a file from the explorer</span>
      </div>
    );
  }

  const language = detectLanguage(activeFilePath);

  return (
    <div className="flex h-full flex-col" data-testid="editor-view">
      <EditorTabs />
      <div ref={editorContainerRef} className="flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-warp-text-dim">
            Loading...
          </div>
        ) : (
          <Editor
            value={content}
            language={language}
            theme="vs-dark"
            onMount={(editor) => {
              // Monaco's dispose() is NOT idempotent — calling it a second time
              // crashes with "_isDisposed" on already-torn-down internals.
              // Our useLayoutEffect disposes synchronously (first call), but
              // @monaco-editor/react and our useEffect safety-net also call
              // dispose() in their passive-effect cleanups (second/third calls).
              // Wrap dispose so only the first invocation runs the real teardown.
              const realDispose = editor.dispose.bind(editor);
              let disposed = false;
              editor.dispose = () => {
                if (disposed) return;
                disposed = true;
                realDispose();
              };
              editorRef.current = editor;
              setEditorInstance(editor);
            }}
            onChange={(value) => {
              if (value !== undefined) {
                setContent(value);
                if (activeFilePath) markDirty(activeFilePath);
              }
            }}
            options={{
              fontFamily: '"Cascadia Code", Consolas, monospace',
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: false,
              lineNumbers: "on",
              renderWhitespace: "selection",
              tabSize: 2,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default EditorView;
