import { useEffect, useRef, useCallback } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import {
  ptyCreate,
  ptyWrite,
  ptyResize,
  ptyKill,
  onPtyOutput,
  onPtyExit,
  type PtyOutputPayload,
  type PtyExitPayload,
} from "@/lib/ipc";

interface UseSessionOptions {
  /** Working directory for the PTY session. */
  cwd: string;
  /** Command to run. Defaults to powershell.exe. */
  command?: string;
  /** Callback when PTY produces output. */
  onOutput?: (data: string) => void;
  /** Callback when PTY process exits. */
  onExit?: (code: number | null) => void;
}

interface UseSessionReturn {
  /** The session ID, or null if not yet created. */
  sessionId: string | null;
  /** Write data to the PTY. */
  write: (data: string) => Promise<void>;
  /** Resize the PTY. */
  resize: (rows: number, cols: number) => Promise<void>;
  /** Kill the PTY process. */
  kill: () => Promise<void>;
}

/** Hook to manage a single PTY session lifecycle. */
export function useSession({
  cwd,
  command,
  onOutput,
  onExit,
}: UseSessionOptions): UseSessionReturn {
  const sessionIdRef = useRef<string | null>(null);
  const { addSession, updateStatus, removeSession } = useSessionStore();

  // Store callbacks in refs to avoid effect re-runs
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    let cancelled = false;
    let unlistenOutput: (() => void) | undefined;
    let unlistenExit: (() => void) | undefined;

    const setup = async () => {
      try {
        // Create the PTY session
        const id = await ptyCreate(cwd, command);
        if (cancelled) {
          await ptyKill(id);
          return;
        }

        sessionIdRef.current = id;
        addSession(id);
        updateStatus(id, "running");

        // Listen for output
        unlistenOutput = await onPtyOutput((payload: PtyOutputPayload) => {
          if (payload.session_id === id) {
            onOutputRef.current?.(payload.data);
          }
        });

        // Listen for exit
        unlistenExit = await onPtyExit((payload: PtyExitPayload) => {
          if (payload.session_id === id) {
            updateStatus(id, "stopped");
            onExitRef.current?.(payload.code);
          }
        });
      } catch {
        if (sessionIdRef.current) {
          updateStatus(sessionIdRef.current, "error");
        }
      }
    };

    setup();

    return () => {
      cancelled = true;
      unlistenOutput?.();
      unlistenExit?.();
      const id = sessionIdRef.current;
      if (id) {
        ptyKill(id).catch(() => {});
        removeSession(id);
        sessionIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cwd, command]);

  const write = useCallback(async (data: string) => {
    const id = sessionIdRef.current;
    if (id) await ptyWrite(id, data);
  }, []);

  const resize = useCallback(async (rows: number, cols: number) => {
    const id = sessionIdRef.current;
    if (id) await ptyResize(id, rows, cols);
  }, []);

  const kill = useCallback(async () => {
    const id = sessionIdRef.current;
    if (id) await ptyKill(id);
  }, []);

  return {
    sessionId: sessionIdRef.current,
    write,
    resize,
    kill,
  };
}
