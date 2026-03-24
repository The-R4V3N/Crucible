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
  const toggleBottomPanel = useUiStore((s) => s.toggleBottomPanel);
  const splitVertical = useUiStore((s) => s.splitVertical);
  const splitHorizontal = useUiStore((s) => s.splitHorizontal);
  const closeSplit = useUiStore((s) => s.closeSplit);
  const splitMode = useUiStore((s) => s.splitMode);
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

      // Ctrl+D — split vertical
      if (e.ctrlKey && !e.shiftKey && e.key === "d") {
        e.preventDefault();
        splitVertical();
        return;
      }

      // Ctrl+Shift+D — split horizontal
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        splitHorizontal();
        return;
      }

      // Ctrl+` — toggle bottom panel
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        toggleBottomPanel();
        return;
      }

      // Ctrl+W — close split (if active)
      if (e.ctrlKey && e.key === "w" && splitMode) {
        e.preventDefault();
        closeSplit();
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
  }, [projects, sessions, toggleSidebar, toggleExplorer, toggleBottomPanel, splitVertical, splitHorizontal, closeSplit, splitMode, setActiveSession]);
}
