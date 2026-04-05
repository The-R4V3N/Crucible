import { useEffect, useRef, useState } from "react";
import { useFileStore } from "@/stores/fileStore";
import { useUiStore } from "@/stores/uiStore";
import { fileRename, fileTree } from "@/lib/ipc";
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
  const tree = useFileStore((s) => s.tree);
  const setTree = useFileStore((s) => s.setTree);

  const setContextMenu = useUiStore((s) => s.setContextMenu);
  const renameTargetPath = useUiStore((s) => s.renameTargetPath);
  const clearRenameTarget = useUiStore((s) => s.clearRenameTarget);

  const [renameName, setRenameName] = useState(node.name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const isExpanded = expandedDirs.has(node.path);
  const isActive = node.path === activeFilePath;
  const isRenaming = renameTargetPath === node.path;

  useEffect(() => {
    if (isRenaming) {
      setRenameName(node.name);
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming, node.name]);

  const handleClick = () => {
    if (node.is_dir) {
      toggleDir(node.path);
    } else {
      openFile(node.path, node.name);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, targetPath: node.path, isDir: node.is_dir });
  };

  async function commitRename() {
    const trimmed = renameName.trim();
    if (!trimmed || trimmed === node.name) {
      clearRenameTarget();
      return;
    }
    const lastSlash = node.path.lastIndexOf("/");
    const parent = lastSlash >= 0 ? node.path.slice(0, lastSlash) : "";
    const newPath = parent ? `${parent}/${trimmed}` : trimmed;
    await fileRename(node.path, newPath);
    if (tree) {
      const updated = await fileTree(tree.path);
      setTree(updated);
    }
    clearRenameTarget();
  }

  if (isRenaming) {
    return (
      <div>
        <div className="px-2 py-0.5" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
          <input
            ref={renameInputRef}
            data-testid="rename-input"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              else if (e.key === "Escape") clearRenameTarget();
            }}
            className="w-full border border-crucible-accent bg-crucible-bg px-2 py-0.5 text-sm text-crucible-text outline-none"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`flex w-full items-center gap-1 px-2 py-0.5 text-left text-sm hover:bg-crucible-bg/50 ${
          isActive ? "bg-crucible-bg text-crucible-accent" : "text-crucible-text"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.is_dir && (
          <span className="text-xs text-crucible-text-dim">{isExpanded ? "▼" : "▶"}</span>
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
