import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { useFileStore } from "@/stores/fileStore";
import FileExplorer from "@/components/explorer/FileExplorer";

const mockDirCreate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockFileTree = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    name: "project",
    path: "/home/user/project",
    is_dir: true,
    children: [],
  }),
);

vi.mock("@/lib/ipc", () => ({
  fileWrite: vi.fn().mockResolvedValue(undefined),
  dirCreate: mockDirCreate,
  fileTree: mockFileTree,
}));

const ROOT = "/home/user/project";

describe("FileExplorer — inline new folder input", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({
      newFileRequested: false,
      newFolderRequested: false,
      explorerVisible: true,
    });
    useFileStore.setState({
      tree: { name: "project", path: ROOT, is_dir: true, children: [] },
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
      saveRequest: 0,
      revertRequest: 0,
    });
  });

  it("does NOT show folder input when newFolderRequested is false", () => {
    render(<FileExplorer />);
    expect(screen.queryByTestId("new-folder-input")).not.toBeInTheDocument();
  });

  it("shows folder input when newFolderRequested is true", () => {
    useUiStore.setState({ newFolderRequested: true });
    render(<FileExplorer />);
    expect(screen.getByTestId("new-folder-input")).toBeInTheDocument();
  });

  it("folder input is focused when it appears", async () => {
    useUiStore.setState({ newFolderRequested: true });
    render(<FileExplorer />);
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId("new-folder-input"));
    });
  });

  it("pressing Enter with a name calls dirCreate with correct path", async () => {
    useUiStore.setState({ newFolderRequested: true });
    render(<FileExplorer />);
    const input = screen.getByTestId("new-folder-input");
    fireEvent.change(input, { target: { value: "my-folder" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(mockDirCreate).toHaveBeenCalledWith(`${ROOT}/my-folder`);
    });
  });

  it("pressing Enter refreshes the file tree", async () => {
    useUiStore.setState({ newFolderRequested: true });
    render(<FileExplorer />);
    const input = screen.getByTestId("new-folder-input");
    fireEvent.change(input, { target: { value: "my-folder" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(mockFileTree).toHaveBeenCalledWith(ROOT);
    });
  });

  it("pressing Enter clears newFolderRequested", async () => {
    useUiStore.setState({ newFolderRequested: true });
    render(<FileExplorer />);
    const input = screen.getByTestId("new-folder-input");
    fireEvent.change(input, { target: { value: "my-folder" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(useUiStore.getState().newFolderRequested).toBe(false);
    });
  });

  it("pressing Escape cancels without creating a folder", () => {
    useUiStore.setState({ newFolderRequested: true });
    render(<FileExplorer />);
    const input = screen.getByTestId("new-folder-input");
    fireEvent.change(input, { target: { value: "my-folder" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(mockDirCreate).not.toHaveBeenCalled();
    expect(useUiStore.getState().newFolderRequested).toBe(false);
  });

  it("pressing Enter with empty name does nothing", () => {
    useUiStore.setState({ newFolderRequested: true });
    render(<FileExplorer />);
    const input = screen.getByTestId("new-folder-input");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockDirCreate).not.toHaveBeenCalled();
    expect(useUiStore.getState().newFolderRequested).toBe(true);
  });
});
