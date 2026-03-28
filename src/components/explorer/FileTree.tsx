import { useFileStore } from "@/stores/fileStore";
import type { FileNode } from "@/lib/ipc";

interface FileTreeProps {
  tree: FileNode | null;
}

/** Recursive file tree component. */
function FileTree({ tree }: FileTreeProps) {
  if (!tree) return null;

  return (
    <div data-testid="file-tree">
      {tree.children.map((node) => (
        <FileTreeNode key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const expandedDirs = useFileStore((s) => s.expandedDirs);
  const toggleDir = useFileStore((s) => s.toggleDir);
  const openFile = useFileStore((s) => s.openFile);
  const activeFilePath = useFileStore((s) => s.activeFilePath);

  const isExpanded = expandedDirs.has(node.path);
  const isActive = node.path === activeFilePath;

  const handleClick = () => {
    if (node.is_dir) {
      toggleDir(node.path);
    } else {
      openFile(node.path, node.name);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`flex w-full items-center gap-1 px-2 py-0.5 text-left text-sm hover:bg-warp-bg/50 ${
          isActive ? "bg-warp-bg text-warp-accent" : "text-warp-text"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.is_dir && (
          <span className="text-xs text-warp-text-dim">{isExpanded ? "▼" : "▶"}</span>
        )}
        {!node.is_dir && <span className="w-3" />}
        <span className="truncate">{node.name}</span>
      </button>
      {node.is_dir && isExpanded && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default FileTree;
