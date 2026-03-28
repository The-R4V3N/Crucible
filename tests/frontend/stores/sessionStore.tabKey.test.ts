import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore } from "@/stores/sessionStore";

describe("sessionStore tabKey and label", () => {
  beforeEach(() => {
    useSessionStore.setState({ sessions: {}, activeSessionId: null });
  });

  it("addSession stores tabKey on the session", () => {
    useSessionStore.getState().addSession("sess-1", "my-project", "tab-key-1");
    const session = useSessionStore.getState().sessions["sess-1"];
    expect(session?.tabKey).toBe("tab-key-1");
  });

  it("addSession stores label on the session", () => {
    useSessionStore.getState().addSession("sess-1", "my-project", "tab-key-1", "powershell");
    const session = useSessionStore.getState().sessions["sess-1"];
    expect(session?.label).toBe("powershell");
  });

  it("addSession defaults tabKey to empty string when not provided", () => {
    useSessionStore.getState().addSession("sess-1", "my-project");
    const session = useSessionStore.getState().sessions["sess-1"];
    expect(session?.tabKey).toBe("");
  });

  it("addSession defaults label to empty string when not provided", () => {
    useSessionStore.getState().addSession("sess-1", "my-project");
    const session = useSessionStore.getState().sessions["sess-1"];
    expect(session?.label).toBe("");
  });

  it("multiple sessions with different tabKeys are stored independently", () => {
    useSessionStore.getState().addSession("sess-1", "proj", "tab-a", "bash");
    useSessionStore.getState().addSession("sess-2", "proj", "tab-b", "zsh");
    const sessions = useSessionStore.getState().sessions;
    expect(sessions["sess-1"]?.tabKey).toBe("tab-a");
    expect(sessions["sess-2"]?.tabKey).toBe("tab-b");
    expect(sessions["sess-1"]?.label).toBe("bash");
    expect(sessions["sess-2"]?.label).toBe("zsh");
  });
});
