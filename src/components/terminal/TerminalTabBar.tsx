import { useSessionStore } from "@/stores/sessionStore";

export interface TerminalTab {
  tabKey: string;
  projectName: string;
  cwd: string;
  command: string;
}

interface TerminalTabBarProps {
  tabs: TerminalTab[];
  onAdd: () => void;
  onClose: (tabKey: string) => void;
}

/** Tab bar rendered inside the terminal panel — one tab per active-project terminal session. */
function TerminalTabBar({ tabs, onAdd, onClose }: TerminalTabBarProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  const activeProject = activeSessionId ? (sessions[activeSessionId]?.projectName ?? null) : null;
  const activeTabs = tabs.filter((t) => t.projectName === activeProject);
  const canClose = activeTabs.length > 1;

  return (
    <div
      className="flex items-center gap-0 border-b border-warp-border bg-warp-sidebar overflow-x-auto shrink-0"
      data-testid="terminal-tab-bar"
    >
      {activeTabs.map((tab) => {
        const session = Object.values(sessions).find((s) => s.tabKey === tab.tabKey);
        const isActive = session?.id === activeSessionId;
        const label = session?.label || tab.command.split(/[\\/]/).pop() || tab.command;

        return (
          <div
            key={tab.tabKey}
            data-testid={`tab-${tab.tabKey}`}
            data-active={String(isActive)}
            className={`group flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer select-none shrink-0 border-r border-warp-border transition-colors ${
              isActive
                ? "bg-warp-bg text-warp-accent border-t-2 border-t-warp-accent"
                : "text-warp-text-dim hover:bg-warp-bg/50 hover:text-warp-text"
            }`}
            onClick={() => {
              if (session) setActiveSession(session.id);
            }}
          >
            <span className="truncate max-w-24">{label}</span>
            {canClose && (
              <button
                data-testid={`tab-close-${tab.tabKey}`}
                className="ml-1 opacity-0 group-hover:opacity-100 hover:text-warp-error transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  // If closing the active tab, switch to a sibling first so the
                  // terminal panel doesn't go blank when activeSessionId → null.
                  if (session?.id === activeSessionId) {
                    const sibling = Object.values(sessions).find(
                      (s) => s.projectName === session.projectName && s.tabKey !== tab.tabKey,
                    );
                    if (sibling) setActiveSession(sibling.id);
                  }
                  onClose(tab.tabKey);
                }}
                aria-label={`Close ${label}`}
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      <button
        data-testid="tab-add-btn"
        className="px-2 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-bg/50 transition-colors shrink-0"
        onClick={onAdd}
        aria-label="Add terminal"
      >
        +
      </button>
    </div>
  );
}

export default TerminalTabBar;
