import { useFileStore } from "@/stores/fileStore";

/** Normalize a path to forward slashes. */
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

/** Split a file path into display segments, relative to the project root if known. */
function getSegments(filePath: string, rootPath: string | null): string[] {
  const normalized = normalizePath(filePath);
  const normalizedRoot = rootPath ? normalizePath(rootPath) : null;

  let relative = normalized;
  if (normalizedRoot && normalized.startsWith(normalizedRoot + "/")) {
    relative = normalized.slice(normalizedRoot.length + 1);
  }

  return relative.split("/").filter(Boolean);
}

/** Reconstruct the absolute directory path for a given segment index. */
function segmentDirPath(filePath: string, rootPath: string | null, segmentIndex: number): string {
  const normalized = normalizePath(filePath);
  const normalizedRoot = rootPath ? normalizePath(rootPath) : null;

  let prefix = "";
  let relative = normalized;
  if (normalizedRoot && normalized.startsWith(normalizedRoot + "/")) {
    prefix = normalizedRoot;
    relative = normalized.slice(normalizedRoot.length + 1);
  }

  const parts = relative.split("/").filter(Boolean);
  const dirParts = parts.slice(0, segmentIndex + 1);
  return prefix ? `${prefix}/${dirParts.join("/")}` : dirParts.join("/");
}

/** Breadcrumb bar showing the active file's path segments above the editor. */
function Breadcrumbs() {
  const activeFilePath = useFileStore((s) => s.activeFilePath);
  const tree = useFileStore((s) => s.tree);
  const expandedDirs = useFileStore((s) => s.expandedDirs);
  const toggleDir = useFileStore((s) => s.toggleDir);

  if (!activeFilePath) return null;

  const rootPath = tree?.path ?? null;
  const segments = getSegments(activeFilePath, rootPath);

  const handleDirClick = (segmentIndex: number) => {
    const dirPath = segmentDirPath(activeFilePath, rootPath, segmentIndex);
    if (!expandedDirs.has(dirPath)) {
      toggleDir(dirPath);
    }
  };

  return (
    <div
      data-testid="breadcrumbs"
      className="flex h-7 items-center gap-0.5 overflow-x-auto border-b border-crucible-border bg-crucible-bg px-3 text-xs text-crucible-text-dim whitespace-nowrap"
    >
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <span key={index} className="flex items-center gap-0.5">
            {index > 0 && <span className="px-0.5 text-crucible-text-dim/50">›</span>}
            {isLast ? (
              <span
                data-testid="breadcrumb-filename"
                className="text-crucible-text"
              >
                {segment}
              </span>
            ) : (
              <button
                onClick={() => handleDirClick(index)}
                className="hover:text-crucible-text transition-colors"
              >
                {segment}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default Breadcrumbs;
