import { useRef, useEffect, useState } from "react";
import { useFileStore } from "@/stores/fileStore";
import { useUiStore } from "@/stores/uiStore";
import { fileWrite, dirCreate, fileTree, fileDelete } from "@/lib/ipc";
import FileTree from "./FileTree";
import ContextMenu from "./ContextMenu";

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
        className="w-full border border-crucible-accent bg-crucible-bg px-2 py-0.5 text-sm text-crucible-text outline-none"
        placeholder="filename…"
      />
    </div>
  );
}

/** Inline input shown at the top of the explorer when creating a new folder. */
function NewFolderInput({ rootPath }: { rootPath: string }) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const clearNewFolderRequest = useUiStore((s) => s.clearNewFolderRequest);
  const setTree = useFileStore((s) => s.setTree);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function commit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const path = `${rootPath}/${trimmed}`;
    await dirCreate(path);
    const updated = await fileTree(rootPath);
    setTree(updated);
    clearNewFolderRequest();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      commit();
    } else if (e.key === "Escape") {
      clearNewFolderRequest();
    }
  }

  return (
    <div className="px-2 py-0.5">
      <input
        ref={inputRef}
        data-testid="new-folder-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full border border-crucible-accent bg-crucible-bg px-2 py-0.5 text-sm text-crucible-text outline-none"
        placeholder="folder name…"
      />
    </div>
  );
}

/** Confirmation dialog rendered before deleting a file/folder. */
function DeleteConfirmDialog({
  targetPath,
  onConfirm,
  onCancel,
}: {
  targetPath: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const name = targetPath.split("/").pop() ?? targetPath;
  return (
    <div
      data-testid="delete-confirm-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="mx-4 w-full max-w-sm border border-crucible-border bg-crucible-sidebar p-4 shadow-lg">
        <p className="mb-4 text-sm text-crucible-text">
          Delete <span className="text-crucible-accent">{name}</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            data-testid="delete-cancel-button"
            onClick={onCancel}
            className="border border-crucible-border px-3 py-1 text-sm text-crucible-text-dim transition-colors hover:border-crucible-text hover:text-crucible-text"
          >
            Cancel
          </button>
          <button
            data-testid="delete-confirm-button"
            onClick={onConfirm}
            className="bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/** File explorer panel showing the project file tree. */
function FileExplorer() {
  const tree = useFileStore((s) => s.tree);
  const collapseAll = useFileStore((s) => s.collapseAll);
  const setTree = useFileStore((s) => s.setTree);
  const newFileRequested = useUiStore((s) => s.newFileRequested);
  const newFolderRequested = useUiStore((s) => s.newFolderRequested);
  const newFileTargetDir = useUiStore((s) => s.newFileTargetDir);
  const newFolderTargetDir = useUiStore((s) => s.newFolderTargetDir);
  const requestNewFile = useUiStore((s) => s.requestNewFile);
  const requestNewFolder = useUiStore((s) => s.requestNewFolder);
  const contextMenu = useUiStore((s) => s.contextMenu);
  const clearContextMenu = useUiStore((s) => s.clearContextMenu);
  const deleteConfirmPath = useUiStore((s) => s.deleteConfirmPath);
  const clearDeleteConfirm = useUiStore((s) => s.clearDeleteConfirm);

  async function handleRefresh() {
    if (!tree) return;
    const updated = await fileTree(tree.path);
    setTree(updated);
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirmPath) return;
    await fileDelete(deleteConfirmPath);
    clearDeleteConfirm();
    if (tree) {
      const updated = await fileTree(tree.path);
      setTree(updated);
    }
  }

  return (
    <div data-testid="file-explorer" className="group flex h-full flex-col bg-crucible-sidebar">
      <div className="flex items-center px-4 py-2">
        <span className="flex-1 text-xs uppercase tracking-wider text-crucible-text-dim">
          Explorer
        </span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            data-testid="icon-new-file"
            title="New File"
            onClick={() => requestNewFile()}
            className="p-0.5 text-crucible-text-dim hover:text-crucible-text"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9 1H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5L9 1zm0 1.5L12.5 6H9V2.5zM7.5 9H8v1.5h1.5v1H8V13H7v-1.5H5.5v-1H7V9h.5z" />
            </svg>
          </button>
          <button
            data-testid="icon-new-folder"
            title="New Folder"
            onClick={() => requestNewFolder()}
            className="p-0.5 text-crucible-text-dim hover:text-crucible-text"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14.5 3H7.707l-1-1H1.5A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3zM8.5 10H7v1.5H6V10H4.5V9H6V7.5h1V9h1.5v1z" />
            </svg>
          </button>
          <button
            data-testid="icon-refresh"
            title="Refresh Explorer"
            onClick={handleRefresh}
            className="p-0.5 text-crucible-text-dim hover:text-crucible-text"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335-.43-.719-.821-1.186-1.121C9.705 3.844 8.542 3.5 7 3.5c-2.722 0-4.944 1.678-5.803 4H2.4C3.237 5.267 4.998 4 7 4c1.29 0 2.312.35 3.111.853.435.277.75.544 1.008.774l-1.154.88 2.841.962.006-.005-.001-.003.64-3.852zM2.549 10.391l.579.939 1.068-.812.076-.094c.335.43.719.821 1.186 1.121C6.295 12.156 7.458 12.5 9 12.5c2.722 0 4.944-1.678 5.803-4h-1.203C12.763 10.733 11.002 12 9 12c-1.29 0-2.312-.35-3.111-.853a5.194 5.194 0 0 1-1.008-.774l1.154-.88-2.841-.962-.006.005.001.003-.64 3.852z" />
            </svg>
          </button>
          <button
            data-testid="icon-collapse-all"
            title="Collapse All"
            onClick={collapseAll}
            className="p-0.5 text-crucible-text-dim hover:text-crucible-text"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9 9H4v1h5V9zm3-5H4v1h8V4zM4 7h8V6H4v1zm0 6l3-3H4v3zm8-3H8.5l3 3V10z" />
            </svg>
          </button>
        </div>
      </div>
      {newFileRequested && tree && <NewFileInput rootPath={newFileTargetDir ?? tree.path} />}
      {newFolderRequested && tree && <NewFolderInput rootPath={newFolderTargetDir ?? tree.path} />}
      <div className="flex-1 overflow-y-auto">
        <FileTree tree={tree} />
      </div>
      {contextMenu && tree && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetPath={contextMenu.targetPath}
          isDir={contextMenu.isDir}
          projectRoot={tree.path}
          onClose={clearContextMenu}
        />
      )}
      {deleteConfirmPath && (
        <DeleteConfirmDialog
          targetPath={deleteConfirmPath}
          onConfirm={handleDeleteConfirm}
          onCancel={clearDeleteConfirm}
        />
      )}
    </div>
  );
}

export default FileExplorer;
