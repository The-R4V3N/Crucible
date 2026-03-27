import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEditorCursor } from "@/hooks/useEditorCursor";
import { useEditorStore } from "@/stores/editorStore";

/** Minimal fake Monaco editor for testing. */
function makeFakeEditor(
  overrides?: Partial<{
    getPosition: () => { lineNumber: number; column: number } | null;
  }>,
) {
  const listeners: Array<
    (e: { position: { lineNumber: number; column: number } | null }) => void
  > = [];

  const editor = {
    getPosition:
      overrides?.getPosition ?? (() => ({ lineNumber: 1, column: 1 })),
    onDidChangeCursorPosition: vi.fn(
      (
        cb: (e: {
          position: { lineNumber: number; column: number } | null;
        }) => void,
      ) => {
        listeners.push(cb);
        return { dispose: vi.fn() };
      },
    ),
    _firePositionChange(lineNumber: number, column: number) {
      listeners.forEach((cb) => cb({ position: { lineNumber, column } }));
    },
  };

  return editor;
}

describe("useEditorCursor", () => {
  beforeEach(() => {
    useEditorStore.setState({
      cursorLine: 1,
      cursorCol: 1,
      language: "plaintext",
    });
  });

  it("registers onDidChangeCursorPosition on mount", () => {
    const editor = makeFakeEditor();
    renderHook(() => useEditorCursor(editor as never));
    expect(editor.onDidChangeCursorPosition).toHaveBeenCalledOnce();
  });

  it("updates editorStore cursor when position changes", () => {
    const editor = makeFakeEditor();
    renderHook(() => useEditorCursor(editor as never));

    editor._firePositionChange(10, 5);

    expect(useEditorStore.getState().cursorLine).toBe(10);
    expect(useEditorStore.getState().cursorCol).toBe(5);
  });

  it("updates cursor on multiple position changes", () => {
    const editor = makeFakeEditor();
    renderHook(() => useEditorCursor(editor as never));

    editor._firePositionChange(3, 1);
    expect(useEditorStore.getState().cursorLine).toBe(3);

    editor._firePositionChange(99, 42);
    expect(useEditorStore.getState().cursorLine).toBe(99);
    expect(useEditorStore.getState().cursorCol).toBe(42);
  });

  it("disposes the listener on unmount", () => {
    const dispose = vi.fn();
    const editor = {
      getPosition: () => ({ lineNumber: 1, column: 1 }),
      onDidChangeCursorPosition: vi.fn(() => ({ dispose })),
      _firePositionChange: vi.fn(),
    };

    const { unmount } = renderHook(() => useEditorCursor(editor as never));
    unmount();

    expect(dispose).toHaveBeenCalledOnce();
  });

  it("does nothing when editor is null", () => {
    expect(() => renderHook(() => useEditorCursor(null))).not.toThrow();
  });

  it("does not update store when position event has null position", () => {
    const editor = makeFakeEditor();
    renderHook(() => useEditorCursor(editor as never));

    // Manually fire with null position (Monaco can emit this)
    const listeners: Array<
      (e: { position: { lineNumber: number; column: number } | null }) => void
    > = [];
    (
      editor.onDidChangeCursorPosition as ReturnType<typeof vi.fn>
    ).mock.calls.forEach((call: unknown[]) => {
      const cb = call[0] as (e: {
        position: { lineNumber: number; column: number } | null;
      }) => void;
      listeners.push(cb);
    });
    listeners.forEach((cb) => cb({ position: null }));

    // Store should remain at initial values
    expect(useEditorStore.getState().cursorLine).toBe(1);
    expect(useEditorStore.getState().cursorCol).toBe(1);
  });
});
