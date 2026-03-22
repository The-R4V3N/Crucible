import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Shortcuts from "@/components/sidebar/Shortcuts";

describe("Shortcuts", () => {
  it("renders shortcuts panel", () => {
    render(<Shortcuts />);
    expect(screen.getByTestId("shortcuts-panel")).toBeInTheDocument();
  });

  it("shows Ctrl+B shortcut", () => {
    render(<Shortcuts />);
    expect(screen.getByText("Ctrl+B")).toBeInTheDocument();
    expect(screen.getByText("Toggle sidebar")).toBeInTheDocument();
  });

  it("shows F-key shortcuts", () => {
    render(<Shortcuts />);
    expect(screen.getByText("F1")).toBeInTheDocument();
  });
});
