import { keybindings } from "@/lib/keybindings";

function SettingsKeyboard() {
  return (
    <div data-testid="settings-page-keyboard" className="space-y-4">
      <h2 className="text-base font-semibold text-crucible-text">Keyboard Shortcuts</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-crucible-border text-left text-xs uppercase tracking-wider text-crucible-text-dim">
            <th className="pb-2 pr-4">Action</th>
            <th className="pb-2 pr-4">Shortcut</th>
            <th className="pb-2">Scope</th>
          </tr>
        </thead>
        <tbody>
          {keybindings.map((kb, i) => (
            <tr
              key={i}
              data-testid={`shortcut-row-${i}`}
              className="border-b border-crucible-border/40 hover:bg-crucible-bg/50"
            >
              <td className="py-1.5 pr-4 text-crucible-text">{kb.description}</td>
              <td className="py-1.5 pr-4">
                <kbd className="rounded border border-crucible-border bg-crucible-bg px-1.5 py-0.5 font-mono text-xs text-crucible-accent">
                  {kb.key}
                </kbd>
              </td>
              <td className="py-1.5 text-crucible-text-dim capitalize">{kb.scope}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SettingsKeyboard;
