import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import TerminalManager from "@/components/terminal/TerminalManager";
import { useConfigStore } from "@/stores/configStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useGit } from "@/hooks/useGit";
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

  // Keyboard shortcuts
  useKeyboard({ projects });

  // Git status for active project
  const { status: gitStatus } = useGit({
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

      {/* Terminal area */}
      <main className="flex-1 min-w-0">
        <TerminalManager projects={projects} onError={setError} />
      </main>
    </div>
  );
}

export default App;
