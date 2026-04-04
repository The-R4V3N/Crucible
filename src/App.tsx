import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import TitleBar from "@/components/layout/TitleBar";
import MenuBar from "@/components/layout/MenuBar";
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
import { useAutoSave } from "@/hooks/useAutoSave";
import { useGit } from "@/hooks/useGit";
import { useFileWatcher } from "@/hooks/useFileWatcher";
import { useFileStore } from "@/stores/fileStore";
import { configLoad, configSave, gitStage, gitUnstage, gitDiscard, gitCommit } from "@/lib/ipc";
import StatusBar from "@/components/layout/StatusBar";
import CommandPalette from "@/components/palette/CommandPalette";
import ActivityBar from "@/components/layout/ActivityBar";
import SettingsModal from "@/components/settings/SettingsModal";

function App() {
  const [error, setError] = useState<string | null>(null);
  const config = useConfigStore((s) => s.config);
  const isLoaded = useConfigStore((s) => s.isLoaded);
  const setConfig = useConfigStore((s) => s.setConfig);

  // Apply config side-effects: CSS variables + zoom
  const accentColor = config?.accent_color;
  const uiZoom = config?.ui_zoom;
  useEffect(() => {
    if (!accentColor) return;
    document.documentElement.style.setProperty("--warp-accent", accentColor);
  }, [accentColor]);
  useEffect(() => {
    if (uiZoom == null) return;
    (document.documentElement.style as CSSStyleDeclaration & { zoom: string }).zoom =
      String(uiZoom);
  }, [uiZoom]);

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
          branch_prefix: "feature/",
          ui_zoom: 1.0,
          sidebar_position: "left",
          cursor_style: "bar",
          terminal_theme: "dark",
          divider_color: "#1E1E2E",
          default_project_path: "",
          shell_command: "powershell.exe",
        });
      });
  }, [setConfig]);

  const sidebarPosition = config?.sidebar_position ?? "left";

  const activeView = useUiStore((s) => s.activeView);
  const activePanel = useUiStore((s) => s.activePanel);
  const splitMode = useUiStore((s) => s.splitMode);
  const splitViews = useUiStore((s) => s.splitViews);
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
  }, [activeSession?.projectName, config, setActiveProject]);

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
  }, [isLoaded, config?.active_project]);

  // Keyboard shortcuts
  useKeyboard({ projects });

  // Auto-save on window blur
  useAutoSave();

  // Git status for active project
  const { status: gitStatus, refresh: refreshGit } = useGit({
    path: activeProject?.path ?? ".",
    enabled: isLoaded,
  });

  const repoPath = activeProject?.path ?? ".";

  const handleStage = async (filePath: string) => {
    await gitStage(repoPath, filePath);
    await refreshGit();
  };
  const handleUnstage = async (filePath: string) => {
    await gitUnstage(repoPath, filePath);
    await refreshGit();
  };
  const handleDiscard = async (filePath: string) => {
    await gitDiscard(repoPath, filePath);
    await refreshGit();
  };
  const handleCommit = async (message: string) => {
    await gitCommit(repoPath, message);
    await refreshGit();
  };
  const handleStageAll = async () => {
    const files = [...(gitStatus?.unstaged_files ?? []), ...(gitStatus?.untracked_files ?? [])];
    for (const f of files) await gitStage(repoPath, f);
    await refreshGit();
  };
  const handleUnstageAll = async () => {
    for (const f of gitStatus?.staged_files ?? []) await gitUnstage(repoPath, f);
    await refreshGit();
  };

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
      <MenuBar />
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

          {/* Left sidebar (default) */}
          {sidebarPosition !== "right" && (
            <>
              <ActivityBar changedFiles={gitStatus?.changed_files ?? 0} />
              {activePanel && (
                <div className="w-60 flex-shrink-0 border-r border-warp-border flex flex-col h-full">
                  {activePanel === "explorer" && <FileExplorer />}
                  {activePanel === "search" && (
                    <SearchPanel
                      projectPath={activeProject?.path ?? "."}
                      onResultClick={(filePath) => {
                        useFileStore
                          .getState()
                          .openFile(filePath, filePath.split("/").pop() ?? filePath);
                        if (useUiStore.getState().splitMode) {
                          useUiStore.getState().closeSplit();
                        }
                        useUiStore.getState().setActiveView("editor");
                      }}
                    />
                  )}
                  {activePanel === "source-control" && (
                    <Sidebar
                      projects={projects}
                      gitStatus={gitStatus}
                      projectPath={activeProject?.path}
                      onStage={handleStage}
                      onUnstage={handleUnstage}
                      onDiscard={handleDiscard}
                      onCommit={handleCommit}
                      onStageAll={handleStageAll}
                      onUnstageAll={handleUnstageAll}
                    />
                  )}
                </div>
              )}
            </>
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

          {/* Right sidebar */}
          {sidebarPosition === "right" && (
            <>
              {activePanel && (
                <div className="w-60 flex-shrink-0 border-l border-warp-border flex flex-col h-full">
                  {activePanel === "explorer" && <FileExplorer />}
                  {activePanel === "search" && (
                    <SearchPanel
                      projectPath={activeProject?.path ?? "."}
                      onResultClick={(filePath) => {
                        useFileStore
                          .getState()
                          .openFile(filePath, filePath.split("/").pop() ?? filePath);
                        if (useUiStore.getState().splitMode) {
                          useUiStore.getState().closeSplit();
                        }
                        useUiStore.getState().setActiveView("editor");
                      }}
                    />
                  )}
                  {activePanel === "source-control" && (
                    <Sidebar
                      projects={projects}
                      gitStatus={gitStatus}
                      projectPath={activeProject?.path}
                      onStage={handleStage}
                      onUnstage={handleUnstage}
                      onDiscard={handleDiscard}
                      onCommit={handleCommit}
                      onStageAll={handleStageAll}
                      onUnstageAll={handleUnstageAll}
                    />
                  )}
                </div>
              )}
              <ActivityBar changedFiles={gitStatus?.changed_files ?? 0} />
            </>
          )}
        </div>
        <CommandPalette />
        <SettingsModal />
      </ErrorBoundary>
    </div>
  );
}

export default App;
