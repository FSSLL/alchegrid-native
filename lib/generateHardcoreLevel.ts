import type { Level, Zone } from './types';
import {
  WORLD_ELEMENTS,
  seededRandom,
  generateLatinSquare,
  partitionGrid,
  splitZonesByUniqueness,
  findRecipe,
  getFallbackName,
} from './levelGenerator';

// ── Level spec table ──────────────────────────────────────────────────────────
interface LevelSpec {
  worldNum: number;
  gridSize: number;
  elements: string[];
  difficulty: number;
}

export function getLevelSpec(levelNum: number): LevelSpec {
  // Helper: linear interpolation inside a range
  const lerp = (n: number, start: number, end: number, dMin: number, dMax: number) => {
    const t = (n - start) / Math.max(1, end - start);
    return dMin + t * (dMax - dMin);
  };

  let worldNum: number;
  let difficulty: number;

  if (levelNum <= 10) {
    worldNum = 1;
    difficulty = lerp(levelNum, 1, 10, 0.0, 1.0);
  } else if (levelNum <= 20) {
    worldNum = 2;
    difficulty = lerp(levelNum, 11, 20, 0.0, 1.0);
  } else if (levelNum <= 30) {
    // Even → W1 (4×4), Odd → W2 (5×5)
    worldNum = levelNum % 2 === 0 ? 1 : 2;
    difficulty = lerp(levelNum, 21, 30, 0.4, 1.0);
  } else if (levelNum <= 40) {
    worldNum = 3;
    difficulty = lerp(levelNum, 31, 40, 0.0, 1.0);
  } else if (levelNum <= 50) {
    // Even → W2 (5×5), Odd → W3 (6×6)
    worldNum = levelNum % 2 === 0 ? 2 : 3;
    difficulty = lerp(levelNum, 41, 50, 0.4, 1.0);
  } else if (levelNum <= 60) {
    worldNum = 4;
    difficulty = lerp(levelNum, 51, 60, 0.0, 1.0);
  } else {
    // levels 61-70: Even → W3 (6×6), Odd → W4 (7×7)
    worldNum = levelNum % 2 === 0 ? 3 : 4;
    difficulty = lerp(levelNum, 61, 70, 0.7, 1.0);
  }

  const gridSize = worldNum + 3; // W1→4, W2→5, W3→6, W4→7
  const elements = WORLD_ELEMENTS[worldNum];

  return { worldNum, gridSize, elements, difficulty };
}

// ── Level cache ───────────────────────────────────────────────────────────────
const levelCache: Record<number, Level> = {};

export function getHardcoreLevel(levelNum: number): Level | null {
  if (levelNum < 1 || levelNum > 70) return null;
  if (!levelCache[levelNum]) {
    levelCache[levelNum] = generateHardcoreLevel(levelNum);
  }
  return levelCache[levelNum];
}

// ── Generator ─────────────────────────────────────────────────────────────────
export function generateHardcoreLevel(levelNum: number): Level {
  const { worldNum, gridSize, elements, difficulty } = getLevelSpec(levelNum);

  // Spec seed formula — deterministic per level number + difficulty
  const seed = levelNum * 97 + 13 + Math.floor(difficulty * 50);
  const rng = seededRandom(seed);

  const solution = generateLatinSquare(gridSize, elements, rng);
  let zoneMap = partitionGrid(gridSize, rng);
  zoneMap = splitZonesByUniqueness(zoneMap, solution, gridSize);

  // Build zone groups
  const zoneGroups: Map<number, [number, number][]> = new Map();
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const id = zoneMap[r][c];
      if (!zoneGroups.has(id)) zoneGroups.set(id, []);
      zoneGroups.get(id)!.push([r, c]);
    }
  }

  const zones: Zone[] = [];
  let zoneIndex = 0;
  for (const [, cells] of zoneGroups) {
    const ingredients = [...new Set(cells.map(([r, c]) => solution[r][c]))].sort();
    const recipeName = findRecipe(worldNum, ingredients) ?? getFallbackName(ingredients);
    zones.push({
      id: `hz${zoneIndex}`,
      recipeName,
      ingredients,
      cells: cells.map(([r, c]) => ({ row: r, col: c })),
    });
    zoneIndex++;
  }

  return {
    id: `hardcore-${levelNum}`,
    worldId: 'hardcore',
    size: gridSize,
    elements,
    zones,
    canonicalSolution: solution,
    starThresholds: { three: 60, two: 120 },
  };
}
