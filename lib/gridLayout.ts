/**
 * Computes cell size so the grid fills the screen width edge-to-edge
 * with only a small side gap. Height follows naturally (square cells).
 *
 * SIDE_GAP  = padding on each horizontal side (px)
 * CELL_GAP  = gap between every pair of adjacent cells (px)
 */
const SIDE_GAP = 4;
const CELL_GAP = 4;

export function computeGridLayout(
  gridSize: number,
  screenWidth: number,
): { cellSize: number; gap: number; totalGridPx: number } {
  const gap = CELL_GAP;
  const available = screenWidth - 2 * SIDE_GAP;
  const cellSize = Math.floor(((available - (gridSize - 1) * gap) / gridSize) * 0.9);
  const totalGridPx = gridSize * cellSize + (gridSize - 1) * gap;
  return { cellSize, gap, totalGridPx };
}
