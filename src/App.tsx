import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import TabBar from "@/components/layout/TabBar";
import ViewRenderer from "@/components/layout/ViewRenderer";
import SplitPane from "@/components/panels/SplitPane";
import FileExplorer from "@/components/explorer/FileExplorer";
import { useConfigStore } from "@/stores/configStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useUiStore } from "@/stores/uiStore";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useGit } from "@/hooks/useGit";
import { useFileWatcher } from "@/hooks/useFileWatcher";
import { useFileStore } from "@/stores/fileStore";
import { configLoad } from "@/lib/ipc";

function App() {
  const [error, setError] = useState<string | null>(null);
  const config = useConfigStore((s) => s.config);
  const isLoaded = useConfigStore((s) => s.isLoaded);
  const setConfig = useConfigStore((s) => s.setConfig);

  const projects = config?.projects ?? [];
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);

  // Find the active project's path for git status
  const activeSession = activeSessionId ? sessions[activeSessionId] : null;
  const activeProject = projects.find(
    (p) => p.name === activeSession?.projectName,
  );

  // Load config on mount
  useEffect(() => {
    configLoad()
      .then(setConfig)
      .catch((err) => {
        setError(`Failed to load config: ${err}`);
        // Fall back to a default single project
        setConfig({
          projects: [{ name: "warp", path: ".", command: "powershell.exe" }],
          theme: "dark",
          accent_color: "#00E5FF",
          font_family: "Cascadia Code",
          font_size: 14,
          sidebar_width: 240,
          notifications: { visual: true, border_glow: true, sound: false },
        });
      });
  }, [setConfig]);

  const activeView = useUiStore((s) => s.activeView);
  const explorerVisible = useUiStore((s) => s.explorerVisible);
  const splitMode = useUiStore((s) => s.splitMode);
  const splitViews = useUiStore((s) => s.splitViews);
  const activeFilePath = useFileStore((s) => s.activeFilePath);

  // Keyboard shortcuts
  useKeyboard({ projects });

  // Git status for active project
  const { status: gitStatus } = useGit({
    path: activeProject?.path ?? ".",
    enabled: isLoaded,
  });

  // File watcher for active project
  useFileWatcher({
    path: activeProject?.path ?? ".",
    enabled: isLoaded,
  });

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-warp-bg">
        <span className="text-warp-accent text-xl">WARP</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-warp-bg text-warp-text font-mono overflow-hidden">
      {/* Error banner */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-warp-error/90 text-white p-2 text-sm z-50">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-white/70 hover:text-white"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar projects={projects} gitStatus={gitStatus} />

      {/* File explorer panel */}
      {explorerVisible && (
        <div className="w-60 flex-shrink-0 border-r border-warp-border">
          <FileExplorer />
        </div>
      )}

      {/* Main content area */}
      <main className="flex-1 min-w-0 flex flex-col">
        <TabBar />
        <div className="flex-1 min-h-0">
          {splitMode ? (
            <SplitPane orientation={splitMode}>
              <ViewRenderer
                view={splitViews[0]}
                projects={projects}
                repoPath={activeProject?.path ?? "."}
                diffFilePath={activeFilePath}
                onError={setError}
              />
              <ViewRenderer
                view={splitViews[1]}
                projects={projects}
                repoPath={activeProject?.path ?? "."}
                diffFilePath={activeFilePath}
                onError={setError}
              />
            </SplitPane>
          ) : (
            <ViewRenderer
              view={activeView}
              projects={projects}
              repoPath={activeProject?.path ?? "."}
              diffFilePath={activeFilePath}
              onError={setError}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
