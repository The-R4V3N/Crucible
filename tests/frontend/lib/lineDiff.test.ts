import { describe, it, expect } from "vitest";
import { computeLineDiff } from "@/lib/lineDiff";

describe("computeLineDiff", () => {
  // ── no changes ────────────────────────────────────────────────────────────

  it("returns empty array for identical content", () => {
    expect(computeLineDiff("a\nb\nc", "a\nb\nc")).toHaveLength(0);
  });

  it("returns empty array when both inputs are empty strings", () => {
    expect(computeLineDiff("", "")).toHaveLength(0);
  });

  // ── pure additions ────────────────────────────────────────────────────────

  it("marks every line as added when old is empty", () => {
    const changes = computeLineDiff("", "line1\nline2\nline3");
    expect(changes).toContainEqual({ line: 1, type: "added" });
    expect(changes).toContainEqual({ line: 2, type: "added" });
    expect(changes).toContainEqual({ line: 3, type: "added" });
    expect(changes.every((c) => c.type === "added")).toBe(true);
  });

  it("marks a single appended line as added", () => {
    const changes = computeLineDiff("a\nb", "a\nb\nc");
    expect(changes).toEqual([{ line: 3, type: "added" }]);
  });

  it("marks multiple added lines at the end", () => {
    const changes = computeLineDiff("a", "a\nb\nc");
    expect(changes).toContainEqual({ line: 2, type: "added" });
    expect(changes).toContainEqual({ line: 3, type: "added" });
    expect(changes.every((c) => c.type === "added")).toBe(true);
  });

  it("marks added lines inserted in the middle", () => {
    const changes = computeLineDiff("a\nc", "a\nb\nc");
    expect(changes).toContainEqual({ line: 2, type: "added" });
    expect(changes.every((c) => c.type === "added")).toBe(true);
  });

  // ── pure deletions ────────────────────────────────────────────────────────

  it("emits a deleted marker when a line is removed from the middle", () => {
    const changes = computeLineDiff("a\nb\nc", "a\nc");
    const deleted = changes.filter((c) => c.type === "deleted");
    expect(deleted).toHaveLength(1);
    expect(deleted[0]!.line).toBeGreaterThanOrEqual(1);
  });

  it("emits a deleted marker when new content is empty", () => {
    const changes = computeLineDiff("a\nb\nc", "");
    const deleted = changes.filter((c) => c.type === "deleted");
    expect(deleted).toHaveLength(1);
    expect(deleted[0]!.line).toBe(1);
  });

  it("deleted marker line is ≥ 1", () => {
    // Deletion at very beginning of file
    const changes = computeLineDiff("a\nb\nc", "b\nc");
    const deleted = changes.filter((c) => c.type === "deleted");
    expect(deleted).toHaveLength(1);
    expect(deleted[0]!.line).toBeGreaterThanOrEqual(1);
  });

  // ── modifications ─────────────────────────────────────────────────────────

  it("marks a single changed line as modified", () => {
    const changes = computeLineDiff("a\nb\nc", "a\nB\nc");
    expect(changes).toContainEqual({ line: 2, type: "modified" });
    expect(changes.filter((c) => c.type === "modified")).toHaveLength(1);
  });

  it("marks multiple consecutive changed lines as modified", () => {
    const changes = computeLineDiff("a\nb\nc\nd", "a\nB\nC\nd");
    expect(changes).toContainEqual({ line: 2, type: "modified" });
    expect(changes).toContainEqual({ line: 3, type: "modified" });
    expect(changes.filter((c) => c.type === "modified")).toHaveLength(2);
  });

  it("marks first line as modified when only first line changes", () => {
    const changes = computeLineDiff("A\nb\nc", "a\nb\nc");
    expect(changes).toContainEqual({ line: 1, type: "modified" });
  });

  it("marks last line as modified when only last line changes", () => {
    const changes = computeLineDiff("a\nb\nC", "a\nb\nc");
    expect(changes).toContainEqual({ line: 3, type: "modified" });
  });

  // ── mixed changes ─────────────────────────────────────────────────────────

  it("handles modification + extra addition (replacement grows)", () => {
    // old: [a, b], new: [a, B, extra] — b→B (modified) + extra (added)
    const changes = computeLineDiff("a\nb", "a\nB\nextra");
    expect(changes).toContainEqual({ line: 2, type: "modified" });
    expect(changes).toContainEqual({ line: 3, type: "added" });
  });

  it("handles modification + extra deletion (replacement shrinks)", () => {
    // old: [a, b, c], new: [a, B] — b→B (modified) + c deleted
    const changes = computeLineDiff("a\nb\nc", "a\nB");
    expect(changes).toContainEqual({ line: 2, type: "modified" });
    const deleted = changes.filter((c) => c.type === "deleted");
    expect(deleted).toHaveLength(1);
  });

  // ── line numbers are 1-based ──────────────────────────────────────────────

  it("line numbers are always 1-based", () => {
    const changes = computeLineDiff("", "x");
    expect(changes[0]!.line).toBe(1);
  });

  it("does not contain line 0 or negative lines", () => {
    const changes = computeLineDiff("a\nb\nc", "b\nc\nd");
    for (const c of changes) {
      expect(c.line).toBeGreaterThanOrEqual(1);
    }
  });
});
