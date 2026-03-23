import { useEffect, useRef } from "react";
import { fileWatchStart, onFileChanged, fileTree } from "@/lib/ipc";
import { useFileStore } from "@/stores/fileStore";

interface UseFileWatcherOptions {
  /** Path to watch for file changes. */
  path: string;
  /** Whether the watcher is enabled. */
  enabled: boolean;
}

/** Hook to watch a directory for file changes and refresh the file tree. */
export function useFileWatcher({ path, enabled }: UseFileWatcherOptions) {
  const setTree = useFileStore((s) => s.setTree);
  const watchingRef = useRef(false);

  useEffect(() => {
    if (!enabled || watchingRef.current) return;

    let unlistenFn: (() => void) | undefined;

    const setup = async () => {
      try {
        // Start watching the directory
        await fileWatchStart(path);
        watchingRef.current = true;

        // Load initial file tree
        const tree = await fileTree(path);
        setTree(tree);

        // Listen for changes and refresh tree
        unlistenFn = await onFileChanged(async () => {
          try {
            const updated = await fileTree(path);
            setTree(updated);
          } catch {
            // Silently fail on refresh errors
          }
        });
      } catch {
        // Silently fail if watcher can't start
      }
    };

    setup();

    return () => {
      unlistenFn?.();
    };
  }, [path, enabled, setTree]);
}
