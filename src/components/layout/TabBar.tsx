import { useUiStore, type ViewType } from "@/stores/uiStore";

const tabs: { id: ViewType; label: string }[] = [
  { id: "terminal", label: "Terminal" },
  { id: "editor", label: "Editor" },
  { id: "diff", label: "Diff" },
];

/** Top tab bar for switching between Terminal, Editor, and Diff views. */
function TabBar() {
  const activeView = useUiStore((s) => s.activeView);
  const setActiveView = useUiStore((s) => s.setActiveView);

  return (
    <div
      data-testid="tab-bar"
      className="flex h-9 items-stretch border-b border-warp-border bg-warp-sidebar"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeView;
        return (
          <button
            key={tab.id}
            data-testid={`tab-${tab.id}`}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 text-sm border-b-2 transition-colors ${
              isActive
                ? "border-warp-accent text-warp-text"
                : "border-transparent text-warp-text-dim hover:text-warp-text"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default TabBar;
