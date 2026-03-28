interface Props {
  label: string;
  keybinding?: string;
  isActive: boolean;
  onClick: () => void;
}

export default function CommandPaletteItem({ label, keybinding, isActive, onClick }: Props) {
  return (
    <li
      role="option"
      aria-selected={isActive}
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-2 cursor-pointer select-none text-sm ${
        isActive
          ? "bg-warp-accent/20 border-l-2 border-warp-accent text-warp-text"
          : "border-l-2 border-transparent text-warp-text hover:bg-white/5"
      }`}
    >
      <span>{label}</span>
      {keybinding && (
        <kbd className="text-xs text-warp-text-dim bg-warp-sidebar px-1.5 py-0.5 rounded border border-warp-border font-mono">
          {keybinding}
        </kbd>
      )}
    </li>
  );
}
