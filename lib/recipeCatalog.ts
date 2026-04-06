import { WORLD_ELEMENTS, WORLD_RECIPES } from './levelGenerator';
import type { CatalogRecipe } from '../constants/recipeCatalog';

function buildFullCatalog(): CatalogRecipe[] {
  const seen = new Map<string, CatalogRecipe>();

  // 1-ingredient: every base element is a "recipe" of itself
  Object.entries(WORLD_ELEMENTS).forEach(([w, elements]) => {
    const worldNum = Number(w);
    elements.forEach((el) => {
      if (!seen.has(el)) {
        seen.set(el, { name: el, ingredients: [el], world: worldNum });
      }
    });
  });

  // Multi-ingredient recipes from every world (first world wins on name collision)
  Object.entries(WORLD_RECIPES).forEach(([w, recipes]) => {
    const worldNum = Number(w);
    Object.entries(recipes).forEach(([key, recipeName]) => {
      if (!seen.has(key)) {
        seen.set(key, { name: recipeName, ingredients: key.split('+'), world: worldNum });
      }
    });
  });

  return Array.from(seen.values());
}

export const RECIPE_CATALOG: CatalogRecipe[] = buildFullCatalog();

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
