import { describe, it, expect, beforeEach } from "vitest";
import { useProblemsStore } from "@/stores/problemsStore";

describe("problemsStore", () => {
  beforeEach(() => {
    useProblemsStore.setState({
      problems: [],
      activeBottomTab: "changes",
    });
  });

  it("starts with no problems", () => {
    expect(useProblemsStore.getState().problems).toHaveLength(0);
  });

  it("starts on changes tab", () => {
    expect(useProblemsStore.getState().activeBottomTab).toBe("changes");
  });

  it("setProblems replaces the problems list", () => {
    useProblemsStore.getState().setProblems([
      { filePath: "/src/App.tsx", line: 5, col: 3, message: "Missing semicolon", severity: "error" },
    ]);
    expect(useProblemsStore.getState().problems).toHaveLength(1);
    expect(useProblemsStore.getState().problems[0]!.message).toBe("Missing semicolon");
  });

  it("clearProblems empties the list", () => {
    useProblemsStore.getState().setProblems([
      { filePath: "/src/App.tsx", line: 1, col: 1, message: "err", severity: "error" },
    ]);
    useProblemsStore.getState().clearProblems();
    expect(useProblemsStore.getState().problems).toHaveLength(0);
  });

  it("setActiveBottomTab switches the active tab", () => {
    useProblemsStore.getState().setActiveBottomTab("problems");
    expect(useProblemsStore.getState().activeBottomTab).toBe("problems");
  });

  it("errorCount returns the number of error-severity problems", () => {
    useProblemsStore.getState().setProblems([
      { filePath: "/a.ts", line: 1, col: 1, message: "e1", severity: "error" },
      { filePath: "/a.ts", line: 2, col: 1, message: "w1", severity: "warning" },
      { filePath: "/a.ts", line: 3, col: 1, message: "e2", severity: "error" },
    ]);
    expect(useProblemsStore.getState().errorCount()).toBe(2);
  });

  it("warningCount returns the number of warning-severity problems", () => {
    useProblemsStore.getState().setProblems([
      { filePath: "/a.ts", line: 1, col: 1, message: "e1", severity: "error" },
      { filePath: "/a.ts", line: 2, col: 1, message: "w1", severity: "warning" },
      { filePath: "/a.ts", line: 3, col: 1, message: "w2", severity: "warning" },
    ]);
    expect(useProblemsStore.getState().warningCount()).toBe(2);
  });
});
