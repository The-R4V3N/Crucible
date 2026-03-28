import { useEffect } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { useFileStore } from "@/stores/fileStore";
import { useEditorStore } from "@/stores/editorStore";

let lastOnChange: ((value: string | undefined) => void) | null = null;

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
      onMount?: (editor: object) => void;
      onChange?: (value: string | undefined) => void;
    }) => {
      lastOnChange = onChange ?? null;
      useEffect(() => {
        if (onMount) {
          const fakeEditor = {
            dispose: vi.fn(),
            onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
            getPosition: () => ({ lineNumber: 1, column: 1 }),
          };
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

const mockFileRead = vi.hoisted(() => vi.fn().mockResolvedValue("original content"));
const mockFileWrite = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/ipc", () => ({
  fileRead: mockFileRead,
  fileWrite: mockFileWrite,
}));

import EditorView from "@/components/editor/EditorView";

describe("EditorView — save on triggerSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastOnChange = null;
    useFileStore.setState({
      tree: null,
      openFiles: [{ path: "/tmp/a.ts", name: "a.ts", isDirty: true }],
      activeFilePath: "/tmp/a.ts",
      expandedDirs: new Set(),
      saveRequest: 0,
      revertRequest: 0,
    });
    useEditorStore.setState({ cursorLine: 1, cursorCol: 1, language: "plaintext" });
  });

  it("calls fileWrite with activeFilePath when saveRequest increments", async () => {
    render(<EditorView />);
    await screen.findByTestId("monaco-editor");

    // Simulate user typing new content
    act(() => { lastOnChange?.("updated content"); });

    // Trigger save
    act(() => { useFileStore.getState().triggerSave(); });

    await waitFor(() => {
      expect(mockFileWrite).toHaveBeenCalledWith("/tmp/a.ts", "updated content");
    });
  });

  it("marks file as clean after save", async () => {
    render(<EditorView />);
    await screen.findByTestId("monaco-editor");

    act(() => { lastOnChange?.("updated content"); });
    act(() => { useFileStore.getState().triggerSave(); });

    await waitFor(() => {
      expect(useFileStore.getState().openFiles[0]?.isDirty).toBe(false);
    });
  });

  it("does not call fileWrite when no file is active", async () => {
    useFileStore.setState({ activeFilePath: null, openFiles: [] });
    render(<EditorView />);

    act(() => { useFileStore.getState().triggerSave(); });

    expect(mockFileWrite).not.toHaveBeenCalled();
  });
});

describe("EditorView — revert on triggerRevert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastOnChange = null;
    mockFileRead.mockResolvedValue("original content");
    useFileStore.setState({
      tree: null,
      openFiles: [{ path: "/tmp/a.ts", name: "a.ts", isDirty: true }],
      activeFilePath: "/tmp/a.ts",
      expandedDirs: new Set(),
      saveRequest: 0,
      revertRequest: 0,
    });
    useEditorStore.setState({ cursorLine: 1, cursorCol: 1, language: "plaintext" });
  });

  it("calls fileRead again when revertRequest increments", async () => {
    render(<EditorView />);
    await screen.findByTestId("monaco-editor");

    const callsBefore = mockFileRead.mock.calls.length;

    act(() => { useFileStore.getState().triggerRevert(); });

    await waitFor(() => {
      expect(mockFileRead.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  it("marks file as clean after revert", async () => {
    render(<EditorView />);
    await screen.findByTestId("monaco-editor");

    act(() => { useFileStore.getState().triggerRevert(); });

    await waitFor(() => {
      expect(useFileStore.getState().openFiles[0]?.isDirty).toBe(false);
    });
  });

  it("does not call fileRead on revert when no file is active", async () => {
    useFileStore.setState({ activeFilePath: null, openFiles: [] });
    render(<EditorView />);

    const callsBefore = mockFileRead.mock.calls.length;
    act(() => { useFileStore.getState().triggerRevert(); });

    expect(mockFileRead.mock.calls.length).toBe(callsBefore);
  });
});
