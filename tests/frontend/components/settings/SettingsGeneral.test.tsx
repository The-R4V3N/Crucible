import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingsGeneral from "@/components/settings/SettingsGeneral";
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

describe("SettingsGeneral", () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
  });

  it("renders default project path input", () => {
    render(<SettingsGeneral config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-default-project-path")).toBeInTheDocument();
  });

  it("renders shell command input", () => {
    render(<SettingsGeneral config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-shell-command")).toBeInTheDocument();
  });

  it("renders branch prefix input", () => {
    render(<SettingsGeneral config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-branch-prefix")).toBeInTheDocument();
  });

  it("shows current branch prefix value", () => {
    render(<SettingsGeneral config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-branch-prefix")).toHaveValue("feature/");
  });

  it("calls onChange when branch prefix changes", () => {
    render(<SettingsGeneral config={MOCK_CONFIG} onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId("setting-branch-prefix"), {
      target: { value: "fix/" },
    });
    expect(mockOnChange).toHaveBeenCalledWith({ branch_prefix: "fix/" });
  });

  it("calls onChange when shell command changes", () => {
    render(<SettingsGeneral config={MOCK_CONFIG} onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId("setting-shell-command"), {
      target: { value: "bash.exe" },
    });
    expect(mockOnChange).toHaveBeenCalledWith({ shell_command: "bash.exe" });
  });

  it("calls onChange when default project path changes", () => {
    render(<SettingsGeneral config={MOCK_CONFIG} onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId("setting-default-project-path"), {
      target: { value: "C:\\Projects" },
    });
    expect(mockOnChange).toHaveBeenCalledWith({ default_project_path: "C:\\Projects" });
  });
});
