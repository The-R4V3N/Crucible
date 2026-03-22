import { useSessionStore } from "@/stores/sessionStore";
import type { ProjectConfig } from "@/stores/configStore";
import TerminalView from "./TerminalView";

interface TerminalManagerProps {
  projects: ProjectConfig[];
  onError?: (error: string) => void;
}

/** Manages multiple terminal instances, showing only the active one. */
function TerminalManager({ projects, onError }: TerminalManagerProps) {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);

  return (
    <div className="relative h-full w-full" data-testid="terminal-manager">
      {projects.map((project) => {
        const session = Object.values(sessions).find(
          (s) => s.projectName === project.name,
        );
        const isActive = session?.id === activeSessionId;

        return (
          <div
            key={project.name}
            className={`absolute inset-0 ${isActive ? "visible" : "invisible"}`}
            data-testid={`terminal-pane-${project.name}`}
          >
            <TerminalView
              projectName={project.name}
              cwd={project.path}
              command={project.command}
              onError={onError}
            />
          </div>
        );
      })}
    </div>
  );
}

export default TerminalManager;
