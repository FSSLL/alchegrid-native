export type ElementID = string;

export type CellCoord = { row: number; col: number };

export type Zone = {
  id: string;
  recipeName: string | null;
  ingredients: ElementID[];
  cells: CellCoord[];
};

export type Level = {
  id: string;
  worldId: string;
  size: number;
  elements: ElementID[];
  zones: Zone[];
  canonicalSolution: ElementID[][];
  starThresholds: { three: number; two: number };
};

export type WorldInfo = {
  id: string;
  name: string;
  worldNumber: number;
  size: number;
  elements: string[];
  available: boolean;
  globalStart: number;
  globalEnd: number;
};
