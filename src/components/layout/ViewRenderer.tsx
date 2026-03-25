import { memo } from "react";
import type { ViewType } from "@/stores/uiStore";
import TerminalManager from "@/components/terminal/TerminalManager";
import EditorView from "@/components/editor/EditorView";
import DiffView from "@/components/diff/DiffView";

interface ViewRendererProps {
  view: ViewType;
  repoPath: string;
  diffFilePath: string | null;
  onError?: (error: string) => void;
}

/** Renders all views, showing only the active one. Keeps components mounted to prevent flicker. */
const ViewRenderer = memo(function ViewRenderer({ view, repoPath, diffFilePath, onError }: ViewRendererProps) {
  return (
    <div className="relative h-full w-full bg-warp-bg">
      <div className={`absolute inset-0 bg-warp-bg ${view === "terminal" ? "visible" : "invisible"}`}>
        <TerminalManager onError={onError} />
      </div>
      <div className={`absolute inset-0 bg-warp-bg ${view === "editor" ? "visible" : "invisible"}`}>
        <EditorView />
      </div>
      <div className={`absolute inset-0 bg-warp-bg ${view === "diff" ? "visible" : "invisible"}`}>
        <DiffView repoPath={repoPath} filePath={diffFilePath} />
      </div>
    </div>
  );
});

export default ViewRenderer;
