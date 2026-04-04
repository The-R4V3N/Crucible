import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useConfigStore } from "@/stores/configStore";
import SettingsAppearance from "@/components/settings/SettingsAppearance";

const mockConfigSave = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock("@/lib/ipc", () => ({ configSave: mockConfigSave }));

const MOCK_CONFIG = {
  projects: [],
  theme: "dark",
  accent_color: "#00E5FF",
  font_family: "Cascadia Code",
  font_size: 14,
  sidebar_width: 240,
  notifications: { visual: true, border_glow: true, sound: false },
  active_project: null,
  branch_prefix: "feature/",
  ui_zoom: 1.0,
  sidebar_position: "left",
  cursor_style: "bar",
  terminal_theme: "dark",
  divider_color: "#1E1E2E",
  default_project_path: "",
  shell_command: "powershell.exe",
};

describe("SettingsAppearance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConfigStore.setState({ config: MOCK_CONFIG, isLoaded: true });
  });

  it("renders accent color input", () => {
    render(<SettingsAppearance />);
    expect(screen.getByTestId("setting-accent-color")).toBeInTheDocument();
  });

  it("shows current accent color", () => {
    render(<SettingsAppearance />);
    // color inputs normalize hex to lowercase
    expect(screen.getByTestId("setting-accent-color")).toHaveValue("#00e5ff");
  });

  it("renders UI zoom select", () => {
    render(<SettingsAppearance />);
    expect(screen.getByTestId("setting-ui-zoom")).toBeInTheDocument();
  });

  it("renders sidebar position select", () => {
    render(<SettingsAppearance />);
    expect(screen.getByTestId("setting-sidebar-position")).toBeInTheDocument();
  });

  it("shows current sidebar position", () => {
    render(<SettingsAppearance />);
    expect(screen.getByTestId("setting-sidebar-position")).toHaveValue("left");
  });

  it("changing accent color calls configSave", async () => {
    render(<SettingsAppearance />);
    const input = screen.getByTestId("setting-accent-color");
    fireEvent.change(input, { target: { value: "#ff0000" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({ accent_color: "#ff0000" }),
      );
    });
  });

  it("changing ui zoom calls configSave", async () => {
    render(<SettingsAppearance />);
    const select = screen.getByTestId("setting-ui-zoom");
    fireEvent.change(select, { target: { value: "1.25" } });
    await waitFor(() => {
      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({ ui_zoom: 1.25 }),
      );
    });
  });

  it("changing sidebar position calls configSave", async () => {
    render(<SettingsAppearance />);
    const select = screen.getByTestId("setting-sidebar-position");
    fireEvent.change(select, { target: { value: "right" } });
    await waitFor(() => {
      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({ sidebar_position: "right" }),
      );
    });
  });
});
