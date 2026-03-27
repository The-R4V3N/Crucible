import { describe, it, expect, beforeEach } from "vitest";
import { useConfigStore } from "@/stores/configStore";
import type { WarpConfig } from "@/stores/configStore";

describe("configStore", () => {
  beforeEach(() => {
    useConfigStore.setState({ config: null, isLoaded: false });
  });

  it("initial state has no config", () => {
    const state = useConfigStore.getState();
    expect(state.config).toBeNull();
    expect(state.isLoaded).toBe(false);
  });

  it("setConfig stores config and marks loaded", () => {
    const config: WarpConfig = {
      projects: [{ name: "test", path: "/tmp", command: "bash" }],
      theme: "dark",
      accent_color: "#00E5FF",
      font_family: "Cascadia Code",
      font_size: 14,
      sidebar_width: 240,
      notifications: { visual: true, border_glow: true, sound: false },
      active_project: null,
    };
    useConfigStore.getState().setConfig(config);
    const state = useConfigStore.getState();
    expect(state.isLoaded).toBe(true);
    expect(state.config?.projects).toHaveLength(1);
    expect(state.config?.projects[0]?.name).toBe("test");
  });

  it("setConfig applies defaults for missing fields", () => {
    const partial = {
      projects: [],
    } as unknown as WarpConfig;
    useConfigStore.getState().setConfig(partial);
    const state = useConfigStore.getState();
    expect(state.config?.theme).toBe("dark");
    expect(state.config?.font_size).toBe(14);
    expect(state.config?.sidebar_width).toBe(240);
  });
});
