import { create } from "zustand";

/** Session status matching the Rust SessionStatus enum. */
export type SessionStatus = "starting" | "running" | "stopped" | "error";

/** A PTY session tracked in the frontend. */
export interface Session {
  id: string;
  status: SessionStatus;
}

/** Session store state and actions. */
interface SessionState {
  sessions: Record<string, Session>;
  activeSessionId: string | null;
  addSession: (id: string) => void;
  updateStatus: (id: string, status: SessionStatus) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: {},
  activeSessionId: null,

  addSession: (id) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [id]: { id, status: "starting" },
      },
      activeSessionId: state.activeSessionId ?? id,
    })),

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

  setActiveSession: (id) => set({ activeSessionId: id }),
}));
