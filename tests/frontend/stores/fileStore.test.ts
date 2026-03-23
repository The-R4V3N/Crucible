import { describe, it, expect, beforeEach } from "vitest";
import { useFileStore } from "@/stores/fileStore";
import type { FileNode } from "@/lib/ipc";

const mockTree: FileNode = {
  name: "project",
  path: "/tmp/project",
  is_dir: true,
  children: [
    { name: "src", path: "/tmp/project/src", is_dir: true, children: [
      { name: "main.ts", path: "/tmp/project/src/main.ts", is_dir: false, children: [] },
    ]},
    { name: "README.md", path: "/tmp/project/README.md", is_dir: false, children: [] },
  ],
};

describe("fileStore", () => {
  beforeEach(() => {
    useFileStore.setState({
      tree: null,
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
    });
  });

  it("initial state has no tree", () => {
    const state = useFileStore.getState();
    expect(state.tree).toBeNull();
    expect(state.openFiles).toEqual([]);
    expect(state.activeFilePath).toBeNull();
  });

  it("setTree stores the file tree", () => {
    useFileStore.getState().setTree(mockTree);
    expect(useFileStore.getState().tree).toEqual(mockTree);
  });

  it("openFile adds file to open files and sets active", () => {
    useFileStore.getState().openFile("/tmp/project/README.md", "README.md");
    const state = useFileStore.getState();
    expect(state.openFiles).toHaveLength(1);
    expect(state.openFiles[0]?.path).toBe("/tmp/project/README.md");
    expect(state.activeFilePath).toBe("/tmp/project/README.md");
  });

  it("openFile does not duplicate already open files", () => {
    useFileStore.getState().openFile("/tmp/project/README.md", "README.md");
    useFileStore.getState().openFile("/tmp/project/README.md", "README.md");
    expect(useFileStore.getState().openFiles).toHaveLength(1);
  });

  it("openFile sets active to the newly opened file", () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    useFileStore.getState().openFile("/tmp/b.ts", "b.ts");
    expect(useFileStore.getState().activeFilePath).toBe("/tmp/b.ts");
  });

  it("closeFile removes file from open files", () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    useFileStore.getState().openFile("/tmp/b.ts", "b.ts");
    useFileStore.getState().closeFile("/tmp/a.ts");
    expect(useFileStore.getState().openFiles).toHaveLength(1);
    expect(useFileStore.getState().openFiles[0]?.path).toBe("/tmp/b.ts");
  });

  it("closeFile switches active to next file", () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    useFileStore.getState().openFile("/tmp/b.ts", "b.ts");
    useFileStore.getState().setActiveFile("/tmp/a.ts");
    useFileStore.getState().closeFile("/tmp/a.ts");
    expect(useFileStore.getState().activeFilePath).toBe("/tmp/b.ts");
  });

  it("closeFile sets active to null when last file closed", () => {
    useFileStore.getState().openFile("/tmp/a.ts", "a.ts");
    useFileStore.getState().closeFile("/tmp/a.ts");
    expect(useFileStore.getState().activeFilePath).toBeNull();
  });

  it("toggleDir adds and removes from expanded set", () => {
    useFileStore.getState().toggleDir("/tmp/src");
    expect(useFileStore.getState().expandedDirs.has("/tmp/src")).toBe(true);
    useFileStore.getState().toggleDir("/tmp/src");
    expect(useFileStore.getState().expandedDirs.has("/tmp/src")).toBe(false);
  });
});
