import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore } from "@/stores/sessionStore";

describe("sessionStore turns", () => {
  beforeEach(() => {
    useSessionStore.setState({ sessions: {}, activeSessionId: null });
  });

  it("sessions start with an empty turns array", () => {
    useSessionStore.getState().addSession("s1", "project-a");
    expect(useSessionStore.getState().sessions["s1"]?.turns).toEqual([]);
  });

  it("addTurn appends a turn to the correct session", () => {
    useSessionStore.getState().addSession("s1", "project-a");
    useSessionStore.getState().addTurn("s1", 1, 1700000000000);
    const turns = useSessionStore.getState().sessions["s1"]?.turns ?? [];
    expect(turns).toHaveLength(1);
    expect(turns[0]?.turnId).toBe(1);
    expect(turns[0]?.timestampMs).toBe(1700000000000);
  });

  it("addTurn appends multiple turns in order", () => {
    useSessionStore.getState().addSession("s1", "project-a");
    useSessionStore.getState().addTurn("s1", 1, 1000);
    useSessionStore.getState().addTurn("s1", 2, 2000);
    useSessionStore.getState().addTurn("s1", 3, 3000);
    const turns = useSessionStore.getState().sessions["s1"]?.turns ?? [];
    expect(turns).toHaveLength(3);
    expect(turns.map((t) => t.turnId)).toEqual([1, 2, 3]);
  });

  it("addTurn does not affect other sessions", () => {
    useSessionStore.getState().addSession("s1", "project-a");
    useSessionStore.getState().addSession("s2", "project-b");
    useSessionStore.getState().addTurn("s1", 1, 1000);
    expect(useSessionStore.getState().sessions["s2"]?.turns).toEqual([]);
  });

  it("addTurn ignores unknown session", () => {
    // Should not throw
    useSessionStore.getState().addTurn("unknown", 1, 1000);
    expect(useSessionStore.getState().sessions["unknown"]).toBeUndefined();
  });

  it("turns are cleared when session is removed", () => {
    useSessionStore.getState().addSession("s1", "project-a");
    useSessionStore.getState().addTurn("s1", 1, 1000);
    useSessionStore.getState().removeSession("s1");
    expect(useSessionStore.getState().sessions["s1"]).toBeUndefined();
  });

  it("getTurns returns turns for a known session", () => {
    useSessionStore.getState().addSession("s1", "project-a");
    useSessionStore.getState().addTurn("s1", 1, 1000);
    const turns = useSessionStore.getState().getTurns("s1");
    expect(turns).toHaveLength(1);
  });

  it("getTurns returns empty array for unknown session", () => {
    const turns = useSessionStore.getState().getTurns("unknown");
    expect(turns).toEqual([]);
  });
});
