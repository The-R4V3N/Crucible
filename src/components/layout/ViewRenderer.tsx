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

/** Renders all views, showing only the active one.
 *  Terminal and Editor stay mounted (visibility toggle) to prevent flicker.
 *  DiffView uses display:none because Monaco DiffEditor's canvas can bleed
 *  through visibility:hidden in some WebView2 contexts, and it causes
 *  model disposal errors when receiving file path updates while invisible. */
const ViewRenderer = memo(function ViewRenderer({
  view,
  repoPath,
  diffFilePath,
  onError,
}: ViewRendererProps) {
  return (
    <div className="relative h-full w-full bg-warp-bg">
      <div
        className={`absolute inset-0 bg-warp-bg ${view === "terminal" ? "visible" : "invisible"}`}
      >
        <TerminalManager onError={onError} />
      </div>
      <div className={`absolute inset-0 bg-warp-bg ${view === "editor" ? "visible" : "invisible"}`}>
        <EditorView repoPath={repoPath} />
      </div>
      <div className={`absolute inset-0 bg-warp-bg ${view === "diff" ? "block" : "hidden"}`}>
        <DiffView repoPath={repoPath} filePath={view === "diff" ? diffFilePath : null} />
      </div>
    </div>
  );
});

export default ViewRenderer;
