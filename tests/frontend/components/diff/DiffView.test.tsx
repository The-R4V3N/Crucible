import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock Monaco diff editor
vi.mock("@monaco-editor/react", () => ({
  DiffEditor: vi.fn(({ original, modified }: { original: string; modified: string }) => (
    <div data-testid="monaco-diff-editor">
      <span data-testid="diff-original">{original}</span>
      <span data-testid="diff-modified">{modified}</span>
    </div>
  )),
  default: vi.fn(() => <div data-testid="monaco-editor" />),
}));

vi.mock("@/lib/ipc", () => ({
  gitDiff: vi.fn().mockResolvedValue({
    path: "test.ts",
    old_content: "old code",
    new_content: "new code",
  }),
}));

import DiffView from "@/components/diff/DiffView";

describe("DiffView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows placeholder when no file path given", () => {
    render(<DiffView repoPath="." filePath={null} />);
    expect(screen.getByTestId("diff-placeholder")).toBeInTheDocument();
  });

  it("renders diff editor when file path is provided", async () => {
    render(<DiffView repoPath="." filePath="test.ts" />);
    expect(await screen.findByTestId("monaco-diff-editor")).toBeInTheDocument();
  });

  it("displays old and new content", async () => {
    render(<DiffView repoPath="." filePath="test.ts" />);
    expect(await screen.findByTestId("diff-original")).toHaveTextContent("old code");
    expect(screen.getByTestId("diff-modified")).toHaveTextContent("new code");
  });
});
