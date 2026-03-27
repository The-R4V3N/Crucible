import { useUiStore } from "@/stores/uiStore";
import ProjectList from "./ProjectList";
import AddProjectButton from "./AddProjectButton";
import SourceControl from "./SourceControl";
import Shortcuts from "./Shortcuts";
import type { ProjectConfig } from "@/stores/configStore";
import type { GitStatusInfo } from "@/lib/ipc";

interface SidebarProps {
  projects: ProjectConfig[];
  gitStatus?: GitStatusInfo | null;
  projectPath?: string;
}

/** Left sidebar showing project list, source control, and shortcuts. */
function Sidebar({ projects, gitStatus, projectPath }: SidebarProps) {
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
        <AddProjectButton />
      </div>

      {/* Source control */}
      <SourceControl gitStatus={gitStatus ?? null} projectPath={projectPath} />

      {/* Shortcuts reference */}
      <Shortcuts />
    </aside>
  );
}

export default Sidebar;
