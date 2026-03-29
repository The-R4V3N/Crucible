import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { useFileStore } from "@/stores/fileStore";
import FileExplorer from "@/components/explorer/FileExplorer";

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
  dirCreate: vi.fn().mockResolvedValue(undefined),
  fileTree: mockFileTree,
}));

const ROOT = "/home/user/project";

describe("FileExplorer — header action icons", () => {
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
      expandedDirs: new Set([`${ROOT}/src`, `${ROOT}/tests`]),
      saveRequest: 0,
      revertRequest: 0,
    });
  });

  it("renders all four action icons", () => {
    render(<FileExplorer />);
    expect(screen.getByTestId("icon-new-file")).toBeInTheDocument();
    expect(screen.getByTestId("icon-new-folder")).toBeInTheDocument();
    expect(screen.getByTestId("icon-refresh")).toBeInTheDocument();
    expect(screen.getByTestId("icon-collapse-all")).toBeInTheDocument();
  });

  it("all icons have tooltip titles", () => {
    render(<FileExplorer />);
    expect(screen.getByTitle("New File")).toBeInTheDocument();
    expect(screen.getByTitle("New Folder")).toBeInTheDocument();
    expect(screen.getByTitle("Refresh Explorer")).toBeInTheDocument();
    expect(screen.getByTitle("Collapse All")).toBeInTheDocument();
  });

  it("clicking New File icon calls requestNewFile", () => {
    render(<FileExplorer />);
    fireEvent.click(screen.getByTestId("icon-new-file"));
    expect(useUiStore.getState().newFileRequested).toBe(true);
  });

  it("clicking New Folder icon sets newFolderRequested", () => {
    render(<FileExplorer />);
    fireEvent.click(screen.getByTestId("icon-new-folder"));
    expect(useUiStore.getState().newFolderRequested).toBe(true);
  });

  it("clicking Refresh calls fileTree and updates the store", async () => {
    render(<FileExplorer />);
    fireEvent.click(screen.getByTestId("icon-refresh"));
    await waitFor(() => {
      expect(mockFileTree).toHaveBeenCalledWith(ROOT);
    });
    await waitFor(() => {
      expect(useFileStore.getState().tree).not.toBeNull();
    });
  });

  it("clicking Collapse All clears expandedDirs", () => {
    render(<FileExplorer />);
    expect(useFileStore.getState().expandedDirs.size).toBe(2);
    fireEvent.click(screen.getByTestId("icon-collapse-all"));
    expect(useFileStore.getState().expandedDirs.size).toBe(0);
  });
});
