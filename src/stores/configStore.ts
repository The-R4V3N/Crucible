import { create } from "zustand";

/** Configuration for a single project. */
export interface ProjectConfig {
  name: string;
  path: string;
  command: string;
}

/** Notification settings. */
export interface NotificationConfig {
  visual: boolean;
  border_glow: boolean;
  sound: boolean;
}

/** Root WARP configuration. */
export interface WarpConfig {
  projects: ProjectConfig[];
  theme: string;
  accent_color: string;
  font_family: string;
  font_size: number;
  sidebar_width: number;
  notifications: NotificationConfig;
}

/** Config store state and actions. */
interface ConfigState {
  config: WarpConfig | null;
  isLoaded: boolean;
  setConfig: (config: WarpConfig) => void;
  addProject: (name: string, path: string, command?: string) => void;
  removeProject: (name: string) => void;
}

const defaultConfig: WarpConfig = {
  projects: [],
  theme: "dark",
  accent_color: "#00E5FF",
  font_family: "Cascadia Code",
  font_size: 14,
  sidebar_width: 240,
  notifications: {
    visual: true,
    border_glow: true,
    sound: false,
  },
};

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  isLoaded: false,

  setConfig: (config) =>
    set({
      config: { ...defaultConfig, ...config },
      isLoaded: true,
    }),

  addProject: (name, path, command = "powershell.exe") =>
    set((state) => {
      if (!state.config) return state;
      // Don't add duplicate project names
      if (state.config.projects.some((p) => p.name === name)) return state;
      return {
        config: {
          ...state.config,
          projects: [...state.config.projects, { name, path, command }],
        },
      };
    }),

  removeProject: (name) =>
    set((state) => {
      if (!state.config) return state;
      return {
        config: {
          ...state.config,
          projects: state.config.projects.filter((p) => p.name !== name),
        },
      };
    }),
}));
