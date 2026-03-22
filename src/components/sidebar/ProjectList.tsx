import { useSessionStore } from "@/stores/sessionStore";
import type { ProjectConfig } from "@/stores/configStore";
import type { SessionStatus } from "@/stores/sessionStore";

interface ProjectListProps {
  projects: ProjectConfig[];
}

/** Status dot color mapping. */
function statusColor(status: SessionStatus | undefined): string {
  switch (status) {
    case "running":
      return "bg-warp-success";
    case "stopped":
      return "bg-warp-error";
    case "error":
      return "bg-warp-error";
    case "starting":
      return "bg-warp-warning";
    default:
      return "bg-warp-text-dim";
  }
}

/** List of projects with status indicators. */
function ProjectList({ projects }: ProjectListProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  return (
    <div className="flex flex-col gap-0.5 px-1" data-testid="project-list">
      {projects.map((project, index) => {
        const session = Object.values(sessions).find(
          (s) => s.projectName === project.name,
        );
        const isActive = session?.id === activeSessionId;

        return (
          <button
            key={project.name}
            data-testid={`project-item-${project.name}`}
            onClick={() => {
              if (session) {
                setActiveSession(session.id);
              }
            }}
            className={`group relative flex items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors ${
              isActive
                ? "bg-warp-bg text-warp-text"
                : "text-warp-text-dim hover:bg-warp-bg/50 hover:text-warp-text"
            }`}
          >
            {/* Accent bar for active project */}
            {isActive && (
              <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-warp-accent" />
            )}

            {/* Status dot */}
            <div
              className={`h-2 w-2 rounded-full ${statusColor(session?.status)}`}
              data-testid={`status-dot-${project.name}`}
            />

            {/* Project name */}
            <span className="flex-1 truncate">{project.name}</span>

            {/* F-key badge */}
            {index < 12 && (
              <span className="text-xs text-warp-text-dim opacity-0 group-hover:opacity-100">
                F{index + 1}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ProjectList;
