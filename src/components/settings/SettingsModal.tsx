import { useEffect, useState } from "react";
import { useUiStore } from "@/stores/uiStore";
import SettingsGeneral from "./SettingsGeneral";
import SettingsAppearance from "./SettingsAppearance";
import SettingsTerminal from "./SettingsTerminal";
import SettingsKeyboard from "./SettingsKeyboard";

type Page = "general" | "appearance" | "terminal" | "keyboard";

const NAV_ITEMS: { id: Page; label: string }[] = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "terminal", label: "Terminal" },
  { id: "keyboard", label: "Keyboard Shortcuts" },
];

function SettingsModal() {
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const closeSettings = useUiStore((s) => s.closeSettings);
  const [activePage, setActivePage] = useState<Page>("general");

  useEffect(() => {
    if (!settingsOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeSettings();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen, closeSettings]);

  if (!settingsOpen) return null;

  return (
    <div data-testid="settings-modal" className="fixed inset-0 z-50 flex bg-black/60">
      <div className="relative flex w-full max-w-4xl m-auto h-[80vh] bg-warp-sidebar border border-warp-border shadow-2xl">
        {/* Left nav */}
        <nav className="w-48 flex-shrink-0 border-r border-warp-border bg-warp-bg py-4">
          <p className="px-4 pb-3 text-xs uppercase tracking-wider text-warp-text-dim">Settings</p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              data-testid={`settings-nav-${item.id}`}
              onClick={() => setActivePage(item.id)}
              className={`flex w-full items-center px-4 py-2 text-sm transition-colors ${
                activePage === item.id
                  ? "bg-warp-sidebar text-warp-accent"
                  : "text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar/60"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activePage === "general" && <SettingsGeneral />}
          {activePage === "appearance" && <SettingsAppearance />}
          {activePage === "terminal" && <SettingsTerminal />}
          {activePage === "keyboard" && <SettingsKeyboard />}
        </div>

        {/* Close button */}
        <button
          data-testid="settings-close"
          onClick={closeSettings}
          className="absolute right-4 top-4 text-warp-text-dim hover:text-warp-text transition-colors"
          aria-label="Close settings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.647.707.707L8 8.707z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default SettingsModal;
