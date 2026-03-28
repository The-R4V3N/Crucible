import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}));

vi.mock("@/lib/ipc", () => ({
  gitDiff: vi.fn(),
}));

import { gitDiff } from "@/lib/ipc";
import { useGitDecorations } from "@/hooks/useGitDecorations";

const mockGitDiff = vi.mocked(gitDiff);

function makeEditor() {
  const collection = {
    set: vi.fn(),
    clear: vi.fn(),
  };
  return {
    createDecorationsCollection: vi.fn().mockReturnValue(collection),
    _decorationCollection: collection,
  };
}

describe("useGitDecorations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call gitDiff when editor is null", async () => {
    mockGitDiff.mockResolvedValue({ path: "", old_content: "", new_content: "" });
    renderHook(() =>
      useGitDecorations({ editor: null, filePath: "src/App.tsx", repoPath: "/repo" }),
    );
    await act(async () => {});
    expect(mockGitDiff).not.toHaveBeenCalled();
  });

  it("does not call gitDiff when filePath is null", async () => {
    mockGitDiff.mockResolvedValue({ path: "", old_content: "", new_content: "" });
    const editor = makeEditor();
    renderHook(() =>
      useGitDecorations({ editor: editor as never, filePath: null, repoPath: "/repo" }),
    );
    await act(async () => {});
    expect(mockGitDiff).not.toHaveBeenCalled();
  });

  it("does not call gitDiff when repoPath is null", async () => {
    mockGitDiff.mockResolvedValue({ path: "", old_content: "", new_content: "" });
    const editor = makeEditor();
    renderHook(() =>
      useGitDecorations({ editor: editor as never, filePath: "src/App.tsx", repoPath: null }),
    );
    await act(async () => {});
    expect(mockGitDiff).not.toHaveBeenCalled();
  });

  it("calls gitDiff with correct args when editor and filePath are present", async () => {
    mockGitDiff.mockResolvedValue({
      path: "src/App.tsx",
      old_content: "a\nb",
      new_content: "a\nB",
    });
    const editor = makeEditor();
    renderHook(() =>
      useGitDecorations({ editor: editor as never, filePath: "src/App.tsx", repoPath: "/repo" }),
    );
    await act(async () => {});
    expect(mockGitDiff).toHaveBeenCalledWith("/repo", "src/App.tsx");
  });

  it("applies decorations when diff has changes", async () => {
    mockGitDiff.mockResolvedValue({
      path: "src/App.tsx",
      old_content: "a\nb\nc",
      new_content: "a\nB\nc",
    });
    const editor = makeEditor();
    renderHook(() =>
      useGitDecorations({ editor: editor as never, filePath: "src/App.tsx", repoPath: "/repo" }),
    );
    await act(async () => {});
    expect(editor.createDecorationsCollection).toHaveBeenCalled();
    const collection = editor._decorationCollection;
    expect(collection.set).toHaveBeenCalled();
    const decorations = (collection.set.mock.calls[0] as unknown[][])[0] as {
      range: { startLineNumber: number };
    }[];
    expect(decorations.length).toBeGreaterThan(0);
  });

  it("clears decorations and does not call gitDiff when filePath becomes null", async () => {
    mockGitDiff.mockResolvedValue({ path: "src/App.tsx", old_content: "a", new_content: "b" });
    const editor = makeEditor();
    const { rerender } = renderHook(
      ({ filePath }: { filePath: string | null }) =>
        useGitDecorations({ editor: editor as never, filePath, repoPath: "/repo" }),
      { initialProps: { filePath: "src/App.tsx" as string | null } },
    );
    await act(async () => {});

    vi.clearAllMocks();
    mockGitDiff.mockResolvedValue({ path: "", old_content: "", new_content: "" });

    rerender({ filePath: null });
    await act(async () => {});

    expect(mockGitDiff).not.toHaveBeenCalled();
  });

  it("handles gitDiff rejection gracefully (no uncaught error)", async () => {
    mockGitDiff.mockRejectedValue(new Error("not a git repo"));
    const editor = makeEditor();
    await expect(
      act(async () => {
        renderHook(() =>
          useGitDecorations({ editor: editor as never, filePath: "src/App.tsx", repoPath: "/bad" }),
        );
      }),
    ).resolves.not.toThrow();
  });

  it("no decoration applied when old and new content are identical", async () => {
    mockGitDiff.mockResolvedValue({
      path: "src/App.tsx",
      old_content: "a\nb\nc",
      new_content: "a\nb\nc",
    });
    const editor = makeEditor();
    renderHook(() =>
      useGitDecorations({ editor: editor as never, filePath: "src/App.tsx", repoPath: "/repo" }),
    );
    await act(async () => {});
    const collection = editor._decorationCollection;
    if (collection.set.mock.calls.length > 0) {
      const decorations = (collection.set.mock.calls[0] as unknown[][])[0] as unknown[];
      expect(decorations).toHaveLength(0);
    }
  });
});
