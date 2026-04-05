import { useState, useRef, useEffect } from "react";
import { open as shellOpen } from "@tauri-apps/plugin-shell";
import { open as dialogOpen, save as dialogSave } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import ShortcutsModal from "@/components/help/ShortcutsModal";
import AboutModal from "@/components/help/AboutModal";
import { useFileStore } from "@/stores/fileStore";
import { useUiStore } from "@/stores/uiStore";
import { useConfigStore } from "@/stores/configStore";
import { usePaletteStore } from "@/stores/paletteStore";
import { fileWrite, configSave } from "@/lib/ipc";

const DOCS_URL = "https://github.com/The-R4V3N/Crucible#readme";
const ISSUES_URL = "https://github.com/The-R4V3N/Crucible/issues";

type OpenMenu = "file" | "edit" | "help" | null;

function useMenuRef(isOpen: boolean, onClose: () => void): React.RefObject<HTMLDivElement | null> {
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
  const triggerFind = useFileStore((s) => s.triggerFind);
  const terminalActions = useUiStore((s) => s.terminalActions);
  const addProject = useConfigStore((s) => s.addProject);

  const toggle = (menu: OpenMenu) => setOpenMenu((prev) => (prev === menu ? null : menu));

  const close = () => setOpenMenu(null);

  const fileRef = useMenuRef(openMenu === "file", close);
  const editRef = useMenuRef(openMenu === "edit", close);
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

  // --- Edit actions ---

  function handleFindInFile() {
    close();
    triggerFind();
  }

  function handleFindInProject() {
    close();
    useUiStore.getState().togglePanel("search");
  }

  function handleCommandPalette() {
    close();
    usePaletteStore.getState().openCommandPalette();
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
        className="flex items-center h-6 px-1 bg-crucible-sidebar border-b border-crucible-border text-xs select-none"
      >
        {/* File */}
        <div ref={fileRef} className="relative">
          <button
            data-testid="menu-file"
            onClick={() => toggle("file")}
            className={`px-2 py-0.5 transition-colors ${
              openMenu === "file"
                ? "bg-crucible-accent/20 text-crucible-accent"
                : "text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-bg/50"
            }`}
          >
            File
          </button>

          {openMenu === "file" && (
            <div
              data-testid="file-dropdown"
              className="absolute left-0 top-full mt-0.5 w-56 rounded border border-crucible-border bg-crucible-bg shadow-xl z-50 py-1"
            >
              <button
                data-testid="file-item-new-file"
                onClick={handleNewFile}
                className="menu-item w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                New File…
              </button>
              <button
                data-testid="file-item-open-file"
                onClick={handleOpenFile}
                className="menu-item w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                Open File…
              </button>
              <button
                data-testid="file-item-open-folder"
                onClick={handleOpenFolder}
                className="menu-item w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                Open Folder…
              </button>
              <div className="my-1 border-t border-crucible-border/60" />
              <button
                data-testid="file-item-save"
                onClick={handleSave}
                disabled={!hasFile}
                className="menu-item w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                data-testid="file-item-save-as"
                onClick={handleSaveAs}
                disabled={!hasFile}
                className="menu-item w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save As…
              </button>
              <button
                data-testid="file-item-revert"
                onClick={handleRevert}
                disabled={!hasFile}
                className="menu-item w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Revert File
              </button>
              <button
                data-testid="file-item-close-editor"
                onClick={handleCloseEditor}
                disabled={!hasFile}
                className="menu-item w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Close Editor Tab
              </button>
              <div className="my-1 border-t border-crucible-border/60" />
              <button
                data-testid="file-item-new-terminal"
                onClick={handleNewTerminal}
                className="menu-item w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                New Terminal
              </button>
              <button
                data-testid="file-item-close-terminal"
                onClick={handleCloseTerminal}
                className="menu-item w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                Close Terminal Tab
              </button>
              <div className="my-1 border-t border-crucible-border/60" />
              <button
                data-testid="file-item-exit"
                onClick={handleExit}
                className="menu-item w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                Exit
              </button>
            </div>
          )}
        </div>

        {/* Edit */}
        <div ref={editRef} className="relative">
          <button
            data-testid="menu-edit"
            onClick={() => toggle("edit")}
            className={`px-2 py-0.5 transition-colors ${
              openMenu === "edit"
                ? "bg-crucible-accent/20 text-crucible-accent"
                : "text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-bg/50"
            }`}
          >
            Edit
          </button>

          {openMenu === "edit" && (
            <div
              data-testid="edit-dropdown"
              className="absolute left-0 top-full mt-0.5 w-64 rounded border border-crucible-border bg-crucible-bg shadow-xl z-50 py-1"
            >
              <button
                data-testid="edit-item-find-in-file"
                onClick={handleFindInFile}
                disabled={!hasFile}
                className="menu-item w-full text-left px-4 py-1.5 flex items-center justify-between text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Find in File</span>
                <span className="text-crucible-text-dim/60 text-[10px]">Ctrl+F</span>
              </button>
              <button
                data-testid="edit-item-find-in-project"
                onClick={handleFindInProject}
                className="menu-item w-full text-left px-4 py-1.5 flex items-center justify-between text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                <span>Find in Project</span>
                <span className="text-crucible-text-dim/60 text-[10px]">Ctrl+Shift+F</span>
              </button>
              <div className="my-1 border-t border-crucible-border/60" />
              <button
                data-testid="edit-item-command-palette"
                onClick={handleCommandPalette}
                className="menu-item w-full text-left px-4 py-1.5 flex items-center justify-between text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                <span>Command Palette</span>
                <span className="text-crucible-text-dim/60 text-[10px]">Ctrl+Shift+P</span>
              </button>
            </div>
          )}
        </div>

        {/* Help */}
        <div ref={helpRef} className="relative">
          <button
            data-testid="menu-help"
            onClick={() => toggle("help")}
            className={`px-2 py-0.5 transition-colors ${
              openMenu === "help"
                ? "bg-crucible-accent/20 text-crucible-accent"
                : "text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-bg/50"
            }`}
          >
            Help
          </button>

          {openMenu === "help" && (
            <div
              data-testid="help-dropdown"
              className="absolute left-0 top-full mt-0.5 w-52 rounded border border-crucible-border bg-crucible-bg shadow-xl z-50 py-1"
            >
              <button
                data-testid="help-item-shortcuts"
                onClick={handleShortcuts}
                className="w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                Keyboard Shortcuts
              </button>
              <div className="my-1 border-t border-crucible-border/60" />
              <button
                data-testid="help-item-docs"
                onClick={handleDocs}
                className="w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                View Documentation
              </button>
              <button
                data-testid="help-item-issue"
                onClick={handleIssue}
                className="w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                Report an Issue
              </button>
              <div className="my-1 border-t border-crucible-border/60" />
              <button
                data-testid="help-item-about"
                onClick={handleAbout}
                className="w-full text-left px-4 py-1.5 text-crucible-text-dim hover:text-crucible-text hover:bg-crucible-sidebar transition-colors"
              >
                About Crucible
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
