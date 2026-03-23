import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import TabBar from "@/components/layout/TabBar";

describe("TabBar", () => {
  beforeEach(() => {
    useUiStore.setState({ activeView: "terminal" });
  });

  it("renders Terminal, Editor, and Diff tabs", () => {
    render(<TabBar />);
    expect(screen.getByText("Terminal")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Diff")).toBeInTheDocument();
  });

  it("highlights active tab", () => {
    render(<TabBar />);
    const terminalTab = screen.getByTestId("tab-terminal");
    expect(terminalTab.className).toContain("border-warp-accent");
  });

  it("clicking Editor tab switches active view", () => {
    render(<TabBar />);
    fireEvent.click(screen.getByText("Editor"));
    expect(useUiStore.getState().activeView).toBe("editor");
  });

  it("clicking Diff tab switches active view", () => {
    render(<TabBar />);
    fireEvent.click(screen.getByText("Diff"));
    expect(useUiStore.getState().activeView).toBe("diff");
  });
});
