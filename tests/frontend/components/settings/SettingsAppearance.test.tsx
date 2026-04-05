import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingsAppearance from "@/components/settings/SettingsAppearance";
import type { CrucibleConfig } from "@/stores/configStore";

const MOCK_CONFIG: CrucibleConfig = {
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
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
  });

  it("renders accent color input", () => {
    render(<SettingsAppearance config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-accent-color")).toBeInTheDocument();
  });

  it("shows current accent color", () => {
    render(<SettingsAppearance config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-accent-color")).toHaveValue("#00e5ff");
  });

  it("renders UI zoom select", () => {
    render(<SettingsAppearance config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-ui-zoom")).toBeInTheDocument();
  });

  it("shows current UI zoom value", () => {
    render(<SettingsAppearance config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-ui-zoom")).toHaveValue("1");
  });

  it("renders sidebar position select", () => {
    render(<SettingsAppearance config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-sidebar-position")).toBeInTheDocument();
  });

  it("shows current sidebar position", () => {
    render(<SettingsAppearance config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-sidebar-position")).toHaveValue("left");
  });

  it("calls onChange when accent color changes", () => {
    render(<SettingsAppearance config={MOCK_CONFIG} onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId("setting-accent-color"), {
      target: { value: "#ff0000" },
    });
    expect(mockOnChange).toHaveBeenCalledWith({ accent_color: "#ff0000" });
  });

  it("calls onChange when UI zoom changes", () => {
    render(<SettingsAppearance config={MOCK_CONFIG} onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId("setting-ui-zoom"), {
      target: { value: "1.25" },
    });
    expect(mockOnChange).toHaveBeenCalledWith({ ui_zoom: 1.25 });
  });

  it("calls onChange when sidebar position changes", () => {
    render(<SettingsAppearance config={MOCK_CONFIG} onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId("setting-sidebar-position"), {
      target: { value: "right" },
    });
    expect(mockOnChange).toHaveBeenCalledWith({ sidebar_position: "right" });
  });
});
