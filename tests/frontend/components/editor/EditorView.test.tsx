import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useFileStore } from "@/stores/fileStore";

// Mock Monaco editor
vi.mock("@monaco-editor/react", () => ({
  default: vi.fn(({ value, language }: { value: string; language: string }) => (
    <div data-testid="monaco-editor" data-language={language}>
      {value}
    </div>
  )),
}));

// Mock file read IPC
vi.mock("@/lib/ipc", () => ({
  fileRead: vi.fn().mockResolvedValue("file content here"),
  fileWrite: vi.fn().mockResolvedValue(undefined),
}));

import EditorView from "@/components/editor/EditorView";

describe("EditorView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFileStore.setState({
      tree: null,
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
    });
  });

  it("shows placeholder when no file is active", () => {
    render(<EditorView />);
    expect(screen.getByTestId("editor-placeholder")).toBeInTheDocument();
  });

  it("renders Monaco editor when a file is active", async () => {
    useFileStore.getState().openFile("/tmp/test.ts", "test.ts");
    render(<EditorView />);
    // Monaco mock should render
    expect(await screen.findByTestId("monaco-editor")).toBeInTheDocument();
  });

  it("renders editor tabs", () => {
    useFileStore.getState().openFile("/tmp/test.ts", "test.ts");
    render(<EditorView />);
    expect(screen.getByTestId("editor-tabs")).toBeInTheDocument();
  });
});
