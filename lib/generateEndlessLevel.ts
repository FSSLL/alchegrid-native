import { generateLevel } from './levelGenerator';
import type { Level } from './types';

export const GRID_TO_WORLD: Record<number, number> = { 4: 1, 5: 2, 6: 3, 7: 4 };

const ENDLESS_STAR_THRESHOLDS: Record<number, { three: number; two: number }> = {
  4: { three: 60,  two: 120 },
  5: { three: 90,  two: 180 },
  6: { three: 150, two: 300 },
  7: { three: 240, two: 480 },
};

export function generateEndlessLevel(
  gridSize: number,
  difficulty: number,
  levelIndex: number,
): Level {
  const worldNum = GRID_TO_WORLD[gridSize] ?? 1;

  // Spec seed formula — guarantees diverse, deterministic levels
  const seed = 50000 + levelIndex * 137 + gridSize * 7919 + Math.floor(difficulty * 100);
  // Map seed to levelInWorld in 1–97 range (97 prime → maximal distribution)
  const levelInWorld = (seed % 97) + 1;

  const base = generateLevel(worldNum, levelInWorld);

  return {
    ...base,
    id: `endless-${levelIndex}`,
    worldId: `endless-w${worldNum}`,
    starThresholds: ENDLESS_STAR_THRESHOLDS[gridSize] ?? { three: 60, two: 120 },
  };
}
