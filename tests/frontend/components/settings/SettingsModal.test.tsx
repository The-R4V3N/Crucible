import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { useConfigStore } from "@/stores/configStore";
import SettingsModal from "@/components/settings/SettingsModal";

const mockConfigSave = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockConfigLoad = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
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
  }),
);

const mockListFonts = vi.hoisted(() =>
  vi.fn().mockResolvedValue(["Cascadia Code", "Consolas", "Fira Code"]),
);

vi.mock("@/lib/ipc", () => ({
  configSave: mockConfigSave,
  configLoad: mockConfigLoad,
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

describe("SettingsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ settingsOpen: false });
    useConfigStore.setState({ config: MOCK_CONFIG, isLoaded: true });
  });

  it("does not render when settingsOpen is false", () => {
    useUiStore.setState({ settingsOpen: false });
    render(<SettingsModal />);
    expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
  });

  it("renders when settingsOpen is true", () => {
    useUiStore.setState({ settingsOpen: true });
    render(<SettingsModal />);
    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
  });

  it("shows General page by default", () => {
    useUiStore.setState({ settingsOpen: true });
    render(<SettingsModal />);
    expect(screen.getByTestId("settings-page-general")).toBeInTheDocument();
  });

  it("navigates to Appearance page", () => {
    useUiStore.setState({ settingsOpen: true });
    render(<SettingsModal />);
    fireEvent.click(screen.getByTestId("settings-nav-appearance"));
    expect(screen.getByTestId("settings-page-appearance")).toBeInTheDocument();
  });

  it("navigates to Terminal page", () => {
    useUiStore.setState({ settingsOpen: true });
    render(<SettingsModal />);
    fireEvent.click(screen.getByTestId("settings-nav-terminal"));
    expect(screen.getByTestId("settings-page-terminal")).toBeInTheDocument();
  });

  it("navigates to Keyboard Shortcuts page", () => {
    useUiStore.setState({ settingsOpen: true });
    render(<SettingsModal />);
    fireEvent.click(screen.getByTestId("settings-nav-keyboard"));
    expect(screen.getByTestId("settings-page-keyboard")).toBeInTheDocument();
  });

  it("closes when Escape is pressed", () => {
    useUiStore.setState({ settingsOpen: true });
    render(<SettingsModal />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(useUiStore.getState().settingsOpen).toBe(false);
  });

  it("closes when close button is clicked", () => {
    useUiStore.setState({ settingsOpen: true });
    render(<SettingsModal />);
    fireEvent.click(screen.getByTestId("settings-close"));
    expect(useUiStore.getState().settingsOpen).toBe(false);
  });
});
