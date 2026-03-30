import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import ActivityBar from "@/components/layout/ActivityBar";

describe("ActivityBar", () => {
  beforeEach(() => {
    useUiStore.setState({ activePanel: null });
  });

  it("renders all four icon buttons", () => {
    render(<ActivityBar />);
    expect(screen.getByTestId("activity-explorer")).toBeInTheDocument();
    expect(screen.getByTestId("activity-search")).toBeInTheDocument();
    expect(screen.getByTestId("activity-source-control")).toBeInTheDocument();
    expect(screen.getByTestId("activity-settings")).toBeInTheDocument();
  });

  it("all icons have correct title tooltips", () => {
    render(<ActivityBar />);
    expect(screen.getByTitle("Explorer")).toBeInTheDocument();
    expect(screen.getByTitle("Search")).toBeInTheDocument();
    expect(screen.getByTitle("Source Control")).toBeInTheDocument();
    expect(screen.getByTitle("Settings")).toBeInTheDocument();
  });

  it("clicking Explorer sets activePanel to explorer", () => {
    render(<ActivityBar />);
    fireEvent.click(screen.getByTestId("activity-explorer"));
    expect(useUiStore.getState().activePanel).toBe("explorer");
  });

  it("clicking Explorer again toggles activePanel to null", () => {
    useUiStore.setState({ activePanel: "explorer" });
    render(<ActivityBar />);
    fireEvent.click(screen.getByTestId("activity-explorer"));
    expect(useUiStore.getState().activePanel).toBeNull();
  });

  it("clicking Search sets activePanel to search", () => {
    render(<ActivityBar />);
    fireEvent.click(screen.getByTestId("activity-search"));
    expect(useUiStore.getState().activePanel).toBe("search");
  });

  it("clicking Source Control sets activePanel to source-control", () => {
    render(<ActivityBar />);
    fireEvent.click(screen.getByTestId("activity-source-control"));
    expect(useUiStore.getState().activePanel).toBe("source-control");
  });

  it("clicking a different panel switches from current", () => {
    useUiStore.setState({ activePanel: "explorer" });
    render(<ActivityBar />);
    fireEvent.click(screen.getByTestId("activity-search"));
    expect(useUiStore.getState().activePanel).toBe("search");
  });

  it("Settings button is disabled", () => {
    render(<ActivityBar />);
    expect(screen.getByTestId("activity-settings")).toBeDisabled();
  });

  it("Explorer icon has accent class when activePanel is explorer", () => {
    useUiStore.setState({ activePanel: "explorer" });
    render(<ActivityBar />);
    expect(screen.getByTestId("activity-explorer")).toHaveClass("text-warp-accent");
  });

  it("Explorer icon has dim class when activePanel is not explorer", () => {
    useUiStore.setState({ activePanel: null });
    render(<ActivityBar />);
    expect(screen.getByTestId("activity-explorer")).toHaveClass("text-warp-text-dim");
  });

  it("Search icon has accent class when activePanel is search", () => {
    useUiStore.setState({ activePanel: "search" });
    render(<ActivityBar />);
    expect(screen.getByTestId("activity-search")).toHaveClass("text-warp-accent");
  });

  it("Source Control icon has accent class when activePanel is source-control", () => {
    useUiStore.setState({ activePanel: "source-control" });
    render(<ActivityBar />);
    expect(screen.getByTestId("activity-source-control")).toHaveClass("text-warp-accent");
  });

  it("no badge shown when changedFiles is 0", () => {
    render(<ActivityBar changedFiles={0} />);
    expect(screen.queryByTestId("source-control-badge")).not.toBeInTheDocument();
  });

  it("no badge shown when changedFiles is omitted", () => {
    render(<ActivityBar />);
    expect(screen.queryByTestId("source-control-badge")).not.toBeInTheDocument();
  });

  it("badge shows count when changedFiles is greater than 0", () => {
    render(<ActivityBar changedFiles={3} />);
    expect(screen.getByTestId("source-control-badge")).toBeInTheDocument();
    expect(screen.getByTestId("source-control-badge")).toHaveTextContent("3");
  });

  it("badge shows 99+ when changedFiles exceeds 99", () => {
    render(<ActivityBar changedFiles={120} />);
    expect(screen.getByTestId("source-control-badge")).toHaveTextContent("99+");
  });

  it("badge shows exactly 99 when changedFiles is 99", () => {
    render(<ActivityBar changedFiles={99} />);
    expect(screen.getByTestId("source-control-badge")).toHaveTextContent("99");
  });
});
