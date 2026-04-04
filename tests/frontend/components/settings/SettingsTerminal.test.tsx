import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsTerminal from "@/components/settings/SettingsTerminal";
import type { WarpConfig } from "@/stores/configStore";

const mockListFonts = vi.hoisted(() =>
  vi.fn().mockResolvedValue(["Cascadia Code", "Consolas", "Fira Code"]),
);
vi.mock("@/lib/ipc", () => ({
  listFonts: mockListFonts,
}));

const MOCK_CONFIG: WarpConfig = {
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

describe("SettingsTerminal", () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockListFonts.mockResolvedValue(["Cascadia Code", "Consolas", "Fira Code"]);
    mockOnChange = vi.fn();
  });

  it("renders font family as a select dropdown", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-font-family").tagName).toBe("SELECT");
  });

  it("populates dropdown with system fonts", async () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    await waitFor(() => {
      expect(screen.getByText("Consolas")).toBeInTheDocument();
    });
  });

  it("shows current font family selected", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-font-family")).toHaveValue("Cascadia Code");
  });

  it("calls onChange when font family changes", async () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    await waitFor(() => screen.getByText("Fira Code"));
    fireEvent.change(screen.getByTestId("setting-font-family"), {
      target: { value: "Fira Code" },
    });
    expect(mockOnChange).toHaveBeenCalledWith({ font_family: "Fira Code" });
  });

  it("renders font size as a select dropdown", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-font-size").tagName).toBe("SELECT");
  });

  it("shows current font size selected", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-font-size")).toHaveValue("14");
  });

  it("calls onChange when font size changes", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId("setting-font-size"), {
      target: { value: "16" },
    });
    expect(mockOnChange).toHaveBeenCalledWith({ font_size: 16 });
  });

  it("renders cursor style radio buttons", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-cursor-bar")).toBeInTheDocument();
    expect(screen.getByTestId("setting-cursor-block")).toBeInTheDocument();
    expect(screen.getByTestId("setting-cursor-underline")).toBeInTheDocument();
  });

  it("shows current cursor style checked", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-cursor-bar")).toBeChecked();
    expect(screen.getByTestId("setting-cursor-block")).not.toBeChecked();
  });

  it("calls onChange when cursor style changes", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    fireEvent.click(screen.getByTestId("setting-cursor-block"));
    expect(mockOnChange).toHaveBeenCalledWith({ cursor_style: "block" });
  });

  it("renders terminal theme select", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-terminal-theme")).toBeInTheDocument();
  });

  it("shows current terminal theme", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-terminal-theme")).toHaveValue("dark");
  });

  it("calls onChange when terminal theme changes", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId("setting-terminal-theme"), {
      target: { value: "light" },
    });
    expect(mockOnChange).toHaveBeenCalledWith({ terminal_theme: "light" });
  });

  it("renders divider color input", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    expect(screen.getByTestId("setting-divider-color")).toBeInTheDocument();
  });

  it("calls onChange when divider color changes", () => {
    render(<SettingsTerminal config={MOCK_CONFIG} onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId("setting-divider-color"), {
      target: { value: "#ff0000" },
    });
    expect(mockOnChange).toHaveBeenCalledWith({ divider_color: "#ff0000" });
  });
});
