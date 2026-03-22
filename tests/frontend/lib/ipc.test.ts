import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Tauri APIs before importing ipc module
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ptyCreate, ptyWrite, ptyResize, ptyKill, onPtyOutput, onPtyExit } from "@/lib/ipc";

const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);

describe("ipc wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ptyCreate calls invoke with correct args", async () => {
    mockInvoke.mockResolvedValue("session-123");
    const result = await ptyCreate("/some/path", "powershell.exe");
    expect(mockInvoke).toHaveBeenCalledWith("pty_create", {
      path: "/some/path",
      command: "powershell.exe",
    });
    expect(result).toBe("session-123");
  });

  it("ptyCreate works without command", async () => {
    mockInvoke.mockResolvedValue("session-456");
    await ptyCreate("/path");
    expect(mockInvoke).toHaveBeenCalledWith("pty_create", {
      path: "/path",
      command: undefined,
    });
  });

  it("ptyWrite calls invoke with correct args", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await ptyWrite("s1", "echo hello\r\n");
    expect(mockInvoke).toHaveBeenCalledWith("pty_write", {
      sessionId: "s1",
      data: "echo hello\r\n",
    });
  });

  it("ptyResize calls invoke with correct args", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await ptyResize("s1", 40, 120);
    expect(mockInvoke).toHaveBeenCalledWith("pty_resize", {
      sessionId: "s1",
      rows: 40,
      cols: 120,
    });
  });

  it("ptyKill calls invoke with correct args", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await ptyKill("s1");
    expect(mockInvoke).toHaveBeenCalledWith("pty_kill", {
      sessionId: "s1",
    });
  });

  it("onPtyOutput listens for pty:output events", async () => {
    const unlisten = vi.fn();
    mockListen.mockResolvedValue(unlisten);
    const callback = vi.fn();
    const result = await onPtyOutput(callback);
    expect(mockListen).toHaveBeenCalledWith("pty:output", expect.any(Function));
    expect(result).toBe(unlisten);
  });

  it("onPtyExit listens for pty:exit events", async () => {
    const unlisten = vi.fn();
    mockListen.mockResolvedValue(unlisten);
    const callback = vi.fn();
    const result = await onPtyExit(callback);
    expect(mockListen).toHaveBeenCalledWith("pty:exit", expect.any(Function));
    expect(result).toBe(unlisten);
  });
});
