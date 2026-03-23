import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);

// Import after mocks
import { fileTree, fileRead, fileWrite, fileWatchStart, onFileChanged } from "@/lib/ipc";

describe("file IPC wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fileTree calls invoke with path and max_depth", async () => {
    mockInvoke.mockResolvedValue({ name: "root", path: "/tmp", is_dir: true, children: [] });
    await fileTree("/tmp", 3);
    expect(mockInvoke).toHaveBeenCalledWith("file_tree", { path: "/tmp", maxDepth: 3 });
  });

  it("fileTree defaults max_depth to null", async () => {
    mockInvoke.mockResolvedValue({ name: "root", path: "/tmp", is_dir: true, children: [] });
    await fileTree("/tmp");
    expect(mockInvoke).toHaveBeenCalledWith("file_tree", { path: "/tmp", maxDepth: null });
  });

  it("fileRead calls invoke with path", async () => {
    mockInvoke.mockResolvedValue("file content");
    const result = await fileRead("/tmp/test.txt");
    expect(mockInvoke).toHaveBeenCalledWith("file_read", { path: "/tmp/test.txt" });
    expect(result).toBe("file content");
  });

  it("fileWrite calls invoke with path and content", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await fileWrite("/tmp/test.txt", "new content");
    expect(mockInvoke).toHaveBeenCalledWith("file_write", { path: "/tmp/test.txt", content: "new content" });
  });

  it("fileWatchStart calls invoke with path", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await fileWatchStart("/tmp");
    expect(mockInvoke).toHaveBeenCalledWith("file_watch_start", { path: "/tmp" });
  });

  it("onFileChanged listens for file:changed events", async () => {
    const unlisten = vi.fn();
    mockListen.mockResolvedValue(unlisten);
    const callback = vi.fn();
    const result = await onFileChanged(callback);
    expect(mockListen).toHaveBeenCalledWith("file:changed", expect.any(Function));
    expect(result).toBe(unlisten);
  });
});
