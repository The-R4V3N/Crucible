import { memo } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import { useConfigStore } from "@/stores/configStore";
import TerminalView from "./TerminalView";

interface TerminalManagerProps {
  onError?: (error: string) => void;
}

/** A single terminal pane — subscribes to its own active state to avoid parent re-renders. */
const TerminalPane = memo(function TerminalPane({
  projectName,
  cwd,
  command,
  onError,
}: {
  projectName: string;
  cwd: string;
  command: string;
  onError?: (error: string) => void;
}) {
  // Each pane subscribes to its own isActive — no cascading re-renders from parent
  const isActive = useSessionStore((s) => {
    const session = Object.values(s.sessions).find(
      (sess) => sess.projectName === projectName,
    );
    return session?.id === s.activeSessionId;
  });

  return (
    <div
      className={`absolute inset-0 bg-warp-bg ${isActive ? "visible" : "invisible"}`}
      style={{ contain: "strict" }}
      data-testid={`terminal-pane-${projectName}`}
    >
      <TerminalView
        projectName={projectName}
        cwd={cwd}
        command={command}
        onError={onError}
      />
    </div>
  );
});

/** Manages multiple terminal instances, showing only the active one. */
function TerminalManager({ onError }: TerminalManagerProps) {
  // Subscribe directly to config store — no props chain from App → ViewRenderer
  const projects = useConfigStore((s) => s.config?.projects ?? []);

  return (
    <div
      className="relative h-full w-full bg-warp-bg"
      data-testid="terminal-manager"
    >
      {projects.map((project) => (
        <TerminalPane
          key={project.name}
          projectName={project.name}
          cwd={project.path}
          command={project.command}
          onError={onError}
        />
      ))}
    </div>
  );
}

export default memo(TerminalManager);
