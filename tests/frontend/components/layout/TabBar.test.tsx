import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import TabBar from "@/components/layout/TabBar";

describe("TabBar", () => {
  beforeEach(() => {
    useUiStore.setState({
      activeView: "terminal",
      tabOrder: ["terminal", "editor", "diff"],
      searchVisible: false,
    });
  });

  it("renders Terminal, Editor, and Diff tabs", () => {
    render(<TabBar onSearchToggle={() => {}} />);
    expect(screen.getByText("Terminal")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Diff")).toBeInTheDocument();
  });

  it("highlights active tab", () => {
    render(<TabBar onSearchToggle={() => {}} />);
    const terminalTab = screen.getByTestId("tab-terminal");
    expect(terminalTab.className).toContain("border-crucible-accent");
  });

  it("clicking Editor tab switches active view", () => {
    render(<TabBar onSearchToggle={() => {}} />);
    fireEvent.click(screen.getByText("Editor"));
    expect(useUiStore.getState().activeView).toBe("editor");
  });

  it("clicking Diff tab switches active view", () => {
    render(<TabBar onSearchToggle={() => {}} />);
    fireEvent.click(screen.getByText("Diff"));
    expect(useUiStore.getState().activeView).toBe("diff");
  });

  it("renders search icon button", () => {
    render(<TabBar onSearchToggle={() => {}} />);
    expect(screen.getByTestId("search-toggle")).toBeInTheDocument();
  });

  it("clicking search icon calls onSearchToggle", () => {
    const onToggle = vi.fn();
    render(<TabBar onSearchToggle={onToggle} />);
    fireEvent.click(screen.getByTestId("search-toggle"));
    expect(onToggle).toHaveBeenCalled();
  });

  it("renders tabs in custom order", () => {
    useUiStore.setState({ tabOrder: ["diff", "terminal", "editor"] });
    render(<TabBar onSearchToggle={() => {}} />);
    const tabs = screen.getAllByTestId(/^tab-(terminal|editor|diff)$/);
    expect(tabs[0]?.getAttribute("data-testid")).toBe("tab-diff");
    expect(tabs[1]?.getAttribute("data-testid")).toBe("tab-terminal");
    expect(tabs[2]?.getAttribute("data-testid")).toBe("tab-editor");
  });

  it("reorderTabs swaps tab positions", () => {
    useUiStore.getState().reorderTabs(0, 1);
    const order = useUiStore.getState().tabOrder;
    expect(order[0]).toBe("editor");
    expect(order[1]).toBe("terminal");
    expect(order[2]).toBe("diff");
  });
});
