import { useEffect } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useFileStore } from "@/stores/fileStore";
import { useEditorStore } from "@/stores/editorStore";

/** Fake Monaco editor — implements real dispose semantics so cursor tests work. */
function makeFakeEditor() {
  const listeners: Array<
    (e: { position: { lineNumber: number; column: number } | null }) => void
  > = [];

  return {
    getPosition: () => ({ lineNumber: 1, column: 1 }),
    onDidChangeCursorPosition: vi.fn(
      (
        cb: (e: {
          position: { lineNumber: number; column: number } | null;
        }) => void,
      ) => {
        listeners.push(cb);
        return {
          dispose: vi.fn(() => {
            const idx = listeners.indexOf(cb);
            if (idx >= 0) listeners.splice(idx, 1);
          }),
        };
      },
    ),
    /** Simulates Monaco firing a cursor event — respects dispose. */
    _firePositionChange(lineNumber: number, column: number) {
      listeners.forEach((cb) => cb({ position: { lineNumber, column } }));
    },
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

import { fileRead } from "@/lib/ipc";
const mockFileRead = vi.mocked(fileRead);

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

  it("does not update cursor store when stale editor fires during file switch", async () => {
    // file2 never resolves — keeps editor in loading state after switch
    mockFileRead
      .mockResolvedValueOnce("content of file 1")
      .mockReturnValue(new Promise(() => {}));

    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    render(<EditorView />);

    // Wait for file1 editor to mount and cursor hook to be active
    await waitFor(() => {
      expect(lastFakeEditor).not.toBeNull();
      expect(lastFakeEditor!.onDidChangeCursorPosition).toHaveBeenCalledOnce();
    });

    const staleEditor = lastFakeEditor!;

    // Switch to file2 — starts loading, Monaco unmounts
    await act(async () => {
      useFileStore.setState({ activeFilePath: "/tmp/b.ts" });
    });

    // Reset cursor store to a known state
    useEditorStore.setState({ cursorLine: 1, cursorCol: 1 });

    // Simulate Monaco firing a cursor event on the now-stale editor.
    // With the fix, dispose() was called so no listeners remain — store stays at 1,1.
    // Without the fix, the listener is still active — store would update to 99,42.
    staleEditor._firePositionChange(99, 42);

    // Store must NOT have been updated by the stale editor
    expect(useEditorStore.getState().cursorLine).toBe(1);
    expect(useEditorStore.getState().cursorCol).toBe(1);
  });
});
