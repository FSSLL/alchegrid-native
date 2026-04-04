/**
 * Shared generator utilities for Endless and Hardcore modes.
 * Uses Park-Miller LCG (distinct from the campaign LCG).
 */
import type { Zone } from './types';
import { WORLD_RECIPES } from './levelGenerator';

// ── Park-Miller LCG ──────────────────────────────────────────────────────────

export function seededRand(seed: number): () => number {
  let s = ((seed % 2147483647) + 2147483647) % 2147483647;
  if (s === 0) s = 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Utilities ────────────────────────────────────────────────────────────────

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 4-strategy Latin square (Park-Miller version) ───────────────────────────

/**
 * Builds a Latin square using Park-Miller LCG + 4 construction strategies.
 * Strategy 0: grid[r][c] = (offsets[r] + c) % n
 * Strategy 1: grid[r][c] = (offsets[r] + mult*c) % n  (mult coprime to n)
 * Strategy 2: transpose of strategy 0
 * Strategy 3: transpose of strategy 1
 * Then applies rowPerm, colPerm, symbolPerm.
 */
export function buildLatinSquare(elements: string[], seed: number): string[][] {
  const n = elements.length;
  const rand = seededRand(seed);
  const sh = <T>(a: T[]) => shuffle(a, rand);

  const strategy = Math.floor(rand() * 4);
  const offsets = sh([...Array(n).keys()].map((i) => i)) as number[];

  let mult = 1;
  if (strategy === 1 || strategy === 3) {
    const coprimes: number[] = [];
    for (let m = 2; m < n; m++) {
      if (gcd(m, n) === 1) coprimes.push(m);
    }
    if (coprimes.length > 0) mult = coprimes[Math.floor(rand() * coprimes.length)];
  }

  let numericGrid: number[][];
  if (strategy === 0 || strategy === 1) {
    const m = strategy === 1 ? mult : 1;
    numericGrid = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => (offsets[r] + m * c) % n),
    );
  } else {
    // Compute base first, then transpose
    const m = strategy === 3 ? mult : 1;
    const base = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => (offsets[r] + m * c) % n),
    );
    numericGrid = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => base[c][r]),
    );
  }

  const rowPerm = sh([...Array(n).keys()].map((i) => i)) as number[];
  const colPerm = sh([...Array(n).keys()].map((i) => i)) as number[];
  const symbolPerm = sh([...Array(n).keys()].map((i) => i)) as number[];

  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) =>
      elements[symbolPerm[numericGrid[rowPerm[r]][colPerm[c]]]],
    ),
  );
}

// ── Recipe types & helpers ───────────────────────────────────────────────────

export interface RecipeDef {
  name: string;
  ingredients: string[];
}

export function getRecipeDefs(worldNum: number): RecipeDef[] {
  const recipes = WORLD_RECIPES[worldNum];
  if (!recipes) return [];
  return Object.entries(recipes).map(([key, name]) => ({
    name,
    ingredients: key.split('+'),
  }));
}

// ── Recipe-first zone BFS ────────────────────────────────────────────────────

/**
 * Tries to build a contiguous zone starting at `start` using `recipe`.
 * The start cell's element must appear in the recipe ingredients.
 * Expands BFS to adjacent uncovered cells until all ingredients are placed.
 * Returns null if it's impossible to complete the zone.
 */
export function tryBuildZone(
  start: { row: number; col: number },
  recipe: RecipeDef,
  solution: string[][],
  covered: Set<string>,
  size: number,
  rand: () => number,
): { row: number; col: number }[] | null {
  const needed = [...recipe.ingredients];
  const startEl = solution[start.row][start.col];
  const idx = needed.indexOf(startEl);
  if (idx === -1) return null;
  needed.splice(idx, 1);

  const zone = [start];
  const inZone = new Set([`${start.row},${start.col}`]);

  while (needed.length > 0) {
    const candidates: { row: number; col: number; el: string }[] = [];
    for (const cell of zone) {
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as [number, number][]) {
        const nr = cell.row + dr;
        const nc = cell.col + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const nkey = `${nr},${nc}`;
        if (covered.has(nkey) || inZone.has(nkey)) continue;
        const el = solution[nr][nc];
        if (needed.includes(el)) candidates.push({ row: nr, col: nc, el });
      }
    }
    if (candidates.length === 0) return null;

    const pick = candidates[Math.floor(rand() * candidates.length)];
    needed.splice(needed.indexOf(pick.el), 1);
    zone.push({ row: pick.row, col: pick.col });
    inZone.add(`${pick.row},${pick.col}`);
  }

  return zone;
}

/**
 * Recipe-first zone generation.
 * For each uncovered cell (in shuffled order):
 *   1. Collect all recipes containing the cell's element
 *   2. Sort by size preference (difficulty-based)
 *   3. Try each via tryBuildZone — use first success
 *   4. Fallback: 1-cell zone
 */
export function runGenerateZones(
  solution: string[][],
  recipeDefs: RecipeDef[],
  seed: number,
  difficulty: number,
  size: number,
  zonePrefix: string,
): Zone[] {
  const rand = seededRand(seed * 31 + 7);

  const allCells: { row: number; col: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      allCells.push({ row: r, col: c });
    }
  }
  const shuffledCells = shuffle(allCells, rand);

  const minIngredients = difficulty < 0.3 ? 2 : difficulty < 0.7 ? 2 : 3;
  const preferLarger = difficulty > 0.5;

  const sortedRecipes = [...recipeDefs].sort((a, b) =>
    preferLarger
      ? b.ingredients.length - a.ingredients.length
      : a.ingredients.length - b.ingredients.length,
  );

  const covered = new Set<string>();
  const zones: Zone[] = [];
  let zoneId = 0;

  for (const startCell of shuffledCells) {
    const key = `${startCell.row},${startCell.col}`;
    if (covered.has(key)) continue;

    const startEl = solution[startCell.row][startCell.col];
    const candidates = sortedRecipes.filter((r) => r.ingredients.includes(startEl));

    // Preferred: size >= minIngredients (when preferLarger) or all (when not)
    const preferred = preferLarger
      ? candidates.filter((r) => r.ingredients.length >= minIngredients)
      : candidates;
    const fallback = candidates.filter((r) => !preferred.includes(r));

    let zoneResult: { row: number; col: number }[] | null = null;
    let chosenRecipe: RecipeDef | null = null;

    for (const recipe of [...preferred, ...fallback]) {
      const result = tryBuildZone(startCell, recipe, solution, covered, size, rand);
      if (result !== null) {
        zoneResult = result;
        chosenRecipe = recipe;
        break;
      }
    }

    if (zoneResult === null || chosenRecipe === null) {
      covered.add(key);
      zones.push({
        id: `${zonePrefix}${zoneId++}`,
        recipeName: startEl,
        ingredients: [startEl],
        cells: [startCell],
      });
    } else {
      zoneResult.forEach((c) => covered.add(`${c.row},${c.col}`));
      zones.push({
        id: `${zonePrefix}${zoneId++}`,
        recipeName: chosenRecipe.name,
        ingredients: [...chosenRecipe.ingredients].sort(),
        cells: zoneResult,
      });
    }
  }

  return zones;
}

// ── Single-cell zone merging (Endless only) ──────────────────────────────────

/**
 * Reduces single-cell zones by merging them with adjacent zones when a valid
 * recipe exists for the combined ingredients. Merges until singleCount <= maxSingles
 * or no more merges are possible.
 */
export function mergeSingleCellZones(
  zones: Zone[],
  recipeDefs: RecipeDef[],
  size: number,
  maxSingles: number,
): Zone[] {
  let result = [...zones];

  const getSingles = () => result.filter((z) => z.cells.length === 1);

  let iterations = 0;
  while (getSingles().length > maxSingles && iterations++ < 300) {
    const singles = getSingles();
    let merged = false;

    outerLoop: for (const single of singles) {
      const { row, col } = single.cells[0];
      const singleEl = single.ingredients[0];

      // Try merging with an adjacent multi-cell zone
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as [number, number][]) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;

        const neighbor = result.find(
          (z) => z !== single && z.cells.some((c) => c.row === nr && c.col === nc),
        );
        if (!neighbor) continue;

        const combined = [...new Set([...neighbor.ingredients, singleEl])].sort();
        const recipe = recipeDefs.find(
          (r) => [...r.ingredients].sort().join('+') === combined.join('+'),
        );

        if (recipe) {
          result = result.filter((z) => z !== single && z !== neighbor);
          result.push({
            id: neighbor.id,
            recipeName: recipe.name,
            ingredients: [...recipe.ingredients].sort(),
            cells: [...neighbor.cells, single.cells[0]],
          });
          merged = true;
          break outerLoop;
        }
      }

      // Try merging two adjacent single-cell zones
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as [number, number][]) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;

        const other = singles.find(
          (z) => z !== single && z.cells[0].row === nr && z.cells[0].col === nc,
        );
        if (!other) continue;

        const combined = [singleEl, other.ingredients[0]].sort();
        const recipe = recipeDefs.find(
          (r) => [...r.ingredients].sort().join('+') === combined.join('+'),
        );

        if (recipe) {
          result = result.filter((z) => z !== single && z !== other);
          result.push({
            id: single.id,
            recipeName: recipe.name,
            ingredients: [...recipe.ingredients].sort(),
            cells: [single.cells[0], other.cells[0]],
          });
          merged = true;
          break outerLoop;
        }
      }
    }

    if (!merged) break;
  }

  return result;
}
