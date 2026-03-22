import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore } from "@/stores/sessionStore";

describe("sessionStore", () => {
  beforeEach(() => {
    // Reset store between tests
    useSessionStore.setState({
      sessions: {},
      activeSessionId: null,
    });
  });

  it("initial state is empty", () => {
    const state = useSessionStore.getState();
    expect(state.sessions).toEqual({});
    expect(state.activeSessionId).toBeNull();
  });

  it("addSession adds a session with starting status", () => {
    useSessionStore.getState().addSession("s1");
    const state = useSessionStore.getState();
    expect(state.sessions["s1"]).toEqual({ id: "s1", status: "starting" });
  });

  it("addSession sets first session as active", () => {
    useSessionStore.getState().addSession("s1");
    expect(useSessionStore.getState().activeSessionId).toBe("s1");
  });

  it("addSession does not override active session", () => {
    useSessionStore.getState().addSession("s1");
    useSessionStore.getState().addSession("s2");
    expect(useSessionStore.getState().activeSessionId).toBe("s1");
  });

  it("updateStatus changes session status", () => {
    useSessionStore.getState().addSession("s1");
    useSessionStore.getState().updateStatus("s1", "running");
    expect(useSessionStore.getState().sessions["s1"]?.status).toBe("running");
  });

  it("updateStatus ignores unknown session", () => {
    useSessionStore.getState().updateStatus("unknown", "running");
    expect(useSessionStore.getState().sessions["unknown"]).toBeUndefined();
  });

  it("removeSession removes the session", () => {
    useSessionStore.getState().addSession("s1");
    useSessionStore.getState().removeSession("s1");
    expect(useSessionStore.getState().sessions["s1"]).toBeUndefined();
  });

  it("removeSession clears activeSessionId if active is removed", () => {
    useSessionStore.getState().addSession("s1");
    useSessionStore.getState().removeSession("s1");
    expect(useSessionStore.getState().activeSessionId).toBeNull();
  });

  it("removeSession keeps activeSessionId if different session removed", () => {
    useSessionStore.getState().addSession("s1");
    useSessionStore.getState().addSession("s2");
    useSessionStore.getState().removeSession("s2");
    expect(useSessionStore.getState().activeSessionId).toBe("s1");
  });

  it("setActiveSession updates active session", () => {
    useSessionStore.getState().addSession("s1");
    useSessionStore.getState().addSession("s2");
    useSessionStore.getState().setActiveSession("s2");
    expect(useSessionStore.getState().activeSessionId).toBe("s2");
  });
});
