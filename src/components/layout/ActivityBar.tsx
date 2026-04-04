import { useUiStore } from "@/stores/uiStore";

interface ActivityBarProps {
  /** Number of changed files to show as a badge on the Source Control icon. */
  changedFiles?: number;
}

/** VS Code-style vertical Activity Bar — narrow icon strip on the far left. */
function ActivityBar({ changedFiles = 0 }: ActivityBarProps) {
  const activePanel = useUiStore((s) => s.activePanel);
  const togglePanel = useUiStore((s) => s.togglePanel);
  const openSettings = useUiStore((s) => s.openSettings);

  const badgeLabel = changedFiles > 99 ? "99+" : String(changedFiles);

  function iconClass(panel: "explorer" | "search" | "source-control") {
    const isActive = activePanel === panel;
    return (
      `flex items-center justify-center w-12 h-12 transition-colors ` +
      (isActive ? "text-warp-accent" : "text-warp-text-dim hover:text-warp-text")
    );
  }

  return (
    <div
      data-testid="activity-bar"
      className="flex w-12 flex-shrink-0 flex-col items-center border-r border-warp-border bg-warp-sidebar"
    >
      {/* Explorer — two overlapping documents (VS Code style) */}
      <button
        data-testid="activity-explorer"
        title="Explorer"
        onClick={() => togglePanel("explorer")}
        className={iconClass("explorer")}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7l-4-2zm-1 13H8V7h7l3 2v9z" />
        </svg>
      </button>

      {/* Search — magnifying glass */}
      <button
        data-testid="activity-search"
        title="Search"
        onClick={() => togglePanel("search")}
        className={iconClass("search")}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </button>

      {/* Source Control — git branch fork */}
      <button
        data-testid="activity-source-control"
        title="Source Control"
        onClick={() => togglePanel("source-control")}
        className={`${iconClass("source-control")} relative`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm12 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 16a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0-3a1 1 0 0 1 1 1v1.268A5.002 5.002 0 0 1 6 24a5 5 0 0 1-1-9.897V14a1 1 0 0 1 1-1zm12-8a1 1 0 0 1 1 1v3.586l1.293-1.293a1 1 0 0 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 1.414-1.414L17 9.586V6a1 1 0 0 1 1-1zM7 15.1A3.001 3.001 0 0 0 6 21a3 3 0 0 0 1-5.9V15.1z" />
        </svg>
        {changedFiles > 0 && (
          <span
            data-testid="source-control-badge"
            className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-warp-accent text-black text-[9px] font-bold leading-none flex items-center justify-center px-0.5"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Settings — gear */}
      <button
        data-testid="activity-settings"
        title="Settings (Ctrl+,)"
        onClick={openSettings}
        className="mt-auto flex items-center justify-center w-12 h-12 text-warp-text-dim hover:text-warp-text transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.02 7.02 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54a7.02 7.02 0 0 0-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.36 1.04.67 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54a7.02 7.02 0 0 0 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
        </svg>
      </button>
    </div>
  );
}

export default ActivityBar;
