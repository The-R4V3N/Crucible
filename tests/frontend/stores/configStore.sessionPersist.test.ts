import { describe, it, expect, beforeEach } from "vitest";
import { useConfigStore } from "@/stores/configStore";

describe("configStore session persistence", () => {
  beforeEach(() => {
    useConfigStore.setState({
      config: {
        projects: [
          { name: "alpha", path: "/alpha", command: "powershell.exe" },
          { name: "beta", path: "/beta", command: "powershell.exe" },
        ],
        theme: "dark",
        accent_color: "#00E5FF",
        font_family: "Cascadia Code",
        font_size: 14,
        sidebar_width: 240,
        notifications: { visual: true, border_glow: true, sound: false },
        active_project: null,
      },
      isLoaded: true,
    });
  });

  it("should have active_project as null by default", () => {
    const config = useConfigStore.getState().config;
    expect(config?.active_project).toBeNull();
  });

  it("should set active_project via setActiveProject", () => {
    useConfigStore.getState().setActiveProject("alpha");
    const config = useConfigStore.getState().config;
    expect(config?.active_project).toBe("alpha");
  });

  it("should clear active_project when set to null", () => {
    useConfigStore.getState().setActiveProject("alpha");
    useConfigStore.getState().setActiveProject(null);
    const config = useConfigStore.getState().config;
    expect(config?.active_project).toBeNull();
  });

  it("should not set active_project if config is null", () => {
    useConfigStore.setState({ config: null });
    useConfigStore.getState().setActiveProject("alpha");
    expect(useConfigStore.getState().config).toBeNull();
  });

  it("should clear active_project when the active project is removed", () => {
    useConfigStore.getState().setActiveProject("alpha");
    useConfigStore.getState().removeProject("alpha");
    const config = useConfigStore.getState().config;
    expect(config?.active_project).toBeNull();
  });
});
