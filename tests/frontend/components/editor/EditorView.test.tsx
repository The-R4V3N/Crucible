import { useEffect } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useFileStore } from "@/stores/fileStore";
import { useEditorStore } from "@/stores/editorStore";

/** Fake Monaco editor passed to onMount — supports cursor listener. */
function makeFakeEditor() {
  return {
    getPosition: () => ({ lineNumber: 1, column: 1 }),
    onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
  };
}

// Capture the last fake editor passed to onMount so tests can inspect it
let lastFakeEditor: ReturnType<typeof makeFakeEditor> | null = null;

// Mock Monaco editor — calls onMount after mount (mirrors real Monaco behaviour)
vi.mock("@monaco-editor/react", () => ({
  default: vi.fn(
    ({
      value,
      language,
      onMount,
    }: {
      value: string;
      language: string;
      onMount?: (editor: ReturnType<typeof makeFakeEditor>) => void;
    }) => {
      useEffect(() => {
        if (onMount) {
          const fakeEditor = makeFakeEditor();
          lastFakeEditor = fakeEditor;
          onMount(fakeEditor);
        }
      }, []);
      return (
        <div data-testid="monaco-editor" data-language={language}>
          {value}
        </div>
      );
    },
  ),
}));

// Mock file read IPC
vi.mock("@/lib/ipc", () => ({
  fileRead: vi.fn().mockResolvedValue("file content here"),
  fileWrite: vi.fn().mockResolvedValue(undefined),
}));

import EditorView from "@/components/editor/EditorView";

describe("EditorView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastFakeEditor = null;
    useFileStore.setState({
      tree: null,
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
    });
    useEditorStore.setState({ cursorLine: 1, cursorCol: 1, language: "plaintext" });
  });

  it("shows placeholder when no file is active", () => {
    render(<EditorView />);
    expect(screen.getByTestId("editor-placeholder")).toBeInTheDocument();
  });

  it("renders Monaco editor when a file is active", async () => {
    useFileStore.getState().openFile("/tmp/test.ts", "test.ts");
    render(<EditorView />);
    expect(await screen.findByTestId("monaco-editor")).toBeInTheDocument();
  });

  it("renders editor tabs", () => {
    useFileStore.getState().openFile("/tmp/test.ts", "test.ts");
    render(<EditorView />);
    expect(screen.getByTestId("editor-tabs")).toBeInTheDocument();
  });

  it("sets language in editorStore when a TypeScript file is opened", async () => {
    useFileStore.getState().openFile("/tmp/test.ts", "test.ts");
    render(<EditorView />);
    await screen.findByTestId("monaco-editor");
    expect(useEditorStore.getState().language).toBe("typescript");
  });

  it("sets language in editorStore when a Rust file is opened", async () => {
    useFileStore.getState().openFile("/tmp/main.rs", "main.rs");
    render(<EditorView />);
    await screen.findByTestId("monaco-editor");
    expect(useEditorStore.getState().language).toBe("rust");
  });

  it("sets language to plaintext for unknown extension", async () => {
    useFileStore.getState().openFile("/tmp/file.xyz", "file.xyz");
    render(<EditorView />);
    await screen.findByTestId("monaco-editor");
    expect(useEditorStore.getState().language).toBe("plaintext");
  });

  it("registers cursor listener via useEditorCursor on mount", async () => {
    useFileStore.getState().openFile("/tmp/test.ts", "test.ts");
    render(<EditorView />);
    await screen.findByTestId("monaco-editor");
    // Wait for onMount effect + useEditorCursor effect to both flush
    await waitFor(() => {
      expect(lastFakeEditor).not.toBeNull();
      expect(lastFakeEditor!.onDidChangeCursorPosition).toHaveBeenCalledOnce();
    });
  });
});
