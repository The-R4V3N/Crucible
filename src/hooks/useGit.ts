import { useState, useEffect, useRef, useCallback } from "react";
import { gitStatus, type GitStatusInfo } from "@/lib/ipc";

interface UseGitOptions {
  /** Path to the git repository. */
  path: string;
  /** Polling interval in milliseconds. Defaults to 5000. */
  interval?: number;
  /** Whether polling is enabled. Defaults to true. */
  enabled?: boolean;
}

interface UseGitReturn {
  /** Current git status, or null if not yet loaded. */
  status: GitStatusInfo | null;
  /** Whether the status is loading. */
  loading: boolean;
  /** Manually refresh git status. */
  refresh: () => Promise<void>;
}

/** Hook to poll git status for a project. */
export function useGit({
  path,
  interval = 5000,
  enabled = true,
}: UseGitOptions): UseGitReturn {
  const [status, setStatus] = useState<GitStatusInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const result = await gitStatus(path);
      setStatus(result);
    } catch {
      // Silently fail — project may not be a git repo
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    if (!enabled) return;

    fetchStatus();

    intervalRef.current = setInterval(fetchStatus, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStatus, interval, enabled]);

  return { status, loading, refresh: fetchStatus };
}
