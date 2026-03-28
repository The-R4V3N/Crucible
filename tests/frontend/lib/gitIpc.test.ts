import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { gitStage, gitUnstage, gitDiscard, gitCommit } from "@/lib/ipc";

const mockInvoke = vi.mocked(invoke);

describe("git action IPC wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gitStage calls git_stage_file with correct args", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await gitStage("/repo", "src/App.tsx");
    expect(mockInvoke).toHaveBeenCalledWith("git_stage_file", {
      repoPath: "/repo",
      filePath: "src/App.tsx",
    });
  });

  it("gitUnstage calls git_unstage_file with correct args", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await gitUnstage("/repo", "src/App.tsx");
    expect(mockInvoke).toHaveBeenCalledWith("git_unstage_file", {
      repoPath: "/repo",
      filePath: "src/App.tsx",
    });
  });

  it("gitDiscard calls git_discard_file with correct args", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await gitDiscard("/repo", "src/App.tsx");
    expect(mockInvoke).toHaveBeenCalledWith("git_discard_file", {
      repoPath: "/repo",
      filePath: "src/App.tsx",
    });
  });

  it("gitCommit calls git_commit_changes with correct args", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await gitCommit("/repo", "add feature");
    expect(mockInvoke).toHaveBeenCalledWith("git_commit_changes", {
      repoPath: "/repo",
      message: "add feature",
    });
  });

  it("gitStage propagates rejection", async () => {
    mockInvoke.mockRejectedValue(new Error("not a repo"));
    await expect(gitStage("/bad", "file.ts")).rejects.toThrow("not a repo");
  });

  it("gitCommit propagates rejection", async () => {
    mockInvoke.mockRejectedValue(new Error("commit message cannot be empty"));
    await expect(gitCommit("/repo", "")).rejects.toThrow();
  });
});
