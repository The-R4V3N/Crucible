import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/lib/ipc", () => ({
  fileWatchStart: vi.fn().mockResolvedValue(undefined),
  onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
  fileTree: vi.fn().mockResolvedValue({
    name: "root", path: "/tmp", is_dir: true, children: [],
  }),
}));

import { fileWatchStart, onFileChanged, fileTree } from "@/lib/ipc";
import { useFileWatcher } from "@/hooks/useFileWatcher";

const mockFileWatchStart = vi.mocked(fileWatchStart);
const mockOnFileChanged = vi.mocked(onFileChanged);

describe("useFileWatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts watching the given path on mount", async () => {
    renderHook(() => useFileWatcher({ path: "/tmp/project", enabled: true }));
    await waitFor(() => {
      expect(mockFileWatchStart).toHaveBeenCalledWith("/tmp/project");
    });
  });

  it("listens for file:changed events", async () => {
    renderHook(() => useFileWatcher({ path: "/tmp/project", enabled: true }));
    await waitFor(() => {
      expect(mockOnFileChanged).toHaveBeenCalled();
    });
  });

  it("does not start watcher when disabled", () => {
    renderHook(() => useFileWatcher({ path: "/tmp/project", enabled: false }));
    expect(mockFileWatchStart).not.toHaveBeenCalled();
  });
});
