import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SettingsKeyboard from "@/components/settings/SettingsKeyboard";

vi.mock("@/lib/ipc", () => ({}));

describe("SettingsKeyboard", () => {
  it("renders the keyboard shortcuts table", () => {
    render(<SettingsKeyboard />);
    expect(screen.getByTestId("settings-page-keyboard")).toBeInTheDocument();
  });

  it("shows column headers: Action, Shortcut, Scope", () => {
    render(<SettingsKeyboard />);
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Shortcut")).toBeInTheDocument();
    expect(screen.getByText("Scope")).toBeInTheDocument();
  });

  it("renders at least one shortcut row", () => {
    render(<SettingsKeyboard />);
    const rows = screen.getAllByTestId(/^shortcut-row-/);
    expect(rows.length).toBeGreaterThan(0);
  });
});
