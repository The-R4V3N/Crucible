import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import TitleBar from "@/components/layout/TitleBar";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import TabBar from "@/components/layout/TabBar";
import ViewRenderer from "@/components/layout/ViewRenderer";
import SplitPane from "@/components/panels/SplitPane";
import BottomPanel from "@/components/panels/BottomPanel";
import FileExplorer from "@/components/explorer/FileExplorer";
import SearchPanel from "@/components/search/SearchPanel";
import { useConfigStore } from "@/stores/configStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useUiStore } from "@/stores/uiStore";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useGit } from "@/hooks/useGit";
import { useFileWatcher } from "@/hooks/useFileWatcher";
import { useFileStore } from "@/stores/fileStore";
import { configLoad, configSave } from "@/lib/ipc";
import StatusBar from "@/components/layout/StatusBar";
import CommandPalette from "@/components/palette/CommandPalette";

function App() {
  const [error, setError] = useState<string | null>(null);
  const config = useConfigStore((s) => s.config);
  const isLoaded = useConfigStore((s) => s.isLoaded);
  const setConfig = useConfigStore((s) => s.setConfig);

  const projects = useMemo(() => config?.projects ?? [], [config?.projects]);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);

  // Find the active project's path for git status
  const activeSession = activeSessionId ? sessions[activeSessionId] : null;
  const activeProject = projects.find((p) => p.name === activeSession?.projectName);

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
          active_project: null,
        });
      });
  }, [setConfig]);

  const activeView = useUiStore((s) => s.activeView);
  const explorerVisible = useUiStore((s) => s.explorerVisible);
  const splitMode = useUiStore((s) => s.splitMode);
  const splitViews = useUiStore((s) => s.splitViews);
  const searchVisible = useUiStore((s) => s.searchVisible);
  const toggleSearch = useUiStore((s) => s.toggleSearch);
  const activeFilePath = useFileStore((s) => s.activeFilePath);

  // Persist active project to config when it changes
  const setActiveProject = useConfigStore((s) => s.setActiveProject);
  useEffect(() => {
    const projectName = activeSession?.projectName ?? null;
    if (config && config.active_project !== projectName) {
      setActiveProject(projectName);
      const updatedConfig = useConfigStore.getState().config;
      if (updatedConfig) {
        configSave(updatedConfig).catch(() => {});
      }
    }
  }, [activeSession?.projectName]);

  // Restore active project from config on startup
  useEffect(() => {
    if (!config?.active_project) return;
    const targetProject = config.active_project;
    // Wait for sessions to be created, then activate the right one
    const unsubscribe = useSessionStore.subscribe((state) => {
      const session = Object.values(state.sessions).find((s) => s.projectName === targetProject);
      if (session && state.activeSessionId !== session.id) {
        useSessionStore.getState().setActiveSession(session.id);
        unsubscribe();
      }
    });
    // Clean up if component unmounts before restore completes
    return unsubscribe;
  }, [isLoaded]);

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
    <div className="flex flex-col h-screen w-screen bg-warp-bg text-warp-text font-mono overflow-hidden">
      <TitleBar />
      <ErrorBoundary>
        <div className="flex flex-1 min-h-0">
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
          <Sidebar projects={projects} gitStatus={gitStatus} projectPath={activeProject?.path} />

          {/* File explorer panel */}
          {explorerVisible && (
            <div className="w-60 flex-shrink-0 border-r border-warp-border">
              <FileExplorer />
            </div>
          )}

          {/* Search panel */}
          {searchVisible && (
            <div className="w-72 flex-shrink-0 border-r border-warp-border">
              <SearchPanel
                projectPath={activeProject?.path ?? "."}
                onResultClick={(filePath) => {
                  useFileStore.getState().openFile(filePath, filePath.split("/").pop() ?? filePath);
                  if (useUiStore.getState().splitMode) {
                    useUiStore.getState().closeSplit();
                  }
                  useUiStore.getState().setActiveView("editor");
                }}
              />
            </div>
          )}

          {/* Main content area */}
          <main className="flex-1 min-w-0 flex flex-col bg-warp-bg">
            <TabBar onSearchToggle={toggleSearch} />
            <div className="flex-1 min-h-0">
              {splitMode ? (
                <SplitPane orientation={splitMode}>
                  <ViewRenderer
                    view={splitViews[0]}
                    repoPath={activeProject?.path ?? "."}
                    diffFilePath={activeFilePath}
                    onError={setError}
                  />
                  <ViewRenderer
                    view={splitViews[1]}
                    repoPath={activeProject?.path ?? "."}
                    diffFilePath={activeFilePath}
                    onError={setError}
                  />
                </SplitPane>
              ) : (
                <ViewRenderer
                  view={activeView}
                  repoPath={activeProject?.path ?? "."}
                  diffFilePath={activeFilePath}
                  onError={setError}
                />
              )}
            </div>

            {/* Bottom panel */}
            <BottomPanel
              changedFiles={gitStatus?.changed_file_paths ?? []}
              onFileClick={(filePath) => {
                const projectBase = activeProject?.path;
                let fullPath = filePath;
                if (projectBase) {
                  const base = projectBase.endsWith("/") ? projectBase.slice(0, -1) : projectBase;
                  fullPath = `${base}/${filePath}`;
                }
                const name = filePath.split("/").pop() ?? filePath;
                useFileStore.getState().openFile(fullPath, name);
                if (useUiStore.getState().splitMode) {
                  useUiStore.getState().closeSplit();
                }
                useUiStore.getState().setActiveView("editor");
              }}
            />
            <StatusBar gitStatus={gitStatus} />
          </main>
        </div>
        <CommandPalette />
      </ErrorBoundary>
    </div>
  );
}

export default App;
