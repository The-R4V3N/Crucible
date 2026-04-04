import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import ActivityBar from "@/components/layout/ActivityBar";

vi.mock("@/lib/ipc", () => ({}));

describe("ActivityBar — settings button", () => {
  beforeEach(() => {
    useUiStore.setState({ settingsOpen: false, activePanel: null });
  });

  it("settings button is not disabled", () => {
    render(<ActivityBar />);
    expect(screen.getByTestId("activity-settings")).not.toBeDisabled();
  });

  it("clicking settings button sets settingsOpen to true", () => {
    render(<ActivityBar />);
    fireEvent.click(screen.getByTestId("activity-settings"));
    expect(useUiStore.getState().settingsOpen).toBe(true);
  });
});
