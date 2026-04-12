/**
 * Find the line number of the closest turn marker strictly before `currentLine`.
 * Returns null if no such marker exists.
 */
export function findPrevTurnLine(markerLines: number[], currentLine: number): number | null {
  const candidates = markerLines.filter((line) => line < currentLine);
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

/**
 * Find the line number of the closest turn marker strictly after `currentLine`.
 * Returns null if no such marker exists.
 */
export function findNextTurnLine(markerLines: number[], currentLine: number): number | null {
  const candidates = markerLines.filter((line) => line > currentLine);
  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}
