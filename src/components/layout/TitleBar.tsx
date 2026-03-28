import { getCurrentWindow } from "@tauri-apps/api/window";

/** Minimal custom title bar with WARP branding and window controls. */
function TitleBar() {
  const appWindow = getCurrentWindow();

  return (
    <div className="flex h-8 items-center bg-warp-surface select-none">
      {/* Drag region with branding */}
      <div
        className="flex-1 flex items-center px-3 h-full"
        data-tauri-drag-region
        data-testid="titlebar-drag-region"
      >
        <span className="text-warp-accent text-sm font-bold tracking-wider">WARP</span>
      </div>

      {/* Window controls */}
      <div className="flex h-full">
        <button
          aria-label="Minimize"
          className="w-12 h-full flex items-center justify-center text-warp-muted hover:bg-warp-hover transition-colors"
          onClick={() => appWindow.minimize()}
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          aria-label="Maximize"
          className="w-12 h-full flex items-center justify-center text-warp-muted hover:bg-warp-hover transition-colors"
          onClick={() => appWindow.toggleMaximize()}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>
        <button
          aria-label="Close"
          className="w-12 h-full flex items-center justify-center text-warp-muted hover:bg-red-600 hover:text-white transition-colors"
          onClick={() => appWindow.close()}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <line x1="0" y1="0" x2="10" y2="10" />
            <line x1="10" y1="0" x2="0" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TitleBar;
