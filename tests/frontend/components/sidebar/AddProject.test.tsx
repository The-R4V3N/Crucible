import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useConfigStore } from "@/stores/configStore";
import AddProjectButton from "@/components/sidebar/AddProjectButton";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

vi.mock("@/lib/ipc", () => ({
  configSave: vi.fn().mockResolvedValue(undefined),
}));

import { open } from "@tauri-apps/plugin-dialog";
const mockOpen = vi.mocked(open);

describe("AddProjectButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConfigStore.setState({
      config: {
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
      },
      isLoaded: true,
    });
  });

  it("renders add project button", () => {
    render(<AddProjectButton />);
    expect(screen.getByTestId("add-project-btn")).toBeInTheDocument();
  });

  it("shows + icon", () => {
    render(<AddProjectButton />);
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("clicking opens folder dialog", async () => {
    mockOpen.mockResolvedValue(null);
    render(<AddProjectButton />);
    fireEvent.click(screen.getByTestId("add-project-btn"));
    await vi.waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({ directory: true }),
      );
    });
  });

  it("adds project after folder selection", async () => {
    mockOpen.mockResolvedValue("/tmp/my-project");
    render(<AddProjectButton />);
    await fireEvent.click(screen.getByTestId("add-project-btn"));
    // Wait for async handler
    await vi.waitFor(() => {
      const projects = useConfigStore.getState().config?.projects;
      expect(projects?.some((p) => p.name === "my-project")).toBe(true);
    });
  });

  it("does nothing when dialog is cancelled", async () => {
    mockOpen.mockResolvedValue(null);
    render(<AddProjectButton />);
    await fireEvent.click(screen.getByTestId("add-project-btn"));
    await vi.waitFor(() => {
      expect(useConfigStore.getState().config?.projects).toHaveLength(0);
    });
  });
});
