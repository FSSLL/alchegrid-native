import type { Level, CellCoord, Zone, ElementID } from './types';

export function getConflicts(board: (ElementID | null)[][], size: number): CellCoord[] {
  const conflicts: CellCoord[] = [];

  for (let r = 0; r < size; r++) {
    const seen = new Map<string, number>();
    for (let c = 0; c < size; c++) {
      const el = board[r][c];
      if (!el) continue;
      if (seen.has(el)) {
        conflicts.push({ row: r, col: seen.get(el)! });
        conflicts.push({ row: r, col: c });
      } else {
        seen.set(el, c);
      }
    }
  }

  for (let c = 0; c < size; c++) {
    const seen = new Map<string, number>();
    for (let r = 0; r < size; r++) {
      const el = board[r][c];
      if (!el) continue;
      if (seen.has(el)) {
        conflicts.push({ row: seen.get(el)!, col: c });
        conflicts.push({ row: r, col: c });
      } else {
        seen.set(el, r);
      }
    }
  }

  const keys = new Set<string>();
  return conflicts.filter((cc) => {
    const k = `${cc.row},${cc.col}`;
    if (keys.has(k)) return false;
    keys.add(k);
    return true;
  });
}

export function isZoneSatisfied(zone: Zone, board: (ElementID | null)[][]): boolean {
  const cells = zone.cells.map(({ row, col }) => board[row][col]);
  if (cells.some((el) => el === null)) return false;
  const inZone = new Set(cells as string[]);
  const required = new Set(zone.ingredients);
  if (inZone.size !== required.size) return false;
  for (const el of required) {
    if (!inZone.has(el)) return false;
  }
  return true;
}

/**
 * Pass preComputedConflicts to avoid running getConflicts a second time when
 * the caller already has a fresh conflicts array.
 */
export function checkWin(
  level: Level,
  board: (ElementID | null)[][],
  preComputedConflicts?: CellCoord[],
): boolean {
  // 1. All cells filled — cheapest check first
  for (const row of board) {
    if (row.some((el) => el === null)) return false;
  }

  // 2. No conflicts — reuse pre-computed result when available
  const conflicts = preComputedConflicts ?? getConflicts(board, level.size);
  if (conflicts.length > 0) return false;

  // 3. All zones satisfied
  for (const zone of level.zones) {
    if (!isZoneSatisfied(zone, board)) return false;
  }

  return true;
}
