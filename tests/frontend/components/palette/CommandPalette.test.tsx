import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { usePaletteStore } from "@/stores/paletteStore";
import { useFileStore } from "@/stores/fileStore";
import { useUiStore } from "@/stores/uiStore";
import CommandPalette from "@/components/palette/CommandPalette";

const mockExecuteOne = vi.fn();
const mockExecuteTwo = vi.fn();
const mockExecuteThree = vi.fn();

vi.mock("@/lib/commandRegistry", () => ({
  getCommands: () => [
    {
      id: "cmd.one",
      label: "Toggle Sidebar",
      keybinding: "Ctrl+B",
      execute: mockExecuteOne,
    },
    {
      id: "cmd.two",
      label: "Split Vertical",
      keybinding: "Ctrl+\\",
      execute: mockExecuteTwo,
    },
    { id: "cmd.three", label: "Switch to Editor", execute: mockExecuteThree },
  ],
}));

describe("CommandPalette — closed", () => {
  beforeEach(() => {
    usePaletteStore.setState({
      open: false,
      mode: "command",
      query: "",
      activeIndex: 0,
    });
  });

  it("renders nothing when palette is closed", () => {
    render(<CommandPalette />);
    expect(screen.queryByTestId("palette-backdrop")).not.toBeInTheDocument();
  });
});

describe("CommandPalette — command mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePaletteStore.setState({
      open: true,
      mode: "command",
      query: "",
      activeIndex: 0,
    });
  });

  it("renders the backdrop when open", () => {
    render(<CommandPalette />);
    expect(screen.getByTestId("palette-backdrop")).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(<CommandPalette />);
    expect(screen.getByTestId("palette-input")).toBeInTheDocument();
  });

  it("renders all command labels", () => {
    render(<CommandPalette />);
    expect(screen.getByText("Toggle Sidebar")).toBeInTheDocument();
    expect(screen.getByText("Split Vertical")).toBeInTheDocument();
    expect(screen.getByText("Switch to Editor")).toBeInTheDocument();
  });

  it("renders keybinding hints", () => {
    render(<CommandPalette />);
    expect(screen.getByText("Ctrl+B")).toBeInTheDocument();
  });

  it("filters commands as query is typed", () => {
    render(<CommandPalette />);
    fireEvent.change(screen.getByTestId("palette-input"), {
      target: { value: "split" },
    });
    expect(screen.getByText("Split Vertical")).toBeInTheDocument();
    expect(screen.queryByText("Toggle Sidebar")).not.toBeInTheDocument();
  });

  it("shows empty message when nothing matches", () => {
    render(<CommandPalette />);
    fireEvent.change(screen.getByTestId("palette-input"), {
      target: { value: "zzznomatch" },
    });
    expect(screen.getByTestId("palette-empty")).toBeInTheDocument();
  });

  it("pressing Escape closes the palette", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(screen.getByTestId("palette-input"), { key: "Escape" });
    expect(usePaletteStore.getState().open).toBe(false);
  });

  it("pressing ArrowDown increments activeIndex", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(screen.getByTestId("palette-input"), {
      key: "ArrowDown",
    });
    expect(usePaletteStore.getState().activeIndex).toBe(1);
  });

  it("pressing ArrowDown does not exceed list length", () => {
    usePaletteStore.setState({ activeIndex: 2 }); // last item of 3
    render(<CommandPalette />);
    fireEvent.keyDown(screen.getByTestId("palette-input"), {
      key: "ArrowDown",
    });
    expect(usePaletteStore.getState().activeIndex).toBe(2);
  });

  it("pressing ArrowUp decrements activeIndex", () => {
    usePaletteStore.setState({ activeIndex: 2 });
    render(<CommandPalette />);
    fireEvent.keyDown(screen.getByTestId("palette-input"), { key: "ArrowUp" });
    expect(usePaletteStore.getState().activeIndex).toBe(1);
  });

  it("pressing ArrowUp does not go below 0", () => {
    usePaletteStore.setState({ activeIndex: 0 });
    render(<CommandPalette />);
    fireEvent.keyDown(screen.getByTestId("palette-input"), { key: "ArrowUp" });
    expect(usePaletteStore.getState().activeIndex).toBe(0);
  });

  it("pressing Enter executes the active command and closes palette", () => {
    usePaletteStore.setState({ activeIndex: 0 });
    render(<CommandPalette />);
    fireEvent.keyDown(screen.getByTestId("palette-input"), { key: "Enter" });
    expect(mockExecuteOne).toHaveBeenCalledOnce();
    expect(usePaletteStore.getState().open).toBe(false);
  });

  it("clicking backdrop closes the palette", () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTestId("palette-backdrop"));
    expect(usePaletteStore.getState().open).toBe(false);
  });

  it("clicking inside container does not close the palette", () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTestId("palette-container"));
    expect(usePaletteStore.getState().open).toBe(true);
  });

  it("active item has aria-selected attribute", () => {
    usePaletteStore.setState({ activeIndex: 1 });
    render(<CommandPalette />);
    const items = screen.getAllByRole("option");
    expect(items[1]).toHaveAttribute("aria-selected", "true");
    expect(items[0]).toHaveAttribute("aria-selected", "false");
  });
});

describe("CommandPalette — file mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePaletteStore.setState({
      open: true,
      mode: "file",
      query: "",
      activeIndex: 0,
    });
    useFileStore.setState({
      openFiles: [
        { path: "/src/App.tsx", name: "App.tsx" },
        { path: "/src/main.ts", name: "main.ts" },
      ],
    });
    useUiStore.setState({ activeView: "terminal" });
  });

  it("renders open file names", () => {
    render(<CommandPalette />);
    expect(screen.getByText("App.tsx")).toBeInTheDocument();
    expect(screen.getByText("main.ts")).toBeInTheDocument();
  });

  it("filters files by name as query changes", () => {
    render(<CommandPalette />);
    fireEvent.change(screen.getByTestId("palette-input"), {
      target: { value: "App" },
    });
    expect(screen.getByText("App.tsx")).toBeInTheDocument();
    expect(screen.queryByText("main.ts")).not.toBeInTheDocument();
  });

  it("shows empty message when no files match query", () => {
    render(<CommandPalette />);
    fireEvent.change(screen.getByTestId("palette-input"), {
      target: { value: "zzz" },
    });
    expect(screen.getByTestId("palette-empty")).toBeInTheDocument();
  });

  it("pressing Enter on a file opens it, switches to editor, and closes palette", () => {
    usePaletteStore.setState({ activeIndex: 0 });
    render(<CommandPalette />);
    fireEvent.keyDown(screen.getByTestId("palette-input"), { key: "Enter" });
    expect(useFileStore.getState().activeFilePath).toBe("/src/App.tsx");
    expect(useUiStore.getState().activeView).toBe("editor");
    expect(usePaletteStore.getState().open).toBe(false);
  });
});
