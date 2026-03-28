import { useFileStore } from "@/stores/fileStore";
import FileTree from "./FileTree";

/** File explorer panel showing the project file tree. */
function FileExplorer() {
  const tree = useFileStore((s) => s.tree);

  return (
    <div data-testid="file-explorer" className="flex h-full flex-col bg-warp-sidebar">
      <div className="px-4 py-2 text-xs uppercase tracking-wider text-warp-text-dim">Explorer</div>
      <div className="flex-1 overflow-y-auto">
        <FileTree tree={tree} />
      </div>
    </div>
  );
}

export default FileExplorer;
