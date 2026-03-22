import { keybindings } from "@/lib/keybindings";

/** Keyboard shortcuts reference panel in the sidebar. */
function Shortcuts() {
  // Show only a subset of shortcuts
  const displayBindings = keybindings.filter(
    (kb) => kb.key === "Ctrl+B" || kb.key === "F1" || kb.key === "F2",
  );

  return (
    <div
      data-testid="shortcuts-panel"
      className="border-t border-warp-border px-4 py-3"
    >
      <div className="mb-1 text-xs uppercase tracking-wider text-warp-text-dim">
        Shortcuts
      </div>
      <div className="flex flex-col gap-1">
        {displayBindings.map((kb) => (
          <div
            key={kb.key}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-warp-text-dim">{kb.key}</span>
            <span className="text-warp-text-dim">{kb.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Shortcuts;
