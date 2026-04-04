import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useConfigStore } from "@/stores/configStore";
import SettingsGeneral from "@/components/settings/SettingsGeneral";

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

describe("SettingsGeneral", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConfigStore.setState({ config: MOCK_CONFIG, isLoaded: true });
  });

  it("renders default project path input", () => {
    render(<SettingsGeneral />);
    expect(screen.getByTestId("setting-default-project-path")).toBeInTheDocument();
  });

  it("renders shell command input", () => {
    render(<SettingsGeneral />);
    expect(screen.getByTestId("setting-shell-command")).toBeInTheDocument();
  });

  it("renders branch prefix input", () => {
    render(<SettingsGeneral />);
    expect(screen.getByTestId("setting-branch-prefix")).toBeInTheDocument();
  });

  it("shows current branch prefix value", () => {
    render(<SettingsGeneral />);
    expect(screen.getByTestId("setting-branch-prefix")).toHaveValue("feature/");
  });

  it("changing branch prefix calls configSave", async () => {
    render(<SettingsGeneral />);
    const input = screen.getByTestId("setting-branch-prefix");
    fireEvent.change(input, { target: { value: "fix/" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({ branch_prefix: "fix/" }),
      );
    });
  });

  it("changing shell command calls configSave", async () => {
    render(<SettingsGeneral />);
    const input = screen.getByTestId("setting-shell-command");
    fireEvent.change(input, { target: { value: "bash.exe" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({ shell_command: "bash.exe" }),
      );
    });
  });
});
