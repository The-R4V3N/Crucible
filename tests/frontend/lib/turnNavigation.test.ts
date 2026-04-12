import { describe, it, expect } from "vitest";
import { findPrevTurnLine, findNextTurnLine } from "@/lib/turnNavigation";

describe("findPrevTurnLine", () => {
  it("returns null when there are no markers", () => {
    expect(findPrevTurnLine([], 50)).toBeNull();
  });

  it("returns null when current line is before all markers", () => {
    expect(findPrevTurnLine([100, 200, 300], 50)).toBeNull();
  });

  it("returns the closest marker strictly before current line", () => {
    expect(findPrevTurnLine([10, 50, 100], 60)).toBe(50);
  });

  it("returns the largest marker strictly less than currentLine", () => {
    expect(findPrevTurnLine([10, 50, 100], 101)).toBe(100);
  });

  it("does not return a marker at exactly currentLine (strict less-than)", () => {
    expect(findPrevTurnLine([10, 50, 100], 100)).toBe(50);
  });

  it("returns the only marker when it is before currentLine", () => {
    expect(findPrevTurnLine([20], 50)).toBe(20);
  });

  it("returns null when the only marker is at currentLine", () => {
    expect(findPrevTurnLine([50], 50)).toBeNull();
  });

  it("handles markers in unsorted order", () => {
    expect(findPrevTurnLine([100, 10, 50], 60)).toBe(50);
  });
});

describe("findNextTurnLine", () => {
  it("returns null when there are no markers", () => {
    expect(findNextTurnLine([], 50)).toBeNull();
  });

  it("returns null when current line is after all markers", () => {
    expect(findNextTurnLine([10, 20, 30], 50)).toBeNull();
  });

  it("returns the closest marker strictly after current line", () => {
    expect(findNextTurnLine([10, 50, 100], 60)).toBe(100);
  });

  it("returns the smallest marker strictly greater than currentLine", () => {
    expect(findNextTurnLine([10, 50, 100], 9)).toBe(10);
  });

  it("does not return a marker at exactly currentLine (strict greater-than)", () => {
    expect(findNextTurnLine([10, 50, 100], 50)).toBe(100);
  });

  it("returns the only marker when it is after currentLine", () => {
    expect(findNextTurnLine([20], 10)).toBe(20);
  });

  it("returns null when the only marker is at currentLine", () => {
    expect(findNextTurnLine([50], 50)).toBeNull();
  });

  it("handles markers in unsorted order", () => {
    expect(findNextTurnLine([100, 10, 50], 40)).toBe(50);
  });
});
