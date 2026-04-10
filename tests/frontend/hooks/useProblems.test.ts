import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProblemsStore } from "@/stores/problemsStore";
import { useProblems } from "@/hooks/useProblems";
import type * as Monaco from "monaco-editor";

/** Build a minimal Monaco marker. */
function makeMarker(
  overrides: Partial<Monaco.editor.IMarker> = {},
): Monaco.editor.IMarker {
  return {
    resource: { path: "/src/App.tsx", toString: () => "/src/App.tsx" } as Monaco.Uri,
    severity: 8, // MarkerSeverity.Error
    message: "Type error",
    startLineNumber: 5,
    startColumn: 3,
    endLineNumber: 5,
    endColumn: 10,
    owner: "typescript",
    ...overrides,
  } as Monaco.editor.IMarker;
}

describe("useProblems", () => {
  let disposeSpy: ReturnType<typeof vi.fn>;
  let onDidChangeMarkers: ReturnType<typeof vi.fn>;
  let getModelMarkers: ReturnType<typeof vi.fn>;
  let monaco: typeof Monaco;

  beforeEach(() => {
    useProblemsStore.setState({ problems: [], activeBottomTab: "changes" });

    disposeSpy = vi.fn();
    onDidChangeMarkers = vi.fn(() => ({ dispose: disposeSpy }));
    getModelMarkers = vi.fn(() => []);

    monaco = {
      MarkerSeverity: { Error: 8, Warning: 4, Info: 2, Hint: 1 },
      editor: {
        onDidChangeMarkers,
        getModelMarkers,
      },
    } as unknown as typeof Monaco;
  });

  it("subscribes to onDidChangeMarkers on mount", () => {
    renderHook(() => useProblems(monaco));
    expect(onDidChangeMarkers).toHaveBeenCalledOnce();
  });

  it("disposes the subscription on unmount", () => {
    const { unmount } = renderHook(() => useProblems(monaco));
    unmount();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("does nothing when monaco is null", () => {
    renderHook(() => useProblems(null));
    expect(onDidChangeMarkers).not.toHaveBeenCalled();
  });

  it("reads markers and updates the problems store", () => {
    getModelMarkers.mockReturnValue([makeMarker()]);
    // Capture the callback passed to onDidChangeMarkers
    onDidChangeMarkers.mockImplementation((cb: () => void) => {
      cb(); // fire immediately
      return { dispose: disposeSpy };
    });
    renderHook(() => useProblems(monaco));
    expect(useProblemsStore.getState().problems).toHaveLength(1);
    expect(useProblemsStore.getState().problems[0]!.severity).toBe("error");
    expect(useProblemsStore.getState().problems[0]!.message).toBe("Type error");
    expect(useProblemsStore.getState().problems[0]!.line).toBe(5);
    expect(useProblemsStore.getState().problems[0]!.col).toBe(3);
  });

  it("maps MarkerSeverity.Warning to warning severity", () => {
    getModelMarkers.mockReturnValue([makeMarker({ severity: 4 })]);
    onDidChangeMarkers.mockImplementation((cb: () => void) => {
      cb();
      return { dispose: disposeSpy };
    });
    renderHook(() => useProblems(monaco));
    expect(useProblemsStore.getState().problems[0]!.severity).toBe("warning");
  });

  it("clears problems when markers become empty", () => {
    useProblemsStore.getState().setProblems([
      { filePath: "/a.ts", line: 1, col: 1, message: "old", severity: "error" },
    ]);
    getModelMarkers.mockReturnValue([]);
    onDidChangeMarkers.mockImplementation((cb: () => void) => {
      cb();
      return { dispose: disposeSpy };
    });
    renderHook(() => useProblems(monaco));
    expect(useProblemsStore.getState().problems).toHaveLength(0);
  });
});
