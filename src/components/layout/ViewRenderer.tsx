import type { ViewType } from "@/stores/uiStore";
import type { ProjectConfig } from "@/stores/configStore";
import TerminalManager from "@/components/terminal/TerminalManager";
import EditorView from "@/components/editor/EditorView";
import DiffView from "@/components/diff/DiffView";

interface ViewRendererProps {
  view: ViewType;
  projects: ProjectConfig[];
  repoPath: string;
  diffFilePath: string | null;
  onError?: (error: string) => void;
}

/** Renders the appropriate view component based on view type. */
function ViewRenderer({ view, projects, repoPath, diffFilePath, onError }: ViewRendererProps) {
  switch (view) {
    case "terminal":
      return <TerminalManager projects={projects} onError={onError} />;
    case "editor":
      return <EditorView />;
    case "diff":
      return <DiffView repoPath={repoPath} filePath={diffFilePath} />;
  }
}

export default ViewRenderer;
