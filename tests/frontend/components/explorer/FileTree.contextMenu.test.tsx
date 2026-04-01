import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { useFileStore } from "@/stores/fileStore";
import FileExplorer from "@/components/explorer/FileExplorer";

const mockFileDelete = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockFileRename = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockFileTree = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    name: "project",
    path: "/home/user/project",
    is_dir: true,
    children: [],
  }),
);

vi.mock("@/lib/ipc", () => ({
  fileDelete: mockFileDelete,
  fileRename: mockFileRename,
  fileTree: mockFileTree,
  fileWrite: vi.fn().mockResolvedValue(undefined),
  dirCreate: vi.fn().mockResolvedValue(undefined),
}));

const ROOT = "/home/user/project";

const MOCK_TREE = {
  name: "project",
  path: ROOT,
  is_dir: true,
  children: [
    { name: "src", path: `${ROOT}/src`, is_dir: true, children: [] },
    { name: "main.ts", path: `${ROOT}/main.ts`, is_dir: false, children: [] },
  ],
};

describe("FileTree — context menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({
      newFileRequested: false,
      newFolderRequested: false,
      contextMenu: null,
      renameTargetPath: null,
      deleteConfirmPath: null,
      explorerVisible: true,
    });
    useFileStore.setState({
      tree: MOCK_TREE,
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
      saveRequest: 0,
      revertRequest: 0,
    });
  });

  it("right-clicking a file node shows the context menu", () => {
    render(<FileExplorer />);
    fireEvent.contextMenu(screen.getByText("main.ts"));
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
  });

  it("context menu shows Rename and Delete for any node", () => {
    render(<FileExplorer />);
    fireEvent.contextMenu(screen.getByText("main.ts"));
    expect(screen.getByText("Rename")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("context menu shows Copy Path and Copy Relative Path for any node", () => {
    render(<FileExplorer />);
    fireEvent.contextMenu(screen.getByText("main.ts"));
    expect(screen.getByText("Copy Path")).toBeInTheDocument();
    expect(screen.getByText("Copy Relative Path")).toBeInTheDocument();
  });

  it("New File and New Folder appear only for directories", () => {
    render(<FileExplorer />);
    fireEvent.contextMenu(screen.getByText("src"));
    expect(screen.getByText("New File")).toBeInTheDocument();
    expect(screen.getByText("New Folder")).toBeInTheDocument();
  });

  it("New File and New Folder do NOT appear for files", () => {
    render(<FileExplorer />);
    fireEvent.contextMenu(screen.getByText("main.ts"));
    expect(screen.queryByText("New File")).not.toBeInTheDocument();
    expect(screen.queryByText("New Folder")).not.toBeInTheDocument();
  });

  it("clicking outside the context menu closes it", async () => {
    render(<FileExplorer />);
    fireEvent.contextMenu(screen.getByText("main.ts"));
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
    });
  });

  it("clicking Rename sets renameTargetPath and closes menu", async () => {
    render(<FileExplorer />);
    fireEvent.contextMenu(screen.getByText("main.ts"));
    fireEvent.click(screen.getByText("Rename"));
    await waitFor(() => {
      expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
      expect(useUiStore.getState().renameTargetPath).toBe(`${ROOT}/main.ts`);
    });
  });

  it("rename input appears when renameTargetPath matches a node", () => {
    useUiStore.setState({ renameTargetPath: `${ROOT}/main.ts` });
    render(<FileExplorer />);
    expect(screen.getByTestId("rename-input")).toBeInTheDocument();
  });

  it("rename input is pre-filled with the current filename", () => {
    useUiStore.setState({ renameTargetPath: `${ROOT}/main.ts` });
    render(<FileExplorer />);
    expect(screen.getByTestId("rename-input")).toHaveValue("main.ts");
  });

  it("pressing Enter on rename input calls fileRename with new path", async () => {
    useUiStore.setState({ renameTargetPath: `${ROOT}/main.ts` });
    render(<FileExplorer />);
    const input = screen.getByTestId("rename-input");
    fireEvent.change(input, { target: { value: "renamed.ts" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(mockFileRename).toHaveBeenCalledWith(`${ROOT}/main.ts`, `${ROOT}/renamed.ts`);
    });
  });

  it("pressing Enter on rename clears renameTargetPath", async () => {
    useUiStore.setState({ renameTargetPath: `${ROOT}/main.ts` });
    render(<FileExplorer />);
    const input = screen.getByTestId("rename-input");
    fireEvent.change(input, { target: { value: "renamed.ts" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(useUiStore.getState().renameTargetPath).toBeNull();
    });
  });

  it("pressing Escape on rename cancels without calling fileRename", () => {
    useUiStore.setState({ renameTargetPath: `${ROOT}/main.ts` });
    render(<FileExplorer />);
    const input = screen.getByTestId("rename-input");
    fireEvent.change(input, { target: { value: "other.ts" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(mockFileRename).not.toHaveBeenCalled();
    expect(useUiStore.getState().renameTargetPath).toBeNull();
  });

  it("clicking Delete sets deleteConfirmPath and closes menu", async () => {
    render(<FileExplorer />);
    fireEvent.contextMenu(screen.getByText("main.ts"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => {
      expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
      expect(useUiStore.getState().deleteConfirmPath).toBe(`${ROOT}/main.ts`);
    });
  });

  it("delete confirmation dialog appears when deleteConfirmPath is set", () => {
    useUiStore.setState({ deleteConfirmPath: `${ROOT}/main.ts` });
    render(<FileExplorer />);
    expect(screen.getByTestId("delete-confirm-dialog")).toBeInTheDocument();
  });

  it("confirming delete calls fileDelete and clears deleteConfirmPath", async () => {
    useUiStore.setState({ deleteConfirmPath: `${ROOT}/main.ts` });
    render(<FileExplorer />);
    fireEvent.click(screen.getByTestId("delete-confirm-button"));
    await waitFor(() => {
      expect(mockFileDelete).toHaveBeenCalledWith(`${ROOT}/main.ts`);
      expect(useUiStore.getState().deleteConfirmPath).toBeNull();
    });
  });

  it("cancelling delete does not call fileDelete", () => {
    useUiStore.setState({ deleteConfirmPath: `${ROOT}/main.ts` });
    render(<FileExplorer />);
    fireEvent.click(screen.getByTestId("delete-cancel-button"));
    expect(mockFileDelete).not.toHaveBeenCalled();
    expect(useUiStore.getState().deleteConfirmPath).toBeNull();
  });

  it("Copy Path writes the absolute path to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<FileExplorer />);
    fireEvent.contextMenu(screen.getByText("main.ts"));
    fireEvent.click(screen.getByText("Copy Path"));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`${ROOT}/main.ts`);
    });
  });

  it("Copy Relative Path writes the path relative to project root", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<FileExplorer />);
    fireEvent.contextMenu(screen.getByText("main.ts"));
    fireEvent.click(screen.getByText("Copy Relative Path"));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("main.ts");
    });
  });
});
