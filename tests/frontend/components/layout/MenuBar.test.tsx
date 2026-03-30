import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { usePaletteStore } from "@/stores/paletteStore";
import { useFileStore } from "@/stores/fileStore";
import MenuBar from "@/components/layout/MenuBar";

const mockOpenUrl = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/plugin-shell", () => ({
  open: mockOpenUrl,
}));

describe("MenuBar — labels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders File, Edit and Help labels", () => {
    render(<MenuBar />);
    expect(screen.getByTestId("menu-file")).toBeInTheDocument();
    expect(screen.getByTestId("menu-edit")).toBeInTheDocument();
    expect(screen.getByTestId("menu-help")).toBeInTheDocument();
  });

  it("Edit menu item is not disabled", () => {
    render(<MenuBar />);
    expect(screen.getByTestId("menu-edit")).not.toBeDisabled();
  });
});

describe("MenuBar — Edit dropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ activePanel: null });
    usePaletteStore.setState({ open: false, mode: "command", query: "", activeIndex: 0 });
    useFileStore.setState({
      tree: null,
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
      saveRequest: 0,
      revertRequest: 0,
      findRequest: 0,
    });
  });

  it("Edit dropdown is hidden by default", () => {
    render(<MenuBar />);
    expect(screen.queryByTestId("edit-dropdown")).not.toBeInTheDocument();
  });

  it("clicking Edit opens the dropdown", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-edit"));
    expect(screen.getByTestId("edit-dropdown")).toBeInTheDocument();
  });

  it("dropdown shows Find in File item", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-edit"));
    expect(screen.getByTestId("edit-item-find-in-file")).toBeInTheDocument();
  });

  it("dropdown shows Find in Project item", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-edit"));
    expect(screen.getByTestId("edit-item-find-in-project")).toBeInTheDocument();
  });

  it("dropdown shows Command Palette item", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-edit"));
    expect(screen.getByTestId("edit-item-command-palette")).toBeInTheDocument();
  });

  it("Find in File is disabled when no file is open", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-edit"));
    expect(screen.getByTestId("edit-item-find-in-file")).toBeDisabled();
  });

  it("Find in File is enabled when a file is open", () => {
    useFileStore.setState({
      activeFilePath: "/tmp/a.ts",
      openFiles: [{ path: "/tmp/a.ts", name: "a.ts" }],
    });
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-edit"));
    expect(screen.getByTestId("edit-item-find-in-file")).not.toBeDisabled();
  });

  it("clicking Find in File increments findRequest", () => {
    useFileStore.setState({
      activeFilePath: "/tmp/a.ts",
      openFiles: [{ path: "/tmp/a.ts", name: "a.ts" }],
    });
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-edit"));
    fireEvent.click(screen.getByTestId("edit-item-find-in-file"));
    expect(useFileStore.getState().findRequest).toBe(1);
  });

  it("clicking Find in Project opens search panel", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-edit"));
    fireEvent.click(screen.getByTestId("edit-item-find-in-project"));
    expect(useUiStore.getState().activePanel).toBe("search");
  });

  it("clicking Command Palette opens palette in command mode", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-edit"));
    fireEvent.click(screen.getByTestId("edit-item-command-palette"));
    expect(usePaletteStore.getState().open).toBe(true);
    expect(usePaletteStore.getState().mode).toBe("command");
  });

  it("clicking Edit again closes the dropdown", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-edit"));
    fireEvent.click(screen.getByTestId("menu-edit"));
    expect(screen.queryByTestId("edit-dropdown")).not.toBeInTheDocument();
  });
});

describe("MenuBar — Help dropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Help dropdown is hidden by default", () => {
    render(<MenuBar />);
    expect(screen.queryByTestId("help-dropdown")).not.toBeInTheDocument();
  });

  it("clicking Help opens the dropdown", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-help"));
    expect(screen.getByTestId("help-dropdown")).toBeInTheDocument();
  });

  it("dropdown shows Keyboard Shortcuts item", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-help"));
    expect(screen.getByTestId("help-item-shortcuts")).toBeInTheDocument();
  });

  it("dropdown shows About WARP item", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-help"));
    expect(screen.getByTestId("help-item-about")).toBeInTheDocument();
  });

  it("dropdown shows View Documentation item", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-help"));
    expect(screen.getByTestId("help-item-docs")).toBeInTheDocument();
  });

  it("dropdown shows Report an Issue item", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-help"));
    expect(screen.getByTestId("help-item-issue")).toBeInTheDocument();
  });

  it("clicking Help again toggles the dropdown closed", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-help"));
    fireEvent.click(screen.getByTestId("menu-help"));
    expect(screen.queryByTestId("help-dropdown")).not.toBeInTheDocument();
  });

  it("clicking View Documentation calls openUrl", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-help"));
    fireEvent.click(screen.getByTestId("help-item-docs"));
    expect(mockOpenUrl).toHaveBeenCalledOnce();
  });

  it("clicking Report an Issue calls openUrl", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-help"));
    fireEvent.click(screen.getByTestId("help-item-issue"));
    expect(mockOpenUrl).toHaveBeenCalledOnce();
  });

  it("clicking outside the dropdown closes it", () => {
    render(
      <div>
        <MenuBar />
        <div data-testid="outside">outside</div>
      </div>,
    );
    fireEvent.click(screen.getByTestId("menu-help"));
    expect(screen.getByTestId("help-dropdown")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByTestId("help-dropdown")).not.toBeInTheDocument();
  });
});

describe("MenuBar — modals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ShortcutsModal is not visible initially", () => {
    render(<MenuBar />);
    expect(screen.queryByTestId("shortcuts-modal")).not.toBeInTheDocument();
  });

  it("clicking Keyboard Shortcuts opens ShortcutsModal", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-help"));
    fireEvent.click(screen.getByTestId("help-item-shortcuts"));
    expect(screen.getByTestId("shortcuts-modal")).toBeInTheDocument();
  });

  it("AboutModal is not visible initially", () => {
    render(<MenuBar />);
    expect(screen.queryByTestId("about-modal")).not.toBeInTheDocument();
  });

  it("clicking About WARP opens AboutModal", () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByTestId("menu-help"));
    fireEvent.click(screen.getByTestId("help-item-about"));
    expect(screen.getByTestId("about-modal")).toBeInTheDocument();
  });
});
