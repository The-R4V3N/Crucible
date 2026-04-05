import { describe, it, expect, beforeEach } from "vitest";
import { useConfigStore, type CrucibleConfig } from "@/stores/configStore";

const baseConfig: CrucibleConfig = {
  projects: [
    { name: "existing", path: "/tmp/existing", command: "powershell.exe" },
  ],
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

describe("configStore addProject", () => {
  beforeEach(() => {
    useConfigStore.setState({ config: { ...baseConfig }, isLoaded: true });
  });

  it("addProject adds a new project to the config", () => {
    useConfigStore.getState().addProject("new-project", "/tmp/new-project");
    const projects = useConfigStore.getState().config?.projects;
    expect(projects).toHaveLength(2);
    expect(projects?.[1]?.name).toBe("new-project");
    expect(projects?.[1]?.path).toBe("/tmp/new-project");
  });

  it("addProject defaults command to powershell.exe", () => {
    useConfigStore.getState().addProject("proj", "/tmp/proj");
    const project = useConfigStore.getState().config?.projects?.[1];
    expect(project?.command).toBe("powershell.exe");
  });

  it("addProject accepts custom command", () => {
    useConfigStore.getState().addProject("proj", "/tmp/proj", "cmd.exe");
    const project = useConfigStore.getState().config?.projects?.[1];
    expect(project?.command).toBe("cmd.exe");
  });

  it("addProject does not duplicate existing project name", () => {
    useConfigStore.getState().addProject("existing", "/tmp/other");
    const projects = useConfigStore.getState().config?.projects;
    expect(projects).toHaveLength(1);
  });

  it("removeProject removes a project by name", () => {
    useConfigStore.getState().addProject("to-remove", "/tmp/remove");
    useConfigStore.getState().removeProject("to-remove");
    const projects = useConfigStore.getState().config?.projects;
    expect(projects).toHaveLength(1);
    expect(projects?.[0]?.name).toBe("existing");
  });
});
