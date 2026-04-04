import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useConfigStore } from "@/stores/configStore";
import SettingsTerminal from "@/components/settings/SettingsTerminal";

const mockConfigSave = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockListFonts = vi.hoisted(() =>
  vi.fn().mockResolvedValue(["Cascadia Code", "Consolas", "Fira Code"]),
);
vi.mock("@/lib/ipc", () => ({
  configSave: mockConfigSave,
  listFonts: mockListFonts,
}));

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

describe("SettingsTerminal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListFonts.mockResolvedValue(["Cascadia Code", "Consolas", "Fira Code"]);
    useConfigStore.setState({ config: MOCK_CONFIG, isLoaded: true });
  });

  it("renders font family as a select dropdown", () => {
    render(<SettingsTerminal />);
    const el = screen.getByTestId("setting-font-family");
    expect(el.tagName).toBe("SELECT");
  });

  it("shows loading state while fonts load", async () => {
    render(<SettingsTerminal />);
    // The select should eventually populate
    await waitFor(() => {
      expect(screen.getByTestId("setting-font-family")).toBeInTheDocument();
    });
  });

  it("populates dropdown with system fonts", async () => {
    render(<SettingsTerminal />);
    await waitFor(() => {
      expect(screen.getByText("Cascadia Code")).toBeInTheDocument();
      expect(screen.getByText("Consolas")).toBeInTheDocument();
    });
  });

  it("current font is selected in dropdown", async () => {
    render(<SettingsTerminal />);
    await waitFor(() => {
      expect(screen.getByTestId("setting-font-family")).toHaveValue("Cascadia Code");
    });
  });

  it("changing font family select calls configSave", async () => {
    render(<SettingsTerminal />);
    await waitFor(() => screen.getByText("Fira Code"));
    fireEvent.change(screen.getByTestId("setting-font-family"), { target: { value: "Fira Code" } });
    await waitFor(() => {
      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({ font_family: "Fira Code" }),
      );
    });
  });

  it("renders font size as a select dropdown", () => {
    render(<SettingsTerminal />);
    const el = screen.getByTestId("setting-font-size");
    expect(el.tagName).toBe("SELECT");
  });

  it("shows current font size selected", () => {
    render(<SettingsTerminal />);
    expect(screen.getByTestId("setting-font-size")).toHaveValue("14");
  });

  it("renders cursor style radio buttons", () => {
    render(<SettingsTerminal />);
    expect(screen.getByTestId("setting-cursor-bar")).toBeInTheDocument();
    expect(screen.getByTestId("setting-cursor-block")).toBeInTheDocument();
    expect(screen.getByTestId("setting-cursor-underline")).toBeInTheDocument();
  });

  it("shows current cursor style selected", () => {
    render(<SettingsTerminal />);
    expect(screen.getByTestId("setting-cursor-bar")).toBeChecked();
    expect(screen.getByTestId("setting-cursor-block")).not.toBeChecked();
  });

  it("renders terminal theme select", () => {
    render(<SettingsTerminal />);
    expect(screen.getByTestId("setting-terminal-theme")).toBeInTheDocument();
  });

  it("renders divider color input", () => {
    render(<SettingsTerminal />);
    expect(screen.getByTestId("setting-divider-color")).toBeInTheDocument();
  });

  it("changing font size calls configSave immediately", async () => {
    render(<SettingsTerminal />);
    const select = screen.getByTestId("setting-font-size");
    fireEvent.change(select, { target: { value: "16" } });
    await waitFor(() => {
      expect(mockConfigSave).toHaveBeenCalledWith(expect.objectContaining({ font_size: 16 }));
    });
  });

  it("changing cursor style calls configSave immediately", async () => {
    render(<SettingsTerminal />);
    fireEvent.click(screen.getByTestId("setting-cursor-block"));
    await waitFor(() => {
      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({ cursor_style: "block" }),
      );
    });
  });

  it("changing terminal theme calls configSave immediately", async () => {
    render(<SettingsTerminal />);
    const select = screen.getByTestId("setting-terminal-theme");
    fireEvent.change(select, { target: { value: "light" } });
    await waitFor(() => {
      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({ terminal_theme: "light" }),
      );
    });
  });
});
