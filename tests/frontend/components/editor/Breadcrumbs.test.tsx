import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useFileStore } from "@/stores/fileStore";
import Breadcrumbs from "@/components/editor/Breadcrumbs";

describe("Breadcrumbs", () => {
  beforeEach(() => {
    useFileStore.setState({
      tree: null,
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
    });
  });

  it("renders nothing when no file is active", () => {
    const { container } = render(<Breadcrumbs />);
    expect(container.firstChild).toBeNull();
  });

  it("renders path segments for the active file", () => {
    useFileStore.setState({
      activeFilePath: "/project/src/components/App.tsx",
      tree: { path: "/project", name: "project", is_dir: true, children: [] },
    });
    render(<Breadcrumbs />);
    expect(screen.getByText("src")).toBeInTheDocument();
    expect(screen.getByText("components")).toBeInTheDocument();
    expect(screen.getByText("App.tsx")).toBeInTheDocument();
  });

  it("uses forward slashes regardless of OS path separators", () => {
    useFileStore.setState({
      activeFilePath: "D:\\project\\src\\App.tsx",
      tree: { path: "D:\\project", name: "project", is_dir: true, children: [] },
    });
    render(<Breadcrumbs />);
    expect(screen.getByText("src")).toBeInTheDocument();
    expect(screen.getByText("App.tsx")).toBeInTheDocument();
  });

  it("shows the full path when tree root is not known", () => {
    useFileStore.setState({
      activeFilePath: "/project/src/App.tsx",
      tree: null,
    });
    render(<Breadcrumbs />);
    expect(screen.getByText("project")).toBeInTheDocument();
    expect(screen.getByText("src")).toBeInTheDocument();
    expect(screen.getByText("App.tsx")).toBeInTheDocument();
  });

  it("renders › separators between segments", () => {
    useFileStore.setState({
      activeFilePath: "/project/src/App.tsx",
      tree: { path: "/project", name: "project", is_dir: true, children: [] },
    });
    render(<Breadcrumbs />);
    const separators = screen.getAllByText("›");
    // "src" › "App.tsx" → one separator
    expect(separators).toHaveLength(1);
  });

  it("clicking a directory segment expands it in the file tree", () => {
    useFileStore.setState({
      activeFilePath: "/project/src/components/App.tsx",
      tree: { path: "/project", name: "project", is_dir: true, children: [] },
      expandedDirs: new Set(),
    });
    const toggleDir = vi.spyOn(useFileStore.getState(), "toggleDir");
    render(<Breadcrumbs />);
    fireEvent.click(screen.getByText("src"));
    expect(toggleDir).toHaveBeenCalledWith("/project/src");
  });

  it("does not expand a directory segment that is already expanded", () => {
    useFileStore.setState({
      activeFilePath: "/project/src/components/App.tsx",
      tree: { path: "/project", name: "project", is_dir: true, children: [] },
      expandedDirs: new Set(["/project/src"]),
    });
    const toggleDir = vi.spyOn(useFileStore.getState(), "toggleDir");
    render(<Breadcrumbs />);
    fireEvent.click(screen.getByText("src"));
    expect(toggleDir).not.toHaveBeenCalled();
  });

  it("last segment (filename) is not a button", () => {
    useFileStore.setState({
      activeFilePath: "/project/src/App.tsx",
      tree: { path: "/project", name: "project", is_dir: true, children: [] },
    });
    render(<Breadcrumbs />);
    const filename = screen.getByTestId("breadcrumb-filename");
    expect(filename.tagName).not.toBe("BUTTON");
  });

  it("updates when the active file changes", () => {
    useFileStore.setState({
      activeFilePath: "/project/src/App.tsx",
      tree: { path: "/project", name: "project", is_dir: true, children: [] },
    });
    const { rerender } = render(<Breadcrumbs />);
    expect(screen.getByText("App.tsx")).toBeInTheDocument();

    useFileStore.setState({ activeFilePath: "/project/src/main.ts" });
    rerender(<Breadcrumbs />);
    expect(screen.getByText("main.ts")).toBeInTheDocument();
    expect(screen.queryByText("App.tsx")).not.toBeInTheDocument();
  });
});
