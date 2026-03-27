import { describe, it, expect } from "vitest";
import { fuzzyMatch, fuzzyScore } from "@/lib/fuzzyMatch";

describe("fuzzyMatch", () => {
  it("returns true for exact match", () => {
    expect(fuzzyMatch("toggle", "toggle")).toBe(true);
  });

  it("returns true for subsequence match", () => {
    expect(fuzzyMatch("ts", "TypeScript")).toBe(true);
  });

  it("returns true for partial label match", () => {
    expect(fuzzyMatch("togside", "Toggle Sidebar")).toBe(true);
  });

  it("returns false when characters are not in order", () => {
    expect(fuzzyMatch("ba", "ab")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(fuzzyMatch("TOGGLE", "toggle sidebar")).toBe(true);
  });

  it("returns true for empty query — matches everything", () => {
    expect(fuzzyMatch("", "anything")).toBe(true);
  });

  it("returns false when query is longer than target", () => {
    expect(fuzzyMatch("toolongquery", "short")).toBe(false);
  });

  it("returns false when a character in query is absent from target", () => {
    expect(fuzzyMatch("xyz", "Toggle Sidebar")).toBe(false);
  });
});

describe("fuzzyScore", () => {
  it("returns 0 for no match", () => {
    expect(fuzzyScore("xyz", "Toggle Sidebar")).toBe(0);
  });

  it("returns positive score for a match", () => {
    expect(fuzzyScore("toggle", "Toggle Sidebar")).toBeGreaterThan(0);
  });

  it("scores consecutive characters higher than spread characters", () => {
    const consecutive = fuzzyScore("tog", "Toggle");
    const spread = fuzzyScore("tge", "Toggle");
    expect(consecutive).toBeGreaterThan(spread);
  });

  it("scores match at start of string higher", () => {
    const atStart = fuzzyScore("tog", "Toggle Sidebar");
    const inMiddle = fuzzyScore("sid", "Toggle Sidebar");
    expect(atStart).toBeGreaterThan(inMiddle);
  });
});
