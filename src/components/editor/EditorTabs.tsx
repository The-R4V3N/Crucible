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
      className="flex h-9 items-stretch overflow-x-auto border-b border-crucible-border bg-crucible-sidebar"
    >
      {openFiles.map((file) => {
        const isActive = file.path === activeFilePath;
        return (
          <div
            key={file.path}
            data-testid={`tab-${file.path}`}
            className={`group flex items-center gap-1 px-3 text-sm cursor-pointer border-b-2 ${
              isActive
                ? "border-crucible-accent text-crucible-text bg-crucible-bg"
                : "border-transparent text-crucible-text-dim hover:text-crucible-text"
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            <span>{file.name}</span>
            {file.isDirty && (
              <span data-testid={`dirty-${file.path}`} className="text-crucible-accent text-xs">
                •
              </span>
            )}
            <button
              data-testid={`close-${file.path}`}
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className="ml-1 text-xs text-crucible-text-dim hover:text-crucible-error opacity-0 group-hover:opacity-100"
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
