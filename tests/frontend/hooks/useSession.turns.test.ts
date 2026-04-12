import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSessionStore } from "@/stores/sessionStore";

// Mock IPC module — must include onPtyTurnStart
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
  ptyKill,
  onPtyOutput,
  onPtyExit,
  onPtyAttention,
  onPtyTurnStart,
  type PtyTurnStartPayload,
} from "@/lib/ipc";
import { useSession } from "@/hooks/useSession";

const mockPtyCreate = vi.mocked(ptyCreate);
const mockPtyKill = vi.mocked(ptyKill);
const mockOnPtyOutput = vi.mocked(onPtyOutput);
const mockOnPtyExit = vi.mocked(onPtyExit);
const mockOnPtyAttention = vi.mocked(onPtyAttention);
const mockOnPtyTurnStart = vi.mocked(onPtyTurnStart);

describe("useSession turn events", () => {
  let capturedTurnCallback: ((payload: PtyTurnStartPayload) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedTurnCallback = null;
    useSessionStore.setState({ sessions: {}, activeSessionId: null });

    mockPtyCreate.mockResolvedValue("test-session-id");
    mockPtyKill.mockResolvedValue(undefined);
    mockOnPtyOutput.mockResolvedValue(vi.fn());
    mockOnPtyExit.mockResolvedValue(vi.fn());
    mockOnPtyAttention.mockResolvedValue(vi.fn());
    mockOnPtyTurnStart.mockImplementation(async (cb) => {
      capturedTurnCallback = cb;
      return vi.fn();
    });
  });

  it("subscribes to pty:turn_start on mount", async () => {
    renderHook(() => useSession({ cwd: "/test" }));

    await waitFor(() => {
      expect(mockOnPtyTurnStart).toHaveBeenCalled();
    });
  });

  it("calls onTurnStart callback when pty:turn_start fires for this session", async () => {
    const onTurnStart = vi.fn();
    renderHook(() => useSession({ cwd: "/test", onTurnStart }));

    await waitFor(() => expect(capturedTurnCallback).not.toBeNull());

    capturedTurnCallback!({
      session_id: "test-session-id",
      turn_id: 1,
      timestamp_ms: 1700000000000,
    });

    expect(onTurnStart).toHaveBeenCalledWith(1, 1700000000000);
  });

  it("does not call onTurnStart for a different session", async () => {
    const onTurnStart = vi.fn();
    renderHook(() => useSession({ cwd: "/test", onTurnStart }));

    await waitFor(() => expect(capturedTurnCallback).not.toBeNull());

    capturedTurnCallback!({
      session_id: "other-session-id",
      turn_id: 1,
      timestamp_ms: 1000,
    });

    expect(onTurnStart).not.toHaveBeenCalled();
  });

  it("stores the turn in sessionStore when pty:turn_start fires", async () => {
    renderHook(() => useSession({ cwd: "/test", projectName: "my-project" }));

    await waitFor(() => expect(capturedTurnCallback).not.toBeNull());

    capturedTurnCallback!({
      session_id: "test-session-id",
      turn_id: 1,
      timestamp_ms: 1700000000000,
    });

    const turns = useSessionStore.getState().getTurns("test-session-id");
    expect(turns).toHaveLength(1);
    expect(turns[0]?.turnId).toBe(1);
    expect(turns[0]?.timestampMs).toBe(1700000000000);
  });

  it("unsubscribes from pty:turn_start on unmount", async () => {
    const unlistenTurn = vi.fn();
    mockOnPtyTurnStart.mockResolvedValue(unlistenTurn);

    const { unmount } = renderHook(() => useSession({ cwd: "/test" }));

    await waitFor(() => expect(mockOnPtyTurnStart).toHaveBeenCalled());

    unmount();

    expect(unlistenTurn).toHaveBeenCalled();
  });
});
