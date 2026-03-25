import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TitleBar from "@/components/layout/TitleBar";

// Mock Tauri window API
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
  }),
}));

describe("TitleBar", () => {
  it("renders WARP branding", () => {
    render(<TitleBar />);
    expect(screen.getByText("WARP")).toBeInTheDocument();
  });

  it("renders window control buttons", () => {
    render(<TitleBar />);
    expect(screen.getByLabelText("Minimize")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximize")).toBeInTheDocument();
    expect(screen.getByLabelText("Close")).toBeInTheDocument();
  });

  it("has drag region attribute", () => {
    render(<TitleBar />);
    const dragRegion = screen.getByTestId("titlebar-drag-region");
    expect(dragRegion).toHaveAttribute("data-tauri-drag-region");
  });

  it("close button has distinct hover styling", () => {
    render(<TitleBar />);
    const closeBtn = screen.getByLabelText("Close");
    expect(closeBtn.className).toContain("hover:bg-red");
  });
});
