import { WORLD_ELEMENTS, WORLD_RECIPES } from './levelGenerator';

export interface RecipeCatalogEntry {
  ingredients: string[];
  recipeName: string;
}

// Deduplicated flat catalog of all known recipes across all worlds
function buildCatalog(): RecipeCatalogEntry[] {
  const seen = new Map<string, RecipeCatalogEntry>();

  // 1-ingredient entries: every base element becomes a "recipe" of itself
  const allElements = new Set(Object.values(WORLD_ELEMENTS).flat());
  for (const el of allElements) {
    seen.set(el, { ingredients: [el], recipeName: el });
  }

  // Multi-ingredient recipes from every world (first world wins on collision)
  for (const worldRecipes of Object.values(WORLD_RECIPES)) {
    for (const [key, recipeName] of Object.entries(worldRecipes)) {
      if (!seen.has(key)) {
        seen.set(key, { ingredients: key.split('+'), recipeName });
      }
    }
  }

  return Array.from(seen.values());
}

export const RECIPE_CATALOG: RecipeCatalogEntry[] = buildCatalog();

export const ZONE_COLORS: string[] = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#65a30d', '#d97706', '#7c3aed',
  '#0891b2',
];

export function maxZoneSizeForGrid(size: number): number {
  if (size <= 5) return Math.min(5, size);
  if (size <= 7) return Math.min(7, size);
  return Math.min(size, size);
}

export function isCellsConnected(cells: { row: number; col: number }[]): boolean {
  if (cells.length <= 1) return true;
  const set = new Set(cells.map(({ row, col }) => `${row},${col}`));
  const visited = new Set<string>();
  const queue = [cells[0]];
  visited.add(`${cells[0].row},${cells[0].col}`);
  while (queue.length > 0) {
    const { row, col } = queue.shift()!;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const k = `${row + dr},${col + dc}`;
      if (set.has(k) && !visited.has(k)) {
        visited.add(k);
        queue.push({ row: row + dr, col: col + dc });
      }
    }
  }
  return visited.size === cells.length;
}

export function isAdjacentToSet(
  cells: { row: number; col: number }[],
  r: number,
  c: number,
): boolean {
  if (cells.length === 0) return true;
  return cells.some(({ row, col }) => Math.abs(row - r) + Math.abs(col - c) === 1);
}
