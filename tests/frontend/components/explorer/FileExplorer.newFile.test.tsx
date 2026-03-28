import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { useFileStore } from "@/stores/fileStore";
import FileExplorer from "@/components/explorer/FileExplorer";

const mockFileWrite = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/ipc", () => ({
  fileWrite: mockFileWrite,
}));

const ROOT = "/home/user/project";

describe("FileExplorer — inline new file input", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ newFileRequested: false, explorerVisible: true });
    useFileStore.setState({
      tree: {
        name: "project",
        path: ROOT,
        is_dir: true,
        children: [],
      },
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
      saveRequest: 0,
      revertRequest: 0,
    });
  });

  it("does NOT show inline input when newFileRequested is false", () => {
    render(<FileExplorer />);
    expect(screen.queryByTestId("new-file-input")).not.toBeInTheDocument();
  });

  it("shows inline input when newFileRequested is true", () => {
    useUiStore.setState({ newFileRequested: true });
    render(<FileExplorer />);
    expect(screen.getByTestId("new-file-input")).toBeInTheDocument();
  });

  it("input is focused when it appears", async () => {
    useUiStore.setState({ newFileRequested: true });
    render(<FileExplorer />);
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId("new-file-input"));
    });
  });

  it("pressing Enter with a filename creates the file", async () => {
    useUiStore.setState({ newFileRequested: true });
    render(<FileExplorer />);
    const input = screen.getByTestId("new-file-input");
    fireEvent.change(input, { target: { value: "hello.ts" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(mockFileWrite).toHaveBeenCalledWith(`${ROOT}/hello.ts`, "");
    });
  });

  it("pressing Enter opens the new file in the editor", async () => {
    useUiStore.setState({ newFileRequested: true });
    render(<FileExplorer />);
    const input = screen.getByTestId("new-file-input");
    fireEvent.change(input, { target: { value: "hello.ts" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      const { openFiles, activeFilePath } = useFileStore.getState();
      expect(activeFilePath).toBe(`${ROOT}/hello.ts`);
      expect(openFiles.some((f) => f.path === `${ROOT}/hello.ts`)).toBe(true);
    });
  });

  it("pressing Enter clears newFileRequested", async () => {
    useUiStore.setState({ newFileRequested: true });
    render(<FileExplorer />);
    const input = screen.getByTestId("new-file-input");
    fireEvent.change(input, { target: { value: "hello.ts" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(useUiStore.getState().newFileRequested).toBe(false);
    });
  });

  it("pressing Escape cancels without creating a file", async () => {
    useUiStore.setState({ newFileRequested: true });
    render(<FileExplorer />);
    const input = screen.getByTestId("new-file-input");
    fireEvent.change(input, { target: { value: "hello.ts" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(mockFileWrite).not.toHaveBeenCalled();
    expect(useUiStore.getState().newFileRequested).toBe(false);
  });

  it("pressing Enter with empty name does nothing", async () => {
    useUiStore.setState({ newFileRequested: true });
    render(<FileExplorer />);
    const input = screen.getByTestId("new-file-input");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockFileWrite).not.toHaveBeenCalled();
    expect(useUiStore.getState().newFileRequested).toBe(true);
  });
});
