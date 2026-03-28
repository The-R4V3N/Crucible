import { memo, useState, useCallback, useEffect, useRef } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import { useConfigStore } from "@/stores/configStore";
import { useUiStore } from "@/stores/uiStore";
import TerminalView from "./TerminalView";
import TerminalTabBar, { type TerminalTab } from "./TerminalTabBar";

interface TerminalManagerProps {
  onError?: (error: string) => void;
}

/** A single terminal pane — visible when its session is active. */
const TerminalPane = memo(function TerminalPane({
  tab,
  onError,
}: {
  tab: TerminalTab;
  onError?: (error: string) => void;
}) {
  const isActive = useSessionStore((s) => {
    const session = Object.values(s.sessions).find((sess) => sess.tabKey === tab.tabKey);
    return session?.id === s.activeSessionId;
  });

  return (
    <div
      className={`absolute inset-0 bg-warp-bg ${isActive ? "visible" : "invisible"}`}
      style={{ contain: "strict" }}
      data-testid={`terminal-pane-${tab.tabKey}`}
    >
      <TerminalView
        projectName={tab.projectName}
        tabKey={tab.tabKey}
        label={tab.command.split(/[\\/]/).pop() ?? tab.command}
        cwd={tab.cwd}
        command={tab.command}
        onError={onError}
      />
    </div>
  );
});

/** Manages multiple terminal instances with a tab bar. */
function TerminalManager({ onError }: TerminalManagerProps) {
  const projects = useConfigStore((s) => s.config?.projects ?? []);
  const tabCounterRef = useRef(0);

  // Initialize one tab per project; sync when projects are added
  const [tabs, setTabs] = useState<TerminalTab[]>(() =>
    projects.map((p) => ({ tabKey: p.name, projectName: p.name, cwd: p.path, command: p.command })),
  );

  // When a new project is added to config, add a corresponding initial tab
  useEffect(() => {
    setTabs((prev) => {
      const existingKeys = new Set(prev.map((t) => t.tabKey));
      const newTabs = projects
        .filter((p) => !existingKeys.has(p.name))
        .map((p) => ({ tabKey: p.name, projectName: p.name, cwd: p.path, command: p.command }));
      return newTabs.length > 0 ? [...prev, ...newTabs] : prev;
    });
  }, [projects]);

  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const activeProjectName = activeSessionId
    ? (sessions[activeSessionId]?.projectName ?? null)
    : null;

  const handleAddTab = useCallback(() => {
    if (!activeProjectName) return;
    const project = projects.find((p) => p.name === activeProjectName);
    if (!project) return;
    tabCounterRef.current += 1;
    const tabKey = `${project.name}-${tabCounterRef.current}`;
    setTabs((prev) => [
      ...prev,
      { tabKey, projectName: project.name, cwd: project.path, command: project.command },
    ]);
  }, [activeProjectName, projects]);

  const handleCloseTab = useCallback((tabKey: string) => {
    setTabs((prev) => prev.filter((t) => t.tabKey !== tabKey));
    // Switching active session is handled automatically when TerminalPane unmounts
    // and removeSession is called by useSession cleanup.
  }, []);

  const handleCloseActiveTab = useCallback(() => {
    const { activeSessionId, sessions } = useSessionStore.getState();
    if (!activeSessionId) return;
    const session = sessions[activeSessionId];
    if (!session) return;
    const projectTabs = tabs.filter((t) => t.projectName === session.projectName);
    if (projectTabs.length <= 1) return; // don't close last tab
    handleCloseTab(session.tabKey);
  }, [tabs, handleCloseTab]);

  // Register terminal actions into uiStore so MenuBar can trigger them
  const setTerminalActions = useUiStore((s) => s.setTerminalActions);
  useEffect(() => {
    setTerminalActions({ addTab: handleAddTab, closeActiveTab: handleCloseActiveTab });
  }, [setTerminalActions, handleAddTab, handleCloseActiveTab]);

  return (
    <div className="flex flex-col h-full w-full bg-warp-bg" data-testid="terminal-manager">
      <TerminalTabBar tabs={tabs} onAdd={handleAddTab} onClose={handleCloseTab} />
      <div className="relative flex-1">
        {tabs.map((tab) => (
          <TerminalPane key={tab.tabKey} tab={tab} onError={onError} />
        ))}
      </div>
    </div>
  );
}

export default memo(TerminalManager);
