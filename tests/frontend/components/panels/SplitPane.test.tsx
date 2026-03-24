import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SplitPane from "@/components/panels/SplitPane";

describe("SplitPane", () => {
  it("renders two children panes", () => {
    render(
      <SplitPane orientation="vertical">
        <div data-testid="pane-a">A</div>
        <div data-testid="pane-b">B</div>
      </SplitPane>,
    );
    expect(screen.getByTestId("pane-a")).toBeInTheDocument();
    expect(screen.getByTestId("pane-b")).toBeInTheDocument();
  });

  it("renders a divider between panes", () => {
    render(
      <SplitPane orientation="vertical">
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    expect(screen.getByTestId("split-divider")).toBeInTheDocument();
  });

  it("supports vertical orientation", () => {
    render(
      <SplitPane orientation="vertical">
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const container = screen.getByTestId("split-pane");
    expect(container.className).toContain("flex-row");
  });

  it("supports horizontal orientation", () => {
    render(
      <SplitPane orientation="horizontal">
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const container = screen.getByTestId("split-pane");
    expect(container.className).toContain("flex-col");
  });

  it("applies initial split ratio", () => {
    render(
      <SplitPane orientation="vertical" initialRatio={0.3}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const firstPane = screen.getByTestId("split-first");
    expect(firstPane.style.flexBasis).toBe("30%");
  });

  it("defaults to 50% split ratio", () => {
    render(
      <SplitPane orientation="vertical">
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const firstPane = screen.getByTestId("split-first");
    expect(firstPane.style.flexBasis).toBe("50%");
  });

  it("renders nothing with fewer than 2 children", () => {
    const { container } = render(
      <SplitPane orientation="vertical">
        <div>A</div>
      </SplitPane>,
    );
    expect(container.querySelector("[data-testid='split-divider']")).toBeNull();
  });
});
