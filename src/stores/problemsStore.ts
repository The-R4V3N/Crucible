import { create } from "zustand";

/** A single diagnostic problem (error, warning, or info). */
export interface Problem {
  filePath: string;
  line: number;
  col: number;
  message: string;
  severity: "error" | "warning" | "info";
  source?: string;
  code?: string;
}

/** Which tab is active in the bottom panel. */
export type BottomTab = "changes" | "problems";

interface ProblemsState {
  problems: Problem[];
  activeBottomTab: BottomTab;
  setProblems: (problems: Problem[]) => void;
  clearProblems: () => void;
  setActiveBottomTab: (tab: BottomTab) => void;
  errorCount: () => number;
  warningCount: () => number;
}

export const useProblemsStore = create<ProblemsState>((set, get) => ({
  problems: [],
  activeBottomTab: "changes",

  setProblems: (problems) => set({ problems }),

  clearProblems: () => set({ problems: [] }),

  setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),

  errorCount: () => get().problems.filter((p) => p.severity === "error").length,

  warningCount: () => get().problems.filter((p) => p.severity === "warning").length,
}));
