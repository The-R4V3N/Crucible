import { useEffect } from "react";
import { keybindings, type Keybinding } from "@/lib/keybindings";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SCOPE_LABELS: Record<Keybinding["scope"], string> = {
  global: "Global",
  terminal: "Terminal",
  editor: "Editor",
};

const SCOPES: Keybinding["scope"][] = ["global", "terminal", "editor"];

function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="shortcuts-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        data-testid="shortcuts-modal"
        tabIndex={-1}
        className="w-[560px] max-h-[600px] flex flex-col rounded-lg border border-crucible-border bg-crucible-bg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-crucible-border">
          <h2
            data-testid="shortcuts-modal-title"
            className="text-sm font-semibold text-crucible-text"
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-crucible-text-dim hover:text-crucible-text transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Sections */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {SCOPES.map((scope) => {
            const entries = keybindings.filter((kb) => kb.scope === scope);
            if (entries.length === 0) return null;
            return (
              <section key={scope} data-testid={`shortcuts-section-${scope}`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-crucible-accent mb-2">
                  {SCOPE_LABELS[scope]}
                </h3>
                <table className="w-full text-sm">
                  <tbody>
                    {entries.map((kb) => (
                      <tr key={kb.key} className="border-b border-crucible-border/40 last:border-0">
                        <td className="py-1.5 pr-8 text-crucible-text-dim">{kb.description}</td>
                        <td className="py-1.5 text-right">
                          <kbd className="px-1.5 py-0.5 rounded text-xs bg-crucible-sidebar border border-crucible-border text-crucible-text font-mono">
                            {kb.key}
                          </kbd>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ShortcutsModal;
