import { useUiStore } from "@/stores/uiStore";
import ProjectList from "./ProjectList";
import type { ProjectConfig } from "@/stores/configStore";

interface SidebarProps {
  projects: ProjectConfig[];
}

/** Left sidebar showing project list and status. */
function Sidebar({ projects }: SidebarProps) {
  const sidebarVisible = useUiStore((s) => s.sidebarVisible);

  if (!sidebarVisible) return null;

  return (
    <aside
      data-testid="sidebar"
      className="flex h-full w-60 flex-shrink-0 flex-col border-r border-warp-border bg-warp-sidebar"
    >
      {/* Logo */}
      <div className="flex items-center px-4 py-3">
        <span className="text-warp-accent text-sm font-bold tracking-wider">
          WARP
        </span>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto">
        <ProjectList projects={projects} />
      </div>
    </aside>
  );
}

export default Sidebar;
