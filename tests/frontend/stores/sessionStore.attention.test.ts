import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore } from "@/stores/sessionStore";

describe("sessionStore attention", () => {
  beforeEach(() => {
    useSessionStore.setState({ sessions: {}, activeSessionId: null });
  });

  it("sessions start without attention", () => {
    useSessionStore.getState().addSession("s1", "project-a");
    expect(useSessionStore.getState().sessions["s1"]?.needsAttention).toBe(false);
  });

  it("setAttention marks session as needing attention", () => {
    useSessionStore.getState().addSession("s1", "project-a");
    useSessionStore.getState().setAttention("s1", true);
    expect(useSessionStore.getState().sessions["s1"]?.needsAttention).toBe(true);
  });

  it("setAttention can clear attention", () => {
    useSessionStore.getState().addSession("s1", "project-a");
    useSessionStore.getState().setAttention("s1", true);
    useSessionStore.getState().setAttention("s1", false);
    expect(useSessionStore.getState().sessions["s1"]?.needsAttention).toBe(false);
  });

  it("setActiveSession clears attention on the activated session", () => {
    useSessionStore.getState().addSession("s1", "project-a");
    useSessionStore.getState().addSession("s2", "project-b");
    useSessionStore.getState().setAttention("s2", true);
    useSessionStore.getState().setActiveSession("s2");
    expect(useSessionStore.getState().sessions["s2"]?.needsAttention).toBe(false);
  });

  it("setAttention ignores unknown session", () => {
    useSessionStore.getState().setAttention("unknown", true);
    expect(useSessionStore.getState().sessions["unknown"]).toBeUndefined();
  });
});
