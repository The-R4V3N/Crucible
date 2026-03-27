import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useFileStore } from "@/stores/fileStore";
import FileTree from "@/components/explorer/FileTree";
import type { FileNode } from "@/lib/ipc";

const mockTree: FileNode = {
  name: "project",
  path: "/tmp/project",
  is_dir: true,
  children: [
    {
      name: "src",
      path: "/tmp/project/src",
      is_dir: true,
      children: [
        {
          name: "main.ts",
          path: "/tmp/project/src/main.ts",
          is_dir: false,
          children: [],
        },
      ],
    },
    {
      name: "README.md",
      path: "/tmp/project/README.md",
      is_dir: false,
      children: [],
    },
  ],
};

describe("FileTree", () => {
  beforeEach(() => {
    useFileStore.setState({
      tree: null,
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
    });
  });

  it("renders nothing when tree is null", () => {
    const { container } = render(<FileTree tree={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders root children", () => {
    render(<FileTree tree={mockTree} />);
    expect(screen.getByText("src")).toBeInTheDocument();
    expect(screen.getByText("README.md")).toBeInTheDocument();
  });

  it("clicking a directory toggles expansion", () => {
    render(<FileTree tree={mockTree} />);
    fireEvent.click(screen.getByText("src"));
    expect(useFileStore.getState().expandedDirs.has("/tmp/project/src")).toBe(
      true,
    );
  });

  it("clicking a file calls openFile", () => {
    render(<FileTree tree={mockTree} />);
    fireEvent.click(screen.getByText("README.md"));
    expect(useFileStore.getState().activeFilePath).toBe(
      "/tmp/project/README.md",
    );
  });

  it("shows children when directory is expanded", () => {
    useFileStore.setState({ expandedDirs: new Set(["/tmp/project/src"]) });
    render(<FileTree tree={mockTree} />);
    expect(screen.getByText("main.ts")).toBeInTheDocument();
  });
});
