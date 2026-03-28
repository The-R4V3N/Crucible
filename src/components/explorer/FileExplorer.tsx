import { useRef, useEffect, useState } from "react";
import { useFileStore } from "@/stores/fileStore";
import { useUiStore } from "@/stores/uiStore";
import { fileWrite } from "@/lib/ipc";
import FileTree from "./FileTree";

/** Inline input shown at the top of the explorer when creating a new file. */
function NewFileInput({ rootPath }: { rootPath: string }) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const clearNewFileRequest = useUiStore((s) => s.clearNewFileRequest);
  const openFile = useFileStore((s) => s.openFile);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function commit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const path = `${rootPath}/${trimmed}`;
    await fileWrite(path, "");
    openFile(path, trimmed);
    useUiStore.getState().setActiveView("editor");
    clearNewFileRequest();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      commit();
    } else if (e.key === "Escape") {
      clearNewFileRequest();
    }
  }

  return (
    <div className="px-2 py-0.5">
      <input
        ref={inputRef}
        data-testid="new-file-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-warp-bg border border-warp-accent text-warp-text text-sm px-2 py-0.5 outline-none"
        placeholder="filename…"
      />
    </div>
  );
}

/** File explorer panel showing the project file tree. */
function FileExplorer() {
  const tree = useFileStore((s) => s.tree);
  const newFileRequested = useUiStore((s) => s.newFileRequested);

  return (
    <div data-testid="file-explorer" className="flex h-full flex-col bg-warp-sidebar">
      <div className="px-4 py-2 text-xs uppercase tracking-wider text-warp-text-dim">Explorer</div>
      {newFileRequested && tree && <NewFileInput rootPath={tree.path} />}
      <div className="flex-1 overflow-y-auto">
        <FileTree tree={tree} />
      </div>
    </div>
  );
}

export default FileExplorer;
