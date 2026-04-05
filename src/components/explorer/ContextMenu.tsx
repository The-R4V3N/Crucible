import { useEffect, useRef } from "react";
import { useUiStore } from "@/stores/uiStore";

interface ContextMenuProps {
  x: number;
  y: number;
  targetPath: string;
  isDir: boolean;
  projectRoot: string;
  onClose: () => void;
}

const ITEM_CLASS =
  "flex w-full items-center px-3 py-1 text-left text-sm text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors";

function ContextMenu({ x, y, targetPath, isDir, projectRoot, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const requestNewFile = useUiStore((s) => s.requestNewFile);
  const requestNewFolder = useUiStore((s) => s.requestNewFolder);
  const setRenameTarget = useUiStore((s) => s.setRenameTarget);
  const setDeleteConfirm = useUiStore((s) => s.setDeleteConfirm);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

  function copyPath() {
    navigator.clipboard.writeText(targetPath);
    onClose();
  }

  function copyRelativePath() {
    const relative = targetPath.startsWith(projectRoot + "/")
      ? targetPath.slice(projectRoot.length + 1)
      : targetPath;
    navigator.clipboard.writeText(relative);
    onClose();
  }

  return (
    <div
      ref={ref}
      data-testid="context-menu"
      className="fixed z-50 min-w-[160px] border border-crucible-border bg-crucible-bg py-1 shadow-lg"
      style={{ left: x, top: y }}
    >
      {isDir && (
        <>
          <button
            className={ITEM_CLASS}
            onClick={() => {
              requestNewFile(targetPath);
              onClose();
            }}
          >
            New File
          </button>
          <button
            className={ITEM_CLASS}
            onClick={() => {
              requestNewFolder(targetPath);
              onClose();
            }}
          >
            New Folder
          </button>
          <div className="my-1 border-t border-crucible-border/60" />
        </>
      )}
      <button
        className={ITEM_CLASS}
        onClick={() => {
          setRenameTarget(targetPath);
          onClose();
        }}
      >
        Rename
      </button>
      <button
        className={ITEM_CLASS}
        onClick={() => {
          setDeleteConfirm(targetPath);
          onClose();
        }}
      >
        Delete
      </button>
      <div className="my-1 border-t border-crucible-border/60" />
      <button className={ITEM_CLASS} onClick={copyPath}>
        Copy Path
      </button>
      <button className={ITEM_CLASS} onClick={copyRelativePath}>
        Copy Relative Path
      </button>
    </div>
  );
}

export default ContextMenu;
