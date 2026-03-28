import { useEffect, act as reactAct } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useFileStore } from "@/stores/fileStore";
import { useEditorStore } from "@/stores/editorStore";

/** Fake Monaco editor — implements real dispose semantics so cursor tests work. */
function makeFakeEditor() {
  const listeners: Array<
    (e: { position: { lineNumber: number; column: number } | null }) => void
  > = [];

  // _disposeImpl is the underlying spy. Production code wraps editor.dispose with
  // an idempotency guard (replacing the property), so tests must assert on
  // _disposeImpl (the real implementation) rather than editor.dispose (the wrapper).
  const disposeImpl = vi.fn();

  return {
    getPosition: () => ({ lineNumber: 1, column: 1 }),
    dispose: disposeImpl,
    _disposeImpl: disposeImpl,
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
// Capture the last onChange callback so tests can simulate user typing
let lastOnChange: ((value: string | undefined) => void) | null = null;

// Mock Monaco editor — calls onMount after mount (mirrors real Monaco behaviour)
vi.mock("@monaco-editor/react", () => ({
  default: vi.fn(
    ({
      value,
      language,
      onMount,
      onChange,
    }: {
      value: string;
      language: string;
      onMount?: (editor: ReturnType<typeof makeFakeEditor>) => void;
      onChange?: (value: string | undefined) => void;
    }) => {
      lastOnChange = onChange ?? null;
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

import Editor from "@monaco-editor/react";
import EditorView from "@/components/editor/EditorView";

describe("EditorView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastFakeEditor = null;
    lastOnChange = null;
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

  it("calls editor.dispose() on unmount (prevents automaticLayout crash on split view toggle)", async () => {
    useFileStore.getState().openFile("/tmp/test.ts", "test.ts");
    const { unmount } = render(<EditorView />);
    // Wait for the full mount cycle: file loaded, Monaco remounted, cursor hook active
    await waitFor(() => {
      expect(lastFakeEditor).not.toBeNull();
      expect(lastFakeEditor!.onDidChangeCursorPosition).toHaveBeenCalledOnce();
    });
    const editorToDispose = lastFakeEditor!;
    unmount();
    expect(editorToDispose._disposeImpl).toHaveBeenCalled();
  });

  it("disables Monaco automaticLayout to prevent internal ResizeObserver from crashing on unmount", async () => {
    useFileStore.getState().openFile("/tmp/test.ts", "test.ts");
    render(<EditorView />);
    await screen.findByTestId("monaco-editor");

    const MonacoMock = vi.mocked(Editor);
    // automaticLayout: true causes Monaco's internal ResizeObserver to fire into a
    // removed DOM element after unmount. We must set it to false and handle layout
    // ourselves so we control when the observer is disconnected.
    const wasCalledWithAutoLayoutFalse = MonacoMock.mock.calls.some(
      (call) =>
        (call[0] as Record<string, unknown>)?.options !== undefined &&
        ((call[0] as Record<string, unknown>).options as Record<string, unknown>)
          ?.automaticLayout === false,
    );
    expect(wasCalledWithAutoLayoutFalse).toBe(true);
  });

  it("disposes Monaco synchronously when last file is closed (prevents ResizeObserver crash)", async () => {
    useFileStore.getState().openFile("/tmp/test.ts", "test.ts");
    render(<EditorView />);

    await waitFor(() => {
      expect(lastFakeEditor).not.toBeNull();
      expect(lastFakeEditor!.onDidChangeCursorPosition).toHaveBeenCalledOnce();
    });

    const editorToDispose = lastFakeEditor!;
    editorToDispose._disposeImpl.mockClear();

    // Synchronous reactAct flushes useLayoutEffect but NOT passive useEffect.
    // useLayoutEffect disposal: dispose IS called synchronously before DOM update.
    reactAct(() => {
      useFileStore.getState().closeFile("/tmp/test.ts");
    });

    expect(editorToDispose._disposeImpl).toHaveBeenCalled();
  });

  it("disposes Monaco synchronously when switching to another file (prevents cursor blink timer crash)", async () => {
    // The crash "Cannot read properties of undefined (reading '_isDisposed')" happens
    // because Monaco's cursor blink setInterval fires after its DOM container is removed
    // but before editor.dispose() cancels the timer. useLayoutEffect cleanup runs
    // synchronously before DOM mutations, closing this window.
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    render(<EditorView />);

    await waitFor(() => {
      expect(lastFakeEditor).not.toBeNull();
      expect(lastFakeEditor!.onDidChangeCursorPosition).toHaveBeenCalledOnce();
    });

    const firstEditor = lastFakeEditor!;
    firstEditor._disposeImpl.mockClear();

    // Synchronous reactAct flushes ALL effects (including passive useEffect) in jsdom,
    // so this test passes regardless. It exists as a regression guard: if disposal is
    // ever removed entirely, this test catches it. The real fix is useLayoutEffect in
    // EditorView — jsdom cannot model the browser's async useEffect timing.
    reactAct(() => {
      useFileStore.setState({ activeFilePath: "/tmp/b.ts" });
    });

    expect(firstEditor._disposeImpl).toHaveBeenCalled();
  });

  it("onMount wraps dispose to be idempotent — _disposeImpl called once even when dispose() fires multiple times", async () => {
    // Monaco's dispose() is not idempotent: calling it twice crashes with
    // "_isDisposed" on already-torn-down internals. Our useLayoutEffect fires
    // first (synchronous), then @monaco-editor/react fires its own useEffect
    // cleanup — both call editor.dispose(). The idempotent wrapper ensures the
    // underlying teardown (_disposeImpl) runs exactly once regardless.
    useFileStore.getState().openFile("/tmp/test.ts", "test.ts");
    render(<EditorView />);

    await waitFor(() => {
      expect(lastFakeEditor).not.toBeNull();
      expect(lastFakeEditor!.onDidChangeCursorPosition).toHaveBeenCalledOnce();
    });

    const editor = lastFakeEditor!;
    editor._disposeImpl.mockClear();

    // Simulate multiple callers invoking dispose() — as happens in the browser
    // when useLayoutEffect, @monaco-editor/react cleanup, and useEffect all fire.
    editor.dispose();
    editor.dispose();
    editor.dispose();

    // Real teardown must have run exactly once, not three times.
    expect(editor._disposeImpl).toHaveBeenCalledTimes(1);
  });

  it("marks active file as dirty when editor content changes", async () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    render(<EditorView />);
    await screen.findByTestId("monaco-editor");

    act(() => {
      lastOnChange?.("new content");
    });

    expect(useFileStore.getState().openFiles[0]?.isDirty).toBe(true);
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
