import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/ipc", () => ({
  fileSearch: vi.fn().mockResolvedValue([
    { path: "src/main.ts", line: 5, content: "console.log('hello')" },
    { path: "src/lib.ts", line: 12, content: "function hello() {" },
  ]),
}));

import { fileSearch } from "@/lib/ipc";
import SearchPanel from "@/components/search/SearchPanel";

const mockFileSearch = vi.mocked(fileSearch);

describe("SearchPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input", () => {
    render(<SearchPanel projectPath="/tmp" onResultClick={() => {}} />);
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("shows results after typing", async () => {
    render(<SearchPanel projectPath="/tmp" onResultClick={() => {}} />);
    const input = screen.getByTestId("search-input");
    fireEvent.change(input, { target: { value: "hello" } });
    await waitFor(() => {
      expect(screen.getByText("src/main.ts")).toBeInTheDocument();
    });
  });

  it("calls fileSearch with query", async () => {
    render(<SearchPanel projectPath="/tmp" onResultClick={() => {}} />);
    const input = screen.getByTestId("search-input");
    fireEvent.change(input, { target: { value: "hello" } });
    await waitFor(() => {
      expect(mockFileSearch).toHaveBeenCalledWith("/tmp", "hello");
    });
  });

  it("clicking result calls onResultClick", async () => {
    const onClick = vi.fn();
    render(<SearchPanel projectPath="/tmp" onResultClick={onClick} />);
    const input = screen.getByTestId("search-input");
    fireEvent.change(input, { target: { value: "hello" } });
    await waitFor(() => {
      expect(screen.getByText("src/main.ts")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("src/main.ts"));
    expect(onClick).toHaveBeenCalledWith("src/main.ts", 5);
  });

  it("shows no results message for empty search", () => {
    render(<SearchPanel projectPath="/tmp" onResultClick={() => {}} />);
    expect(screen.getByText("Type to search")).toBeInTheDocument();
  });
});
