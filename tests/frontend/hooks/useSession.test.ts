import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSessionStore } from "@/stores/sessionStore";

// Mock IPC module
vi.mock("@/lib/ipc", () => ({
  ptyCreate: vi.fn(),
  ptyWrite: vi.fn(),
  ptyResize: vi.fn(),
  ptyKill: vi.fn(),
  onPtyOutput: vi.fn(),
  onPtyExit: vi.fn(),
  onPtyAttention: vi.fn(),
  onPtyTurnStart: vi.fn(),
}));

import {
  ptyCreate,
  ptyWrite,
  ptyResize,
  ptyKill,
  onPtyOutput,
  onPtyExit,
  onPtyAttention,
  onPtyTurnStart,
} from "@/lib/ipc";
import { useSession } from "@/hooks/useSession";

const mockPtyCreate = vi.mocked(ptyCreate);
const mockPtyWrite = vi.mocked(ptyWrite);
const mockPtyResize = vi.mocked(ptyResize);
const mockPtyKill = vi.mocked(ptyKill);
const mockOnPtyOutput = vi.mocked(onPtyOutput);
const mockOnPtyExit = vi.mocked(onPtyExit);
const mockOnPtyAttention = vi.mocked(onPtyAttention);
const mockOnPtyTurnStart = vi.mocked(onPtyTurnStart);

describe("useSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({ sessions: {}, activeSessionId: null });

    const unlistenOutput = vi.fn();
    const unlistenExit = vi.fn();
    const unlistenAttention = vi.fn();
    mockPtyCreate.mockResolvedValue("test-session-id");
    mockPtyWrite.mockResolvedValue(undefined);
    mockPtyResize.mockResolvedValue(undefined);
    mockPtyKill.mockResolvedValue(undefined);
    mockOnPtyOutput.mockResolvedValue(unlistenOutput);
    mockOnPtyExit.mockResolvedValue(unlistenExit);
    mockOnPtyAttention.mockResolvedValue(unlistenAttention);
    mockOnPtyTurnStart.mockResolvedValue(vi.fn());
  });

  it("calls ptyCreate on mount", async () => {
    renderHook(() =>
      useSession({ cwd: "/test/path", command: "powershell.exe" }),
    );

    await waitFor(() => {
      expect(mockPtyCreate).toHaveBeenCalledWith("/test/path", "powershell.exe");
    });
  });

  it("adds session to store after creation", async () => {
    renderHook(() => useSession({ cwd: "/test" }));

    await waitFor(() => {
      const state = useSessionStore.getState();
      expect(state.sessions["test-session-id"]).toBeDefined();
      expect(state.sessions["test-session-id"]?.status).toBe("running");
    });
  });

  it("write calls ptyWrite with session id", async () => {
    const { result } = renderHook(() => useSession({ cwd: "/test" }));

    await waitFor(() => {
      expect(mockPtyCreate).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.write("echo hello\r\n");
    });

    expect(mockPtyWrite).toHaveBeenCalledWith("test-session-id", "echo hello\r\n");
  });

  it("resize calls ptyResize with session id", async () => {
    const { result } = renderHook(() => useSession({ cwd: "/test" }));

    await waitFor(() => {
      expect(mockPtyCreate).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.resize(40, 120);
    });

    expect(mockPtyResize).toHaveBeenCalledWith("test-session-id", 40, 120);
  });

  it("sets up output and exit listeners", async () => {
    renderHook(() => useSession({ cwd: "/test" }));

    await waitFor(() => {
      expect(mockOnPtyOutput).toHaveBeenCalled();
      expect(mockOnPtyExit).toHaveBeenCalled();
    });
  });

  it("kills session and cleans up on unmount", async () => {
    const { unmount } = renderHook(() => useSession({ cwd: "/test" }));

    await waitFor(() => {
      expect(mockPtyCreate).toHaveBeenCalled();
    });

    unmount();

    expect(mockPtyKill).toHaveBeenCalledWith("test-session-id");
  });
});
