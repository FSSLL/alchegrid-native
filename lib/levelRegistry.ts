import type { WorldInfo, Level } from './types';
import { generateLevel } from './levelGenerator';

export const LEVELS_PER_WORLD = 30;
export const TOTAL_WORLDS = 8;

export const WORLD_INFO: WorldInfo[] = [
  { id: 'world1', name: 'Nature Lab', worldNumber: 1, size: 4, elements: ['Wind', 'Earth', 'Fire', 'Water'], available: true, globalStart: 1, globalEnd: 30 },
  { id: 'world2', name: 'Materials Workshop', worldNumber: 2, size: 5, elements: ['Wood', 'Metal', 'Glass', 'Rubber', 'Plastic'], available: true, globalStart: 31, globalEnd: 60 },
  { id: 'world3', name: 'Machines & Power', worldNumber: 3, size: 6, elements: ['Metal', 'Rubber', 'Plastic', 'Glass', 'Electricity', 'Fuel'], available: true, globalStart: 61, globalEnd: 90 },
  { id: 'world4', name: 'Chemistry Lab', worldNumber: 4, size: 7, elements: ['Water', 'Heat', 'Gas', 'Carbon', 'Metal', 'Acid', 'Base'], available: true, globalStart: 91, globalEnd: 120 },
  { id: 'world5', name: 'Quantum Realm', worldNumber: 5, size: 8, elements: ['Particle', 'Wave', 'Energy', 'Void', 'Spin', 'Field', 'Observer', 'Charge'], available: false, globalStart: 121, globalEnd: 150 },
  { id: 'world6', name: 'Biology', worldNumber: 6, size: 9, elements: ['Cell', 'Water', 'Light', 'Carbon', 'Oxygen', 'Nitrogen', 'Heat', 'Acid', 'Enzyme'], available: false, globalStart: 151, globalEnd: 180 },
  { id: 'world7', name: 'Civilization', worldNumber: 7, size: 10, elements: ['Stone', 'Wood', 'Metal', 'Fire', 'Knowledge', 'Labor', 'Time', 'Soil', 'Water', 'Spirit'], available: false, globalStart: 181, globalEnd: 210 },
  { id: 'world8', name: 'Cosmos', worldNumber: 8, size: 11, elements: ['Void', 'Light', 'Gravity', 'Plasma', 'Dust', 'Ice', 'Time', 'Magnetism', 'Radiation', 'Gas', 'Dark Matter'], available: false, globalStart: 211, globalEnd: 240 },
];

export function globalToWorld(globalLevel: number): { worldIndex: number; levelInWorld: number } {
  const worldIndex = Math.floor((globalLevel - 1) / LEVELS_PER_WORLD);
  const levelInWorld = ((globalLevel - 1) % LEVELS_PER_WORLD) + 1;
  return { worldIndex, levelInWorld };
}

export function getLevelData(globalLevel: number): Level | null {
  if (globalLevel < 1 || globalLevel > TOTAL_WORLDS * LEVELS_PER_WORLD) return null;
  const { worldIndex, levelInWorld } = globalToWorld(globalLevel);
  return generateLevel(worldIndex + 1, levelInWorld);
}

export function isWorldUnlocked(worldNumber: number, progressIndex: number): boolean {
  if (worldNumber === 1) return true;
  const prevWorldEnd = WORLD_INFO[worldNumber - 2].globalEnd;
  return progressIndex >= prevWorldEnd;
}
