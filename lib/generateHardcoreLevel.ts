/**
 * Hardcore level generator — runtime, Park-Miller LCG, recipe-first zone placement.
 * 70 fixed levels cached at module level. No single-cell merging. No fallback insertion.
 * Star thresholds: fixed { three: 60, two: 120 } for all levels.
 */
import type { Level, Zone } from './types';
import { WORLD_ELEMENTS } from './levelGenerator';
import { buildLatinSquare, getRecipeDefs, runGenerateZones } from './generatorUtils';

// ── Level spec table ──────────────────────────────────────────────────────────

interface LevelSpec {
  worldNum: number;
  gridSize: number;
  elements: string[];
  difficulty: number;
}

export function getLevelSpec(levelNum: number): LevelSpec {
  const lerp = (n: number, lo: number, hi: number, dMin: number, dMax: number) => {
    const t = (n - lo) / Math.max(1, hi - lo);
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
    // Levels 61-70: Even → W3 (6×6), Odd → W4 (7×7)
    worldNum = levelNum % 2 === 0 ? 3 : 4;
    difficulty = lerp(levelNum, 61, 70, 0.7, 1.0);
  }

  const gridSize = worldNum + 3; // W1→4, W2→5, W3→6, W4→7
  const elements = WORLD_ELEMENTS[worldNum];
  return { worldNum, gridSize, elements, difficulty };
}

// ── Module-level cache ────────────────────────────────────────────────────────

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
  const recipeDefs = getRecipeDefs(worldNum);
  const size = gridSize;

  // Spec seed formula
  const seed = levelNum * 97 + 13 + Math.floor(difficulty * 50);

  // Park-Miller Latin square (identical algorithm to Endless, different seed)
  const solution = buildLatinSquare(elements, seed);

  // Retry loop — up to 20 attempts with Hardcore-specific seed variation
  let zones: Zone[] = [];

  for (let attempt = 0; attempt < 20; attempt++) {
    const attemptSeed = levelNum * 1000 + attempt * 137;
    const candidate = runGenerateZones(solution, recipeDefs, attemptSeed, difficulty, size, 'hz');
    const covered = candidate.reduce((s, z) => s + z.cells.length, 0);
    if (covered === size * size) {
      zones = candidate;
      break;
    }
    // Keep last attempt; no fallback insert in Hardcore per spec
    if (attempt === 19) zones = candidate;
  }

  return {
    id: `hardcore-${levelNum}`,
    worldId: 'hardcore',
    size,
    elements,
    zones,
    canonicalSolution: solution,
    starThresholds: { three: 60, two: 120 },
  };
}
