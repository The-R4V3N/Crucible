export type LineChange = {
  line: number;
  type: "added" | "modified" | "deleted";
};

/**
 * Compute line-level diff between oldText and newText.
 * Returns an array of LineChange objects with 1-based line numbers
 * relative to the new file (added/modified) or the preceding line (deleted).
 */
export function computeLineDiff(oldText: string, newText: string): LineChange[] {
  const oldLines = oldText === "" ? [] : oldText.split("\n");
  const newLines = newText === "" ? [] : newText.split("\n");

  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table — dimensions (m+1) × (n+1), all in-bounds accesses are safe
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i]![j] = dp[i + 1]![j + 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
      }
    }
  }

  // Backtrack to produce edit operations
  type Op = { kind: "keep" | "del" | "ins"; oldIdx: number; newIdx: number };
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && oldLines[i] === newLines[j]) {
      ops.push({ kind: "keep", oldIdx: i, newIdx: j });
      i++;
      j++;
    } else if (j < n && (i >= m || dp[i]![j + 1]! >= dp[i + 1]![j]!)) {
      ops.push({ kind: "ins", oldIdx: i, newIdx: j });
      j++;
    } else {
      ops.push({ kind: "del", oldIdx: i, newIdx: j });
      i++;
    }
  }

  // Convert ops into LineChange objects by grouping consecutive del/ins runs
  const changes: LineChange[] = [];
  let k = 0;
  while (k < ops.length) {
    // k is always < ops.length here
    const op = ops[k] as Op;
    if (op.kind === "keep") {
      k++;
      continue;
    }

    // Collect a contiguous group of del/ins ops
    const groupStart = k;
    let delCount = 0;
    let insCount = 0;
    let firstInsNewIdx = -1;

    while (k < ops.length && (ops[k] as Op).kind !== "keep") {
      const cur = ops[k] as Op;
      if (cur.kind === "del") {
        delCount++;
      } else {
        if (firstInsNewIdx === -1) firstInsNewIdx = cur.newIdx;
        insCount++;
      }
      k++;
    }

    const modifiedCount = Math.min(delCount, insCount);
    const extraIns = insCount - modifiedCount;
    const extraDel = delCount - modifiedCount;

    // Emit modified lines (1-based on new file)
    const groupOp = ops[groupStart] as Op;
    for (let r = 0; r < modifiedCount; r++) {
      const newIdx = (firstInsNewIdx !== -1 ? firstInsNewIdx : groupOp.newIdx) + r;
      changes.push({ line: newIdx + 1, type: "modified" });
    }

    // Emit extra inserted lines
    for (let r = modifiedCount; r < modifiedCount + extraIns; r++) {
      const newIdx = (firstInsNewIdx !== -1 ? firstInsNewIdx : 0) + r;
      changes.push({ line: newIdx + 1, type: "added" });
    }

    // Emit deleted marker — placed at the new-file line just before the deletion
    if (extraDel > 0) {
      let markerNewIdx = 0;
      for (let back = groupStart - 1; back >= 0; back--) {
        const prev = ops[back] as Op;
        if (prev.kind === "keep") {
          markerNewIdx = prev.newIdx + 1; // 1-based
          break;
        }
      }
      const markerLine = Math.max(1, markerNewIdx);
      changes.push({ line: markerLine, type: "deleted" });
    }
  }

  return changes;
}
