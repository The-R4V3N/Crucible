import { useState, useRef, useEffect } from "react";
import { open as shellOpen } from "@tauri-apps/plugin-shell";
import { open as dialogOpen, save as dialogSave } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import ShortcutsModal from "@/components/help/ShortcutsModal";
import AboutModal from "@/components/help/AboutModal";
import { useFileStore } from "@/stores/fileStore";
import { useUiStore } from "@/stores/uiStore";
import { useConfigStore } from "@/stores/configStore";
import { fileWrite, configSave } from "@/lib/ipc";

const DOCS_URL = "https://github.com/The-R4V3N/WARP#readme";
const ISSUES_URL = "https://github.com/The-R4V3N/WARP/issues";

type OpenMenu = "file" | "help" | null;

function useMenuRef(
  isOpen: boolean,
  onClose: () => void,
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);
  return ref;
}

function MenuBar() {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const activeFilePath = useFileStore((s) => s.activeFilePath);
  const closeFile = useFileStore((s) => s.closeFile);
  const openFile = useFileStore((s) => s.openFile);
  const triggerSave = useFileStore((s) => s.triggerSave);
  const triggerRevert = useFileStore((s) => s.triggerRevert);
  const terminalActions = useUiStore((s) => s.terminalActions);
  const addProject = useConfigStore((s) => s.addProject);

  const toggle = (menu: OpenMenu) =>
    setOpenMenu((prev) => (prev === menu ? null : menu));

  const close = () => setOpenMenu(null);

  const fileRef = useMenuRef(openMenu === "file", close);
  const helpRef = useMenuRef(openMenu === "help", close);

  // --- File actions ---

  function handleNewFile() {
    close();
    useUiStore.getState().requestNewFile();
    useUiStore.getState().setSidebarVisible(true);
    useUiStore.getState().setExplorerVisible(true);
  }

  async function handleOpenFile() {
    close();
    const selected = await dialogOpen({ directory: false, multiple: false, title: "Open File" });
    if (!selected || typeof selected !== "string") return;
    const name = selected.replace(/\\/g, "/").split("/").pop() ?? selected;
    openFile(selected, name);
    useUiStore.getState().setActiveView("editor");
  }

  async function handleOpenFolder() {
    close();
    const selected = await dialogOpen({ directory: true, multiple: false, title: "Open Folder" });
    if (!selected || typeof selected !== "string") return;
    const name = selected.replace(/\\/g, "/").split("/").pop() ?? selected;
    addProject(name, selected);
    requestAnimationFrame(() => {
      const config = useConfigStore.getState().config;
      if (config) configSave(config).catch(() => {});
    });
  }

  function handleSave() {
    close();
    triggerSave();
  }

  async function handleSaveAs() {
    close();
    if (!activeFilePath) return;
    const path = await dialogSave({ title: "Save As" });
    if (!path || typeof path !== "string") return;
    await fileWrite(path, "");
    const name = path.replace(/\\/g, "/").split("/").pop() ?? path;
    openFile(path, name);
    useUiStore.getState().setActiveView("editor");
  }

  function handleRevert() {
    close();
    triggerRevert();
  }

  function handleCloseEditor() {
    close();
    if (activeFilePath) closeFile(activeFilePath);
  }

  function handleNewTerminal() {
    close();
    terminalActions?.addTab();
  }

  function handleCloseTerminal() {
    close();
    terminalActions?.closeActiveTab();
  }

  function handleExit() {
    close();
    getCurrentWindow().close();
  }

  // --- Help actions ---

  function handleDocs() {
    close();
    shellOpen(DOCS_URL);
  }

  function handleIssue() {
    close();
    shellOpen(ISSUES_URL);
  }

  function handleShortcuts() {
    close();
    setShortcutsOpen(true);
  }

  function handleAbout() {
    close();
    setAboutOpen(true);
  }

  const hasFile = !!activeFilePath;

  return (
    <>
      <div
        data-testid="menu-bar"
        className="flex items-center h-6 px-1 bg-warp-sidebar border-b border-warp-border text-xs select-none"
      >
        {/* File */}
        <div ref={fileRef} className="relative">
          <button
            data-testid="menu-file"
            onClick={() => toggle("file")}
            className={`px-2 py-0.5 transition-colors ${
              openMenu === "file"
                ? "bg-warp-accent/20 text-warp-accent"
                : "text-warp-text-dim hover:text-warp-text hover:bg-warp-bg/50"
            }`}
          >
            File
          </button>

          {openMenu === "file" && (
            <div
              data-testid="file-dropdown"
              className="absolute left-0 top-full mt-0.5 w-56 rounded border border-warp-border bg-warp-bg shadow-xl z-50 py-1"
            >
              <button data-testid="file-item-new-file" onClick={handleNewFile}
                className="menu-item w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors">
                New File…
              </button>
              <button data-testid="file-item-open-file" onClick={handleOpenFile}
                className="menu-item w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors">
                Open File…
              </button>
              <button data-testid="file-item-open-folder" onClick={handleOpenFolder}
                className="menu-item w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors">
                Open Folder…
              </button>
              <div className="my-1 border-t border-warp-border/60" />
              <button data-testid="file-item-save" onClick={handleSave} disabled={!hasFile}
                className="menu-item w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Save
              </button>
              <button data-testid="file-item-save-as" onClick={handleSaveAs} disabled={!hasFile}
                className="menu-item w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Save As…
              </button>
              <button data-testid="file-item-revert" onClick={handleRevert} disabled={!hasFile}
                className="menu-item w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Revert File
              </button>
              <button data-testid="file-item-close-editor" onClick={handleCloseEditor} disabled={!hasFile}
                className="menu-item w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Close Editor Tab
              </button>
              <div className="my-1 border-t border-warp-border/60" />
              <button data-testid="file-item-new-terminal" onClick={handleNewTerminal}
                className="menu-item w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors">
                New Terminal
              </button>
              <button data-testid="file-item-close-terminal" onClick={handleCloseTerminal}
                className="menu-item w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors">
                Close Terminal Tab
              </button>
              <div className="my-1 border-t border-warp-border/60" />
              <button data-testid="file-item-exit" onClick={handleExit}
                className="menu-item w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors">
                Exit
              </button>
            </div>
          )}
        </div>

        {/* Edit — disabled until issue #45 */}
        <button
          data-testid="menu-edit"
          disabled
          className="px-2 py-0.5 text-warp-text-dim opacity-40 cursor-not-allowed"
        >
          Edit
        </button>

        {/* Help */}
        <div ref={helpRef} className="relative">
          <button
            data-testid="menu-help"
            onClick={() => toggle("help")}
            className={`px-2 py-0.5 transition-colors ${
              openMenu === "help"
                ? "bg-warp-accent/20 text-warp-accent"
                : "text-warp-text-dim hover:text-warp-text hover:bg-warp-bg/50"
            }`}
          >
            Help
          </button>

          {openMenu === "help" && (
            <div
              data-testid="help-dropdown"
              className="absolute left-0 top-full mt-0.5 w-52 rounded border border-warp-border bg-warp-bg shadow-xl z-50 py-1"
            >
              <button data-testid="help-item-shortcuts" onClick={handleShortcuts}
                className="w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors">
                Keyboard Shortcuts
              </button>
              <div className="my-1 border-t border-warp-border/60" />
              <button data-testid="help-item-docs" onClick={handleDocs}
                className="w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors">
                View Documentation
              </button>
              <button data-testid="help-item-issue" onClick={handleIssue}
                className="w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors">
                Report an Issue
              </button>
              <div className="my-1 border-t border-warp-border/60" />
              <button data-testid="help-item-about" onClick={handleAbout}
                className="w-full text-left px-4 py-1.5 text-warp-text-dim hover:text-warp-text hover:bg-warp-sidebar transition-colors">
                About WARP
              </button>
            </div>
          )}
        </div>
      </div>

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}

export default MenuBar;
