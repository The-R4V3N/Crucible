import { useFileStore } from "@/stores/fileStore";

/** Tab bar for open files in the editor. */
function EditorTabs() {
  const openFiles = useFileStore((s) => s.openFiles);
  const activeFilePath = useFileStore((s) => s.activeFilePath);
  const setActiveFile = useFileStore((s) => s.setActiveFile);
  const closeFile = useFileStore((s) => s.closeFile);

  return (
    <div
      data-testid="editor-tabs"
      className="flex h-9 items-stretch overflow-x-auto border-b border-warp-border bg-warp-sidebar"
    >
      {openFiles.map((file) => {
        const isActive = file.path === activeFilePath;
        return (
          <div
            key={file.path}
            data-testid={`tab-${file.path}`}
            className={`flex items-center gap-1 px-3 text-sm cursor-pointer border-b-2 ${
              isActive
                ? "border-warp-accent text-warp-text bg-warp-bg"
                : "border-transparent text-warp-text-dim hover:text-warp-text"
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            <span>{file.name}</span>
            <button
              data-testid={`close-${file.path}`}
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className="ml-1 text-xs text-warp-text-dim hover:text-warp-error"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default EditorTabs;
