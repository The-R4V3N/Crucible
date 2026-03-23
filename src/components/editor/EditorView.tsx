import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useFileStore } from "@/stores/fileStore";
import { fileRead, fileWrite } from "@/lib/ipc";
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
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load file content when active file changes
  useEffect(() => {
    if (!activeFilePath) {
      setContent("");
      return;
    }

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
      <div className="flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-warp-text-dim">
            Loading...
          </div>
        ) : (
          <Editor
            value={content}
            language={language}
            theme="vs-dark"
            onChange={(value) => {
              if (value !== undefined) {
                setContent(value);
              }
            }}
            options={{
              fontFamily: '"Cascadia Code", Consolas, monospace',
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
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
