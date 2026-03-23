import { useEffect } from "react";
import { useUiStore } from "@/stores/uiStore";
import { useSessionStore } from "@/stores/sessionStore";
import type { ProjectConfig } from "@/stores/configStore";

interface UseKeyboardOptions {
  /** List of projects for F-key switching. */
  projects: ProjectConfig[];
}

/** Global keyboard shortcut handler. */
export function useKeyboard({ projects }: UseKeyboardOptions) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleExplorer = useUiStore((s) => s.toggleExplorer);
  const sessions = useSessionStore((s) => s.sessions);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B — toggle sidebar
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Ctrl+E — toggle file explorer
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        toggleExplorer();
        return;
      }

      // F1-F12 — switch to project 1-12
      const fKeyMatch = e.key.match(/^F(\d+)$/);
      if (fKeyMatch && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const index = parseInt(fKeyMatch[1], 10) - 1;
        const project = projects[index];
        if (project) {
          e.preventDefault();
          const session = Object.values(sessions).find(
            (s) => s.projectName === project.name,
          );
          if (session) {
            setActiveSession(session.id);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [projects, sessions, toggleSidebar, toggleExplorer, setActiveSession]);
}
