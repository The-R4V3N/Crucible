import { useCallback, useEffect, useState } from "react";
import { useUiStore } from "@/stores/uiStore";
import { useConfigStore, type CrucibleConfig } from "@/stores/configStore";
import { configSave } from "@/lib/ipc";
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
  const config = useConfigStore((s) => s.config);
  const updateConfig = useConfigStore((s) => s.updateConfig);

  const [activePage, setActivePage] = useState<Page>("general");
  const [pending, setPending] = useState<CrucibleConfig | null>(null);

  // Snapshot config into pending state when the modal opens
  useEffect(() => {
    if (settingsOpen && config) {
      setPending({ ...config });
    }
  }, [settingsOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((patch: Partial<CrucibleConfig>) => {
    setPending((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const handleSave = useCallback(async () => {
    if (!pending) return;
    updateConfig(pending);
    await configSave(pending);
    closeSettings();
  }, [pending, updateConfig, closeSettings]);

  const handleCancel = useCallback(() => {
    closeSettings();
  }, [closeSettings]);

  useEffect(() => {
    if (!settingsOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen, handleCancel]);

  if (!settingsOpen || !pending) return null;

  return (
    <div data-testid="settings-modal" className="fixed inset-0 z-50 flex bg-black/60">
      <div className="relative flex w-full max-w-4xl m-auto h-[80vh] bg-crucible-sidebar border border-crucible-border shadow-2xl">
        {/* Left nav */}
        <nav className="w-48 flex-shrink-0 border-r border-crucible-border bg-crucible-bg py-4">
          <p className="px-4 pb-3 text-xs uppercase tracking-wider text-crucible-text-dim">
            Settings
          </p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              data-testid={`settings-nav-${item.id}`}
              onClick={() => setActivePage(item.id)}
              className={`flex w-full items-center px-4 py-2 text-sm transition-colors ${
                activePage === item.id
                  ? "bg-crucible-sidebar text-crucible-accent"
                  : "text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar/60"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content + footer */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-8">
            {activePage === "general" && (
              <SettingsGeneral config={pending} onChange={handleChange} />
            )}
            {activePage === "appearance" && (
              <SettingsAppearance config={pending} onChange={handleChange} />
            )}
            {activePage === "terminal" && (
              <SettingsTerminal config={pending} onChange={handleChange} />
            )}
            {activePage === "keyboard" && <SettingsKeyboard />}
          </div>

          {/* Save / Cancel footer */}
          <div className="flex justify-end gap-3 px-8 py-4 border-t border-crucible-border flex-shrink-0">
            <button
              data-testid="settings-cancel"
              onClick={handleCancel}
              className="px-4 py-1.5 text-sm text-crucible-text-dim border border-crucible-border hover:text-crucible-text hover:border-crucible-text transition-colors"
            >
              Cancel
            </button>
            <button
              data-testid="settings-save"
              onClick={handleSave}
              className="px-4 py-1.5 text-sm bg-crucible-accent text-crucible-bg hover:opacity-90 transition-opacity font-semibold"
            >
              Save
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          data-testid="settings-close"
          onClick={handleCancel}
          className="absolute right-4 top-4 text-crucible-text-dim hover:text-crucible-text transition-colors"
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
