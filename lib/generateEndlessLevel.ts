/**
 * Endless level generator — runtime, Park-Miller LCG, recipe-first zone placement.
 * Spec: 50000 + levelIndex*137 + gridSize*7919 + floor(difficulty*100) seed formula.
 * Zone IDs prefixed "ez". Single-cell merging down to max(size-2, 1).
 * Star thresholds: difficulty-scaled base * (1 + difficulty * 0.5).
 */
import type { Level, Zone } from './types';
import { WORLD_ELEMENTS } from './levelGenerator';
import {
  buildLatinSquare,
  getRecipeDefs,
  runGenerateZones,
  mergeSingleCellZones,
} from './generatorUtils';

export const GRID_TO_WORLD: Record<number, number> = { 4: 1, 5: 2, 6: 3, 7: 4 };

const THREE_STAR_BASE: Record<number, number> = { 4: 45, 5: 75, 6: 120, 7: 180 };

export function generateEndlessLevel(
  gridSize: number,
  difficulty: number,
  levelIndex: number,
): Level {
  const worldNum = GRID_TO_WORLD[gridSize] ?? 1;
  const elements = WORLD_ELEMENTS[worldNum];
  const recipeDefs = getRecipeDefs(worldNum);
  const size = gridSize;

  // Spec seed formula
  const seed = 50000 + levelIndex * 137 + gridSize * 7919 + Math.floor(difficulty * 100);

  // Park-Miller Latin square
  const solution = buildLatinSquare(elements, seed);

  // Retry loop — up to 20 attempts with varied seeds
  const maxSingles = Math.max(size - 2, 1);
  let zones: Zone[] = [];

  for (let attempt = 0; attempt < 20; attempt++) {
    const attemptSeed = seed * 1000 + attempt * 137;
    const candidate = runGenerateZones(solution, recipeDefs, attemptSeed, difficulty, size, 'ez');
    const covered = candidate.reduce((s, z) => s + z.cells.length, 0);
    if (covered === size * size) {
      zones = candidate;
      break;
    }
    // Keep last attempt as best effort
    if (attempt === 19) zones = candidate;
  }

  // Fallback coverage: add uncovered cells as single-cell zones
  const coveredKeys = new Set(zones.flatMap((z) => z.cells.map((c) => `${c.row},${c.col}`)));
  let fzId = zones.length + 1;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!coveredKeys.has(`${r},${c}`)) {
        const el = solution[r][c];
        zones.push({
          id: `ez${fzId++}`,
          recipeName: el,
          ingredients: [el],
          cells: [{ row: r, col: c }],
        });
      }
    }
  }

  // Merge single-cell zones (Endless only, not Hardcore)
  zones = mergeSingleCellZones(zones, recipeDefs, size, maxSingles);

  // Difficulty-scaled star thresholds
  const base = THREE_STAR_BASE[gridSize] ?? 60;
  const diffMult = 1 + difficulty * 0.5;

  return {
    id: `endless-${levelIndex}`,
    worldId: `endless-w${worldNum}`,
    size,
    elements,
    zones,
    canonicalSolution: solution,
    starThresholds: {
      three: Math.round(base * diffMult),
      two: Math.round(base * diffMult * 2),
    },
  };
}
