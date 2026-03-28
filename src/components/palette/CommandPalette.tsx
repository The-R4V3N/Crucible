import { useRef, useEffect } from "react";
import { usePaletteStore } from "@/stores/paletteStore";
import { useFileStore } from "@/stores/fileStore";
import { useUiStore } from "@/stores/uiStore";
import { getCommands } from "@/lib/commandRegistry";
import { fuzzyMatch, fuzzyScore } from "@/lib/fuzzyMatch";
import CommandPaletteItem from "./CommandPaletteItem";

export default function CommandPalette() {
  const open = usePaletteStore((s) => s.open);
  const mode = usePaletteStore((s) => s.mode);
  const query = usePaletteStore((s) => s.query);
  const activeIndex = usePaletteStore((s) => s.activeIndex);
  const close = usePaletteStore((s) => s.close);
  const setQuery = usePaletteStore((s) => s.setQuery);
  const setActiveIndex = usePaletteStore((s) => s.setActiveIndex);

  const openFiles = useFileStore((s) => s.openFiles);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  // Build filtered + sorted item list based on mode
  const items =
    mode === "command"
      ? getCommands()
          .filter((cmd) => fuzzyMatch(query, cmd.label))
          .sort((a, b) => fuzzyScore(query, b.label) - fuzzyScore(query, a.label))
          .map((cmd) => ({
            id: cmd.id,
            label: cmd.label,
            keybinding: cmd.keybinding,
            onSelect: () => {
              cmd.execute();
              close();
            },
          }))
      : openFiles
          .filter((f) => fuzzyMatch(query, f.name))
          .sort((a, b) => fuzzyScore(query, b.name) - fuzzyScore(query, a.name))
          .map((f) => ({
            id: f.path,
            label: f.name,
            keybinding: undefined,
            onSelect: () => {
              useFileStore.getState().openFile(f.path, f.name);
              useUiStore.getState().setActiveView("editor");
              close();
            },
          }));

  const clampedIndex = Math.min(activeIndex, Math.max(0, items.length - 1));

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(Math.min(clampedIndex + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(Math.max(clampedIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[clampedIndex]?.onSelect();
    }
  }

  return (
    <div
      data-testid="palette-backdrop"
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-24"
      onClick={close}
    >
      <div
        data-testid="palette-container"
        className="w-[600px] max-h-[480px] flex flex-col rounded-lg border border-warp-border bg-warp-bg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          data-testid="palette-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === "command" ? "Type a command…" : "Search open files…"}
          className="w-full bg-transparent px-4 py-3 text-sm text-warp-text placeholder-warp-text-dim outline-none border-b border-warp-border"
        />
        {items.length === 0 ? (
          <div
            data-testid="palette-empty"
            className="px-4 py-6 text-sm text-warp-text-dim text-center"
          >
            No results
          </div>
        ) : (
          <ul data-testid="palette-list" role="listbox" className="overflow-y-auto">
            {items.map((item, i) => (
              <CommandPaletteItem
                key={item.id}
                label={item.label}
                keybinding={item.keybinding}
                isActive={i === clampedIndex}
                onClick={item.onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
