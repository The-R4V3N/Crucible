import { create } from "zustand";

/** Session status matching the Rust SessionStatus enum. */
export type SessionStatus = "starting" | "running" | "stopped" | "error";

/** A PTY session tracked in the frontend. */
export interface Session {
  id: string;
  projectName: string;
  /** Links this session to its TerminalManager tab entry. */
  tabKey: string;
  /** Display label shown in the terminal tab bar. */
  label: string;
  status: SessionStatus;
  needsAttention: boolean;
}

/** Session store state and actions. */
interface SessionState {
  sessions: Record<string, Session>;
  activeSessionId: string | null;
  addSession: (id: string, projectName?: string, tabKey?: string, label?: string) => void;
  updateStatus: (id: string, status: SessionStatus) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  setAttention: (id: string, needsAttention: boolean) => void;
  getSessionByProject: (projectName: string) => Session | undefined;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: {},
  activeSessionId: null,

  addSession: (id, projectName = "default", tabKey = "", label = "") =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [id]: { id, projectName, tabKey, label, status: "starting", needsAttention: false },
      },
      activeSessionId: state.activeSessionId ?? id,
    })),

  getSessionByProject: (projectName) => {
    const sessions = get().sessions;
    return Object.values(sessions).find((s) => s.projectName === projectName);
  },

  updateStatus: (id, status) =>
    set((state) => {
      const session = state.sessions[id];
      if (!session) return state;
      return {
        sessions: {
          ...state.sessions,
          [id]: { ...session, status },
        },
      };
    }),

  removeSession: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.sessions;
      return {
        sessions: rest,
        activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
      };
    }),

  setActiveSession: (id) =>
    set((state) => {
      const sessions = { ...state.sessions };
      // Clear attention on the session being activated
      if (id && sessions[id]) {
        sessions[id] = { ...sessions[id], needsAttention: false };
      }
      return { activeSessionId: id, sessions };
    }),

  setAttention: (id, needsAttention) =>
    set((state) => {
      const session = state.sessions[id];
      if (!session) return state;
      return {
        sessions: {
          ...state.sessions,
          [id]: { ...session, needsAttention },
        },
      };
    }),
}));
