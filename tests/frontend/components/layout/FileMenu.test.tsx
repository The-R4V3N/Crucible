import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useFileStore } from "@/stores/fileStore";
import { useUiStore } from "@/stores/uiStore";
import MenuBar from "@/components/layout/MenuBar";

// --- Hoisted mocks ---
const mockShellOpen = vi.hoisted(() => vi.fn());
const mockDialogOpen = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockDialogSave = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockWindowClose = vi.hoisted(() => vi.fn());
const mockFileWrite = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@tauri-apps/plugin-shell", () => ({ open: mockShellOpen }));
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: mockDialogOpen,
  save: mockDialogSave,
}));
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ close: mockWindowClose }),
}));
vi.mock("@/lib/ipc", () => ({
  fileWrite: mockFileWrite,
  configSave: vi.fn().mockResolvedValue(undefined),
}));

function openFileMenu() {
  fireEvent.click(screen.getByTestId("menu-file"));
}

describe("MenuBar — File button", () => {
  it("File button is enabled", () => {
    render(<MenuBar />);
    expect(screen.getByTestId("menu-file")).not.toBeDisabled();
  });
});

describe("MenuBar — File dropdown items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFileStore.setState({
      tree: null,
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
      saveRequest: 0,
      revertRequest: 0,
    });
    useUiStore.setState({ terminalActions: null });
  });

  it("File dropdown is hidden by default", () => {
    render(<MenuBar />);
    expect(screen.queryByTestId("file-dropdown")).not.toBeInTheDocument();
  });

  it("clicking File opens the dropdown", () => {
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-dropdown")).toBeInTheDocument();
  });

  it("renders New File item", () => {
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-new-file")).toBeInTheDocument();
  });

  it("renders Open File item", () => {
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-open-file")).toBeInTheDocument();
  });

  it("renders Open Folder item", () => {
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-open-folder")).toBeInTheDocument();
  });

  it("renders Save item", () => {
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-save")).toBeInTheDocument();
  });

  it("renders Save As item", () => {
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-save-as")).toBeInTheDocument();
  });

  it("renders Revert File item", () => {
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-revert")).toBeInTheDocument();
  });

  it("renders Close Editor Tab item", () => {
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-close-editor")).toBeInTheDocument();
  });

  it("renders New Terminal item", () => {
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-new-terminal")).toBeInTheDocument();
  });

  it("renders Close Terminal Tab item", () => {
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-close-terminal")).toBeInTheDocument();
  });

  it("renders Exit item", () => {
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-exit")).toBeInTheDocument();
  });
});

describe("MenuBar — File actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFileStore.setState({
      tree: null,
      openFiles: [{ path: "/tmp/a.ts", name: "a.ts", isDirty: false }],
      activeFilePath: "/tmp/a.ts",
      expandedDirs: new Set(),
      saveRequest: 0,
      revertRequest: 0,
    });
    useUiStore.setState({
      terminalActions: { addTab: vi.fn(), closeActiveTab: vi.fn() },
    });
  });

  it("New File requests new file in explorer without a dialog", () => {
    render(<MenuBar />);
    openFileMenu();
    fireEvent.click(screen.getByTestId("file-item-new-file"));
    expect(mockDialogSave).not.toHaveBeenCalled();
    expect(useUiStore.getState().newFileRequested).toBe(true);
    expect(useUiStore.getState().explorerVisible).toBe(true);
  });

  it("Open File opens file dialog", async () => {
    render(<MenuBar />);
    openFileMenu();
    fireEvent.click(screen.getByTestId("file-item-open-file"));
    expect(mockDialogOpen).toHaveBeenCalledOnce();
  });

  it("Open Folder opens directory dialog", async () => {
    render(<MenuBar />);
    openFileMenu();
    fireEvent.click(screen.getByTestId("file-item-open-folder"));
    expect(mockDialogOpen).toHaveBeenCalledWith(
      expect.objectContaining({ directory: true }),
    );
  });

  it("Save triggers fileStore.triggerSave", () => {
    render(<MenuBar />);
    openFileMenu();
    fireEvent.click(screen.getByTestId("file-item-save"));
    expect(useFileStore.getState().saveRequest).toBe(1);
  });

  it("Save As opens save dialog", async () => {
    render(<MenuBar />);
    openFileMenu();
    fireEvent.click(screen.getByTestId("file-item-save-as"));
    expect(mockDialogSave).toHaveBeenCalledOnce();
  });

  it("Revert File triggers fileStore.triggerRevert", () => {
    render(<MenuBar />);
    openFileMenu();
    fireEvent.click(screen.getByTestId("file-item-revert"));
    expect(useFileStore.getState().revertRequest).toBe(1);
  });

  it("Close Editor Tab closes the active file", () => {
    render(<MenuBar />);
    openFileMenu();
    fireEvent.click(screen.getByTestId("file-item-close-editor"));
    expect(useFileStore.getState().activeFilePath).toBeNull();
  });

  it("New Terminal calls terminalActions.addTab", () => {
    const addTab = vi.fn();
    useUiStore.setState({ terminalActions: { addTab, closeActiveTab: vi.fn() } });
    render(<MenuBar />);
    openFileMenu();
    fireEvent.click(screen.getByTestId("file-item-new-terminal"));
    expect(addTab).toHaveBeenCalledOnce();
  });

  it("Close Terminal Tab calls terminalActions.closeActiveTab", () => {
    const closeActiveTab = vi.fn();
    useUiStore.setState({ terminalActions: { addTab: vi.fn(), closeActiveTab } });
    render(<MenuBar />);
    openFileMenu();
    fireEvent.click(screen.getByTestId("file-item-close-terminal"));
    expect(closeActiveTab).toHaveBeenCalledOnce();
  });

  it("Exit calls appWindow.close", () => {
    render(<MenuBar />);
    openFileMenu();
    fireEvent.click(screen.getByTestId("file-item-exit"));
    expect(mockWindowClose).toHaveBeenCalledOnce();
  });

  it("Close Editor Tab is disabled when no file is active", () => {
    useFileStore.setState({ activeFilePath: null });
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-close-editor")).toBeDisabled();
  });

  it("Save is disabled when no file is active", () => {
    useFileStore.setState({ activeFilePath: null });
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-save")).toBeDisabled();
  });

  it("Revert File is disabled when no file is active", () => {
    useFileStore.setState({ activeFilePath: null });
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-revert")).toBeDisabled();
  });

  it("Save As is disabled when no file is active", () => {
    useFileStore.setState({ activeFilePath: null });
    render(<MenuBar />);
    openFileMenu();
    expect(screen.getByTestId("file-item-save-as")).toBeDisabled();
  });
});
