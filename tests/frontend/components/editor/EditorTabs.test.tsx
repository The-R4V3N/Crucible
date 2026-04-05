import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useFileStore } from "@/stores/fileStore";
import EditorTabs from "@/components/editor/EditorTabs";

describe("EditorTabs", () => {
  beforeEach(() => {
    useFileStore.setState({
      tree: null,
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
    });
  });

  it("renders nothing when no files are open", () => {
    const { container } = render(<EditorTabs />);
    expect(container.querySelector("[data-testid='editor-tabs']")?.children).toHaveLength(0);
  });

  it("renders tabs for open files", () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    useFileStore.getState().openFile("/tmp/b.ts", "b.ts");
    render(<EditorTabs />);
    expect(screen.getByText("a.ts")).toBeInTheDocument();
    expect(screen.getByText("b.ts")).toBeInTheDocument();
  });

  it("highlights active tab", () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    useFileStore.getState().openFile("/tmp/b.ts", "b.ts");
    render(<EditorTabs />);
    const activeTab = screen.getByTestId("tab-/tmp/b.ts");
    expect(activeTab.className).toContain("border-crucible-accent");
  });

  it("clicking tab switches active file", () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    useFileStore.getState().openFile("/tmp/b.ts", "b.ts");
    render(<EditorTabs />);
    fireEvent.click(screen.getByText("a.ts"));
    expect(useFileStore.getState().activeFilePath).toBe("/tmp/a.ts");
  });

  it("clicking close button removes tab", () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    render(<EditorTabs />);
    fireEvent.click(screen.getByTestId("close-/tmp/a.ts"));
    expect(useFileStore.getState().openFiles).toHaveLength(0);
  });

  it("shows dirty indicator dot when file is dirty", () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    useFileStore.getState().markDirty("/tmp/a.ts");
    render(<EditorTabs />);
    expect(screen.getByTestId("dirty-/tmp/a.ts")).toBeInTheDocument();
  });

  it("does not show dirty indicator when file is clean", () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    render(<EditorTabs />);
    expect(screen.queryByTestId("dirty-/tmp/a.ts")).not.toBeInTheDocument();
  });

  it("close button is hidden by default via opacity-0 class", () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    render(<EditorTabs />);
    const closeBtn = screen.getByTestId("close-/tmp/a.ts");
    expect(closeBtn.className).toContain("opacity-0");
  });
});
