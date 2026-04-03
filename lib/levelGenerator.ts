import type { Level, Zone, ElementID } from './types';

export const WORLD_ELEMENTS: Record<number, string[]> = {
  1: ['Wind', 'Earth', 'Fire', 'Water'],
  2: ['Wood', 'Metal', 'Glass', 'Rubber', 'Plastic'],
  3: ['Metal', 'Rubber', 'Plastic', 'Glass', 'Electricity', 'Fuel'],
  4: ['Water', 'Heat', 'Gas', 'Carbon', 'Metal', 'Acid', 'Base'],
  5: ['Particle', 'Wave', 'Energy', 'Void', 'Spin', 'Field', 'Observer', 'Charge'],
  6: ['Cell', 'Water', 'Light', 'Carbon', 'Oxygen', 'Nitrogen', 'Heat', 'Acid', 'Enzyme'],
  7: ['Stone', 'Wood', 'Metal', 'Fire', 'Knowledge', 'Labor', 'Time', 'Soil', 'Water', 'Spirit'],
  8: ['Void', 'Light', 'Gravity', 'Plasma', 'Dust', 'Ice', 'Time', 'Magnetism', 'Radiation', 'Gas', 'Dark Matter'],
};

type RecipeMap = Record<string, string>;

const WORLD_RECIPES: Record<number, RecipeMap> = {
  1: {
    'Earth+Water': 'Mud',
    'Fire+Wind': 'Lightning',
    'Earth+Wind': 'Dust',
    'Fire+Water': 'Steam',
    'Water+Wind': 'Ice',
    'Earth+Fire': 'Lava',
    'Fire+Water+Wind': 'Storm',
    'Earth+Fire+Wind': 'Sand',
    'Earth+Fire+Water': 'Clay',
    'Earth+Water+Wind': 'Life',
    'Earth+Fire+Water+Wind': 'Energy',
  },
  2: {
    'Metal+Wood': 'Plywood',
    'Glass+Metal': 'Mirror',
    'Glass+Rubber': 'Goggle',
    'Plastic+Rubber': 'Seal',
    'Plastic+Wood': 'Crate',
    'Glass+Wood': 'Window',
    'Metal+Rubber': 'Tire',
    'Metal+Plastic': 'Case',
    'Rubber+Wood': 'Slingshot',
    'Glass+Plastic': 'Laminate',
    'Glass+Metal+Wood': 'Frame',
    'Metal+Plastic+Rubber': 'Gear',
    'Glass+Plastic+Wood': 'Greenhouse',
    'Glass+Metal+Rubber': 'Spring',
    'Plastic+Rubber+Wood': 'Bumper',
    'Metal+Rubber+Wood': 'Clamp',
    'Metal+Plastic+Wood': 'Fixture',
    'Glass+Plastic+Rubber': 'Grip',
    'Glass+Metal+Rubber+Wood': 'Machine',
    'Glass+Metal+Plastic+Rubber': 'Device',
    'Glass+Plastic+Rubber+Wood': 'Cabinet',
    'Metal+Plastic+Rubber+Wood': 'Console',
    'Glass+Metal+Plastic+Wood': 'Toolkit',
    'Glass+Metal+Plastic+Rubber+Wood': 'Core',
  },
  3: {
    'Electricity+Metal': 'Wire',
    'Plastic+Rubber': 'Gasket',
    'Metal+Plastic': 'Pipe',
    'Glass+Metal': 'Switch',
    'Metal+Rubber': 'Coil',
    'Electricity+Glass': 'Cell',
    'Fuel+Plastic': 'Tank',
    'Fuel+Rubber': 'Valve',
    'Fuel+Glass': 'Flare',
    'Electricity+Rubber': 'Cable',
    'Glass+Rubber': 'Goggle',
    'Electricity+Plastic': 'Chip',
    'Glass+Plastic': 'Screen',
    'Fuel+Metal': 'Burner',
    'Electricity+Fuel': 'Welder',
    'Electricity+Fuel+Metal': 'Motor',
    'Electricity+Glass+Plastic': 'Sensor',
    'Fuel+Metal+Rubber': 'Pump',
    'Glass+Plastic+Rubber': 'Filter',
    'Electricity+Metal+Rubber': 'Solenoid',
    'Fuel+Glass+Plastic': 'Lantern',
    'Electricity+Glass+Rubber': 'Vacuum Tube',
    'Fuel+Metal+Plastic': 'Canister',
    'Glass+Metal+Rubber': 'Gauge',
    'Electricity+Fuel+Glass': 'Lighthouse',
    'Glass+Metal+Plastic': 'Visor',
    'Electricity+Fuel+Rubber': 'Dynamo',
    'Electricity+Fuel+Plastic': 'Battery',
    'Electricity+Glass+Metal': 'Relay',
    'Electricity+Metal+Plastic': 'Circuit',
    'Fuel+Plastic+Rubber': 'Hose',
    'Metal+Plastic+Rubber': 'Piston',
    'Electricity+Plastic+Rubber': 'Cartridge',
    'Fuel+Glass+Rubber': 'Nozzle',
    'Fuel+Glass+Metal': 'Turbine',
    'Electricity+Fuel+Metal+Rubber': 'Generator',
    'Electricity+Fuel+Glass+Metal': 'Reactor',
    'Electricity+Glass+Plastic+Rubber': 'Amplifier',
    'Electricity+Glass+Metal+Plastic': 'Transformer',
    'Fuel+Glass+Plastic+Rubber': 'Compressor',
    'Fuel+Metal+Plastic+Rubber': 'Furnace',
    'Electricity+Metal+Plastic+Rubber': 'Regulator',
    'Fuel+Glass+Metal+Rubber': 'Pressure Vessel',
    'Electricity+Fuel+Metal+Plastic': 'Terminal',
    'Electricity+Fuel+Plastic+Rubber': 'Exhaust',
    'Electricity+Fuel+Glass+Rubber': 'Floodlight',
    'Glass+Metal+Plastic+Rubber': 'Cockpit',
    'Electricity+Glass+Metal+Rubber': 'Processor',
    'Electricity+Fuel+Metal+Plastic+Rubber': 'Powercore',
    'Electricity+Fuel+Glass+Metal+Rubber': 'Rig',
    'Electricity+Fuel+Glass+Plastic+Rubber': 'Capsule',
    'Electricity+Glass+Metal+Plastic+Rubber': 'Network',
    'Fuel+Glass+Metal+Plastic+Rubber': 'System',
    'Electricity+Fuel+Glass+Metal+Plastic+Rubber': 'Engine',
  },
  4: {
    'Heat+Water': 'Brine',
    'Gas+Water': 'Vapor',
    'Carbon+Water': 'Ink',
    'Metal+Water': 'Rust',
    'Acid+Water': 'Blight',
    'Base+Water': 'Alkali',
    'Gas+Heat': 'Arc Plasma',
    'Carbon+Gas': 'Smog',
    'Gas+Metal': 'Ingot',
    'Acid+Gas': 'Acid Cloud',
    'Base+Gas': 'Foam',
    'Carbon+Heat': 'Resin',
    'Carbon+Metal': 'Coal',
    'Acid+Carbon': 'Limestone',
    'Heat+Metal': 'Alloy',
    'Acid+Heat': 'Cinder',
    'Acid+Metal': 'Etch',
    'Base+Metal': 'Oxide',
    'Acid+Base': 'Salt',
    'Gas+Heat+Water': 'Tonic',
    'Carbon+Heat+Water': 'Calcium',
    'Heat+Metal+Water': 'Deposit',
    'Acid+Heat+Water': 'Potion',
    'Base+Heat+Water': 'Cement',
    'Carbon+Gas+Water': 'Haze',
    'Gas+Metal+Water': 'Dross',
    'Acid+Gas+Water': 'Solvent',
    'Base+Gas+Water': 'Spray',
    'Carbon+Metal+Water': 'Pigment',
    'Acid+Carbon+Water': 'Reagent',
    'Base+Carbon+Water': 'Slurry',
    'Acid+Metal+Water': 'Lotion',
    'Base+Metal+Water': 'Rinse',
    'Acid+Base+Water': 'Antidote',
    'Carbon+Gas+Heat': 'Graphite',
    'Gas+Heat+Metal': 'Smelt',
    'Acid+Gas+Heat': 'Fume',
    'Base+Gas+Heat': 'Calciner',
    'Carbon+Heat+Metal': 'Crucible',
    'Acid+Carbon+Heat': 'Char',
    'Acid+Heat+Metal': 'Blaze',
    'Base+Heat+Metal': 'Quench',
    'Acid+Base+Heat': 'Flash',
    'Carbon+Gas+Metal': 'Rocket',
    'Acid+Carbon+Gas': 'Fumarate',
    'Base+Carbon+Gas': 'Cloud',
    'Acid+Gas+Metal': 'Corrosion',
    'Base+Gas+Metal': 'Vent',
    'Acid+Base+Gas': 'Aerosol',
    'Acid+Carbon+Metal': 'Tarnish',
    'Base+Carbon+Metal': 'Compound',
    'Acid+Base+Carbon': 'Vinegar',
    'Acid+Base+Metal': 'Patina',
    'Carbon+Gas+Heat+Water': 'Formula',
    'Acid+Base+Heat+Metal': 'Converter',
    'Carbon+Gas+Heat+Metal+Water': 'Mixture',
    'Acid+Base+Carbon+Gas+Heat+Metal+Water': 'Solution',
  },
  5: {
    'Energy+Wave': 'Photon',
    'Charge+Particle': 'Ion',
    'Charge+Wave': 'Pulse',
    'Energy+Field': 'Aura',
    'Field+Spin': 'Arc',
    'Void+Wave': 'Echo',
    'Observer+Wave': 'Signal',
    'Energy+Spin': 'Vortex',
    'Charge+Spin': 'Torque',
    'Particle+Wave': 'Quanta',
    'Energy+Observer': 'Radiance',
    'Charge+Field': 'Flux',
    'Energy+Void': 'Warp',
    'Observer+Void': 'Ghost',
    'Charge+Energy': 'Glow',
    'Charge+Particle+Spin': 'Atom',
    'Charge+Field+Particle': 'Electron',
    'Observer+Spin+Wave': 'Quantum',
    'Particle+Void+Wave': 'Qubit',
    'Energy+Field+Wave': 'Resonance',
    'Energy+Observer+Wave': 'Spectrum',
    'Energy+Field+Observer': 'Beacon',
    'Energy+Particle+Spin': 'Momentum',
    'Charge+Observer+Wave': 'Event',
    'Energy+Particle+Wave': 'String',
    'Observer+Spin+Void': 'Anomaly',
    'Field+Observer+Spin': 'Gyroscope',
    'Charge+Field+Void': 'Fold',
    'Charge+Spin+Wave': 'Helix',
    'Field+Void+Wave': 'Dark Field',
    'Field+Particle+Spin+Wave': 'Entanglement',
    'Observer+Particle+Void+Wave': 'Superposition',
    'Charge+Field+Particle+Spin': 'Hadron',
    'Observer+Spin+Void+Wave': 'Wave Function',
    'Field+Observer+Spin+Void': 'Singularity',
    'Energy+Particle+Void+Wave': 'Many Worlds',
    'Energy+Field+Void+Wave': 'Spacetime',
    'Charge+Energy+Field+Void': 'Dark Energy',
    'Charge+Energy+Field+Particle+Wave': 'God Particle',
    'Energy+Particle+Spin+Void+Wave': 'Schrodinger',
    'Charge+Energy+Observer+Particle+Void': 'Quantum Leap',
    'Energy+Field+Observer+Spin+Void': 'Phantom',
    'Energy+Field+Observer+Particle+Spin+Wave': 'Observer Effect',
    'Charge+Field+Observer+Particle+Void+Wave': 'Uncertainty',
    'Charge+Energy+Field+Particle+Spin+Void+Wave': 'Superstring',
    'Charge+Energy+Field+Observer+Particle+Spin+Void+Wave': 'Unified Field',
  },
  6: {
    'Cell+Light': 'Algae',
    'Carbon+Cell': 'Bacteria',
    'Carbon+Light': 'Glucose',
    'Cell+Oxygen': 'Membrane',
    'Carbon+Water': 'Seed',
    'Light+Oxygen': 'Leaf',
    'Heat+Water': 'Geyser',
    'Acid+Water': 'Foam',
    'Oxygen+Water': 'Bubble',
    'Heat+Oxygen': 'Ozone',
    'Carbon+Nitrogen': 'Pheromone',
    'Acid+Carbon': 'Amber',
    'Cell+Nitrogen': 'Hormone',
    'Acid+Enzyme': 'Activator',
    'Acid+Cell': 'Bile',
    'Carbon+Cell+Nitrogen': 'DNA',
    'Cell+Oxygen+Water': 'Blood',
    'Carbon+Cell+Water': 'Embryo',
    'Carbon+Heat+Nitrogen': 'Egg',
    'Cell+Heat+Water': 'Fever',
    'Acid+Cell+Nitrogen': 'Toxin',
    'Carbon+Enzyme+Nitrogen': 'Protein',
    'Heat+Light+Water': 'Rain',
    'Heat+Nitrogen+Water': 'Sweat',
    'Cell+Heat+Oxygen': 'Respiration',
    'Carbon+Light+Oxygen': 'Photosynthesis',
    'Cell+Enzyme+Nitrogen': 'Immune Cell',
    'Acid+Carbon+Heat': 'Fossil',
    'Cell+Nitrogen+Oxygen': 'Neuron',
    'Cell+Enzyme+Light': 'Vision',
    'Carbon+Cell+Enzyme+Nitrogen': 'Genome',
    'Acid+Carbon+Cell+Heat': 'Mutation',
    'Carbon+Cell+Nitrogen+Oxygen': 'Brain',
    'Carbon+Cell+Light+Nitrogen': 'Chlorophyll',
    'Carbon+Cell+Enzyme+Heat': 'Evolution',
    'Cell+Enzyme+Nitrogen+Water': 'Antibody',
    'Acid+Carbon+Heat+Nitrogen': 'Fungi',
    'Acid+Enzyme+Nitrogen+Oxygen': 'Sting',
    'Carbon+Cell+Light+Nitrogen+Oxygen': 'Ecosystem',
    'Carbon+Cell+Enzyme+Nitrogen+Oxygen': 'Consciousness',
    'Carbon+Cell+Enzyme+Light+Nitrogen': 'Symbiosis',
    'Carbon+Cell+Heat+Light+Water': 'Life Force',
    'Carbon+Cell+Heat+Nitrogen+Oxygen+Water': 'Breath',
    'Carbon+Cell+Light+Nitrogen+Oxygen+Water': 'Biosphere',
    'Acid+Carbon+Cell+Heat+Light+Nitrogen+Water': 'Ancient Life',
    'Acid+Carbon+Cell+Heat+Light+Nitrogen+Oxygen+Water': 'Deep Biology',
    'Acid+Carbon+Cell+Enzyme+Heat+Light+Nitrogen+Oxygen+Water': 'Primordial Soup',
  },
  7: {
    'Metal+Stone': 'Blade',
    'Labor+Stone': 'Mine',
    'Metal+Wood': 'Axe',
    'Fire+Wood': 'Torch',
    'Labor+Soil': 'Farm',
    'Stone+Water': 'Well',
    'Labor+Wood': 'Lumber',
    'Fire+Metal': 'Forge',
    'Spirit+Stone': 'Shrine',
    'Spirit+Wood': 'Totem',
    'Knowledge+Metal': 'Coin',
    'Knowledge+Wood': 'Scroll',
    'Knowledge+Time': 'Calendar',
    'Metal+Spirit': 'Idol',
    'Soil+Time': 'Crop',
    'Fire+Labor+Metal': 'Hammer',
    'Labor+Metal+Wood': 'Wheel',
    'Labor+Water+Wood': 'Boat',
    'Fire+Knowledge+Metal': 'Sword',
    'Fire+Labor+Stone': 'Armor',
    'Knowledge+Labor+Soil': 'Harvest',
    'Knowledge+Labor+Water': 'Irrigation',
    'Knowledge+Labor+Stone': 'Tower',
    'Knowledge+Time+Wood': 'Library',
    'Labor+Spirit+Stone': 'Temple',
    'Knowledge+Spirit+Time': 'Dynasty',
    'Knowledge+Spirit+Water': 'Legend',
    'Knowledge+Metal+Time': 'Map',
    'Knowledge+Labor+Metal': 'Market',
    'Labor+Stone+Time': 'Arch',
    'Knowledge+Labor+Stone+Water': 'Aqueduct',
    'Labor+Metal+Stone+Water': 'Dam',
    'Fire+Labor+Metal+Spirit': 'Army',
    'Knowledge+Labor+Spirit+Stone': 'Palace',
    'Knowledge+Labor+Stone+Time': 'Pyramid',
    'Labor+Stone+Water+Wood': 'Bridge',
    'Fire+Knowledge+Labor+Stone': 'Colosseum',
    'Knowledge+Labor+Spirit+Stone': 'Tablet',
    'Knowledge+Labor+Metal+Spirit+Stone': 'Empire',
    'Knowledge+Labor+Metal+Soil+Stone': 'Civilization',
    'Knowledge+Labor+Metal+Water+Wood': 'Fleet',
    'Knowledge+Labor+Spirit+Stone+Wood': 'Cathedral',
    'Fire+Knowledge+Labor+Metal+Spirit+Stone': 'Golden Age',
    'Fire+Knowledge+Labor+Metal+Time+Water': 'Revolution',
    'Fire+Knowledge+Labor+Metal+Soil+Spirit+Stone': 'Ancient Empire',
    'Fire+Knowledge+Labor+Metal+Soil+Spirit+Stone+Water': 'Civilization Full',
    'Fire+Knowledge+Labor+Metal+Soil+Spirit+Stone+Time+Water': 'Chronicle',
    'Fire+Knowledge+Labor+Metal+Soil+Spirit+Stone+Time+Water+Wood': 'Golden Age',
  },
  8: {
    'Dust+Gas': 'Nebula',
    'Light+Radiation': 'Laser',
    'Gravity+Light': 'Lensing',
    'Radiation+Time': 'Decay',
    'Gravity+Time': 'Orbit',
    'Ice+Time': 'Glacier',
    'Plasma+Radiation': 'Flare',
    'Magnetism+Plasma': 'Solar Wind',
    'Light+Void': 'Ghost Star',
    'Dust+Light': 'Shadow',
    'Ice+Radiation': 'Frost',
    'Dust+Ice': 'Tail',
    'Dust+Time': 'Debris',
    'Gravity+Void': 'Abyss',
    'Gas+Void': 'Gas Cloud',
    'Gas+Gravity+Plasma': 'Star',
    'Dust+Gravity+Time': 'Asteroid',
    'Magnetism+Plasma+Radiation': 'Pulsar',
    'Magnetism+Radiation+Time': 'Magnetar',
    'Dust+Gas+Gravity': 'Protostar',
    'Dust+Gravity+Ice': 'Planet',
    'Dark Matter+Gravity+Light': 'Dark Halo',
    'Dark Matter+Gravity+Void': 'Dark Web',
    'Gas+Plasma+Radiation': 'Shockwave',
    'Ice+Magnetism+Time': 'Polar Cap',
    'Gravity+Light+Time': 'Epoch',
    'Dust+Gas+Ice': 'Comet Storm',
    'Ice+Magnetism+Radiation': 'Permafrost',
    'Gravity+Time+Void': 'Time Dilation',
    'Gas+Magnetism+Plasma': 'Magnetic Storm',
    'Gas+Gravity+Plasma+Radiation': 'Supernova',
    'Gravity+Magnetism+Plasma+Radiation': 'Neutron Star',
    'Dark Matter+Dust+Gravity+Void': 'Dark Mass',
    'Gravity+Light+Time+Void': 'Event Horizon',
    'Dust+Gravity+Ice+Time': 'Ice Planet',
    'Dust+Gravity+Light+Plasma': 'Quasar',
    'Gravity+Light+Plasma+Radiation': 'Blazar',
    'Dust+Gas+Gravity+Plasma': 'Stellar Nursery',
    'Dust+Gravity+Light+Magnetism+Plasma': 'Galaxy',
    'Dust+Gas+Gravity+Plasma+Radiation': 'Nebula Core',
    'Gravity+Light+Magnetism+Plasma+Time': 'White Dwarf',
    'Gas+Gravity+Light+Plasma+Time': 'Red Giant',
    'Dark Matter+Dust+Gravity+Light+Magnetism+Void': 'Dark Galaxy',
    'Dust+Gas+Gravity+Ice+Light+Plasma': 'Solar System',
    'Gas+Gravity+Ice+Magnetism+Plasma+Radiation': 'Magnetosphere',
    'Dust+Gas+Gravity+Light+Plasma+Radiation+Time': 'Cosmic Dawn',
    'Dark Matter+Gravity+Light+Magnetism+Radiation+Time+Void': 'Dark Universe',
    'Dust+Gas+Gravity+Ice+Light+Magnetism+Plasma+Radiation': 'Observable Universe',
    'Dust+Gas+Gravity+Ice+Light+Magnetism+Plasma+Time': 'Cosmic Web',
    'Dust+Gas+Gravity+Ice+Light+Magnetism+Plasma+Radiation+Time': 'Multiverse',
    'Dust+Gravity+Ice+Light+Magnetism+Plasma+Radiation+Time+Void': 'Big Bang',
    'Dust+Gas+Gravity+Ice+Light+Magnetism+Plasma+Radiation+Time+Void': 'Heat Death',
    'Dark Matter+Dust+Gas+Gravity+Ice+Light+Magnetism+Plasma+Radiation+Time': 'Inflation',
    'Dark Matter+Dust+Gas+Gravity+Ice+Light+Magnetism+Plasma+Radiation+Time+Void': 'Universe',
  },
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateLatinSquare(size: number, elements: string[], rng: () => number): string[][] {
  const shuffled = shuffleArray(elements, rng);
  const grid: string[][] = [];
  for (let r = 0; r < size; r++) {
    const row: string[] = [];
    for (let c = 0; c < size; c++) {
      row.push(shuffled[(r + c) % size]);
    }
    grid.push(row);
  }
  // Shuffle rows
  const rowOrder = shuffleArray([...Array(size).keys()], rng);
  const rowShuffled = rowOrder.map((i) => grid[i]);
  // Shuffle cols
  const colOrder = shuffleArray([...Array(size).keys()], rng);
  return rowShuffled.map((row) => colOrder.map((c) => row[c]));
}

function partitionGrid(size: number, rng: () => number): number[][] {
  const zoneGrid = Array.from({ length: size }, () => new Array(size).fill(-1));
  let zoneId = 0;

  const cells: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      cells.push([r, c]);
    }
  }

  const shuffledCells = shuffleArray(cells, rng);

  for (const [startR, startC] of shuffledCells) {
    if (zoneGrid[startR][startC] !== -1) continue;

    const zoneSize = weightedZoneSize(rng);
    const queue: [number, number][] = [[startR, startC]];
    const zone: [number, number][] = [];

    while (queue.length > 0 && zone.length < zoneSize) {
      const idx = Math.floor(rng() * queue.length);
      const [r, c] = queue.splice(idx, 1)[0];
      if (zoneGrid[r][c] !== -1) continue;
      zoneGrid[r][c] = zoneId;
      zone.push([r, c]);

      const neighbors: [number, number][] = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && zoneGrid[nr][nc] === -1) {
          queue.push([nr, nc]);
        }
      }
    }

    if (zone.length > 0) zoneId++;
  }

  // Fill any remaining cells with single-cell zones
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (zoneGrid[r][c] === -1) {
        zoneGrid[r][c] = zoneId++;
      }
    }
  }

  return zoneGrid;
}

function weightedZoneSize(rng: () => number): number {
  const r = rng();
  if (r < 0.15) return 2;
  if (r < 0.45) return 3;
  if (r < 0.75) return 4;
  if (r < 0.90) return 5;
  return 6;
}

function splitZonesByUniqueness(
  zoneMap: number[][],
  solution: string[][],
  size: number
): number[][] {
  const result = zoneMap.map((row) => [...row]);
  let nextId = Math.max(...result.flat()) + 1;

  const zoneGroups: Map<number, [number, number][]> = new Map();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = result[r][c];
      if (!zoneGroups.has(id)) zoneGroups.set(id, []);
      zoneGroups.get(id)!.push([r, c]);
    }
  }

  for (const [zId, cells] of zoneGroups) {
    const seen = new Set<string>();
    const needSplit: [number, number][] = [];

    for (const [r, c] of cells) {
      const el = solution[r][c];
      if (seen.has(el)) {
        needSplit.push([r, c]);
      } else {
        seen.add(el);
      }
    }

    for (const [r, c] of needSplit) {
      result[r][c] = nextId++;
    }
  }

  return result;
}

const FALLBACK_NAMES_2 = ['Blend', 'Mix', 'Fusion', 'Alloy', 'Bond'];
const FALLBACK_NAMES_3 = ['Compound', 'Mixture', 'Amalgam', 'Infusion', 'Synthesis'];
const FALLBACK_NAMES_4PLUS = ['Formula', 'Concoction', 'Tincture', 'Elixir', 'Essence'];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function findRecipe(worldNum: number, ingredients: string[]): string | null {
  const key = [...ingredients].sort().join('+');
  return WORLD_RECIPES[worldNum]?.[key] ?? null;
}

function getFallbackName(ingredients: string[]): string {
  const key = ingredients.join('+');
  const h = hashString(key);
  if (ingredients.length === 2) return FALLBACK_NAMES_2[h % FALLBACK_NAMES_2.length];
  if (ingredients.length === 3) return FALLBACK_NAMES_3[h % FALLBACK_NAMES_3.length];
  return FALLBACK_NAMES_4PLUS[h % FALLBACK_NAMES_4PLUS.length];
}

export function getStarThresholds(worldNum: number): { three: number; two: number } {
  const map: Record<number, { three: number; two: number }> = {
    1: { three: 60, two: 120 },
    2: { three: 90, two: 180 },
    3: { three: 150, two: 300 },
    4: { three: 240, two: 480 },
    5: { three: 360, two: 720 },
    6: { three: 480, two: 960 },
    7: { three: 600, two: 1200 },
    8: { three: 720, two: 1440 },
  };
  return map[worldNum] ?? { three: 60, two: 120 };
}

export function generateLevel(worldNum: number, levelInWorld: number): Level {
  const gridSize = worldNum + 3; // 1->4, 2->5, ... 8->11
  const elements = WORLD_ELEMENTS[worldNum];
  const globalSeed = (worldNum * 1000) + levelInWorld * 37 + (levelInWorld * levelInWorld) % 97;
  const rng = seededRandom(globalSeed);

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
      id: `z${zoneIndex}`,
      recipeName,
      ingredients,
      cells: cells.map(([r, c]) => ({ row: r, col: c })),
    });
    zoneIndex++;
  }

  const numStr = levelInWorld.toString().padStart(2, '0');
  return {
    id: `w${worldNum}-l${numStr}`,
    worldId: `world${worldNum}`,
    size: gridSize,
    elements,
    zones,
    canonicalSolution: solution,
    starThresholds: getStarThresholds(worldNum),
  };
}
