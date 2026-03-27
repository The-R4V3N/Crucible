/**
 * Returns true if every character in `query` appears in `target` in order.
 * Case-insensitive. Empty query always matches.
 */
export function fuzzyMatch(query: string, target: string): boolean {
  if (query.length === 0) return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

/**
 * Returns a relevance score for a fuzzy match (higher = better).
 * Returns 0 if query does not match target.
 * Rewards consecutive character runs and matches near the start.
 */
export function fuzzyScore(query: string, target: string): number {
  if (query.length === 0) return 1;
  if (!fuzzyMatch(query, target)) return 0;

  const q = query.toLowerCase();
  const t = target.toLowerCase();

  let score = 0;
  let qi = 0;
  let lastMatchIndex = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Consecutive bonus
      score += lastMatchIndex === ti - 1 ? 2 : 1;
      // Start-of-string bonus
      if (ti === 0) score += 2;
      lastMatchIndex = ti;
      qi++;
    }
  }

  return score;
}
