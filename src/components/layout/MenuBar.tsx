import { useState, useRef, useEffect } from "react";
import { open } from "@tauri-apps/plugin-shell";
import ShortcutsModal from "@/components/help/ShortcutsModal";
import AboutModal from "@/components/help/AboutModal";

const DOCS_URL = "https://github.com/The-R4V3N/WARP#readme";
const ISSUES_URL = "https://github.com/The-R4V3N/WARP/issues";

function MenuBar() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  // Close Help dropdown on outside mousedown
  useEffect(() => {
    if (!helpOpen) return;
    const handler = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [helpOpen]);

  function handleDocs() {
    setHelpOpen(false);
    open(DOCS_URL);
  }

  function handleIssue() {
    setHelpOpen(false);
    open(ISSUES_URL);
  }

  function handleShortcuts() {
    setHelpOpen(false);
    setShortcutsOpen(true);
  }

  function handleAbout() {
    setHelpOpen(false);
    setAboutOpen(true);
  }

  return (
    <>
      <div
        data-testid="menu-bar"
        className="flex items-center h-6 px-1 bg-warp-sidebar border-b border-warp-border text-xs select-none"
      >
        {/* File — disabled until issue #44 */}
        <button
          data-testid="menu-file"
          disabled
          className="px-2 py-0.5 text-warp-text-dim opacity-40 cursor-not-allowed"
        >
          File
        </button>

        {/* Edit — disabled until issue #45 */}
        <button
          data-testid="menu-edit"
          disabled
          className="px-2 py-0.5 text-warp-text-dim opacity-40 cursor-not-allowed"
        >
          Edit
        </button>

        {/* Help */}
        <div ref={helpRef} className="relative">
          <button
            data-testid="menu-help"
            onClick={() => setHelpOpen((v) => !v)}
            className={`px-2 py-0.5 transition-colors ${
              helpOpen
                ? "bg-warp-accent/20 text-warp-accent"
                : "text-warp-text-dim hover:text-warp-text hover:bg-warp-bg/50"
            }`}
          >
            Help
          </button>

          {helpOpen && (
            <div
              data-testid="help-dropdown"
              className="absolute left-0 top-full mt-0.5 w-52 rounded border border-warp-border bg-warp-bg shadow-xl z-50 py-1"
            >
              <button
                data-testid="help-item-shortcuts"
                onClick={handleShortcuts}
                className="w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors"
              >
                Keyboard Shortcuts
              </button>
              <div className="my-1 border-t border-warp-border/60" />
              <button
                data-testid="help-item-docs"
                onClick={handleDocs}
                className="w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors"
              >
                View Documentation
              </button>
              <button
                data-testid="help-item-issue"
                onClick={handleIssue}
                className="w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors"
              >
                Report an Issue
              </button>
              <div className="my-1 border-t border-warp-border/60" />
              <button
                data-testid="help-item-about"
                onClick={handleAbout}
                className="w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors"
              >
                About WARP
              </button>
            </div>
          )}
        </div>
      </div>

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}

export default MenuBar;
