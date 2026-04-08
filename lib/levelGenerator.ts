import type { Level, Zone, ElementID } from './types';

export const WORLD_ELEMENTS: Record<number, string[]> = {
  1: ['Wind', 'Earth', 'Fire', 'Water'],
  2: ['Wood', 'Metal', 'Glass', 'Rubber', 'Plastic'],
  3: ['Metal', 'Rubber', 'Plastic', 'Glass', 'Electricity', 'Fuel'],
  4: ['Water', 'Heat', 'Gas', 'Carbon', 'Metal', 'Acid', 'Base'],
  5: ['Particle', 'Wave', 'Energy', 'Void', 'Spin', 'Field', 'Observer', 'Charge'],
  6: ['Cell', 'Water', 'Light', 'Carbon', 'Oxygen', 'Nitrogen', 'Heat', 'Acid', 'Enzyme'],
  7: ['Stone', 'Wood', 'Metal', 'Fire', 'Knowledge', 'Labor', 'Time', 'Soil', 'Water', 'Spirit'],
  8: ['Wind', 'Rain', 'Thunder', 'Frost', 'Heat', 'Fog', 'Pressure', 'Drought', 'Flood', 'Storm', 'Rainbow'],
};

type RecipeMap = Record<string, string>;

export const WORLD_RECIPES: Record<number, RecipeMap> = {
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
    'Glass+Metal+Plastic': 'Display',
    'Glass+Rubber+Wood': 'Handle',
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
    // 2-element
    'Rain+Wind': 'Drizzle',
    'Frost+Rain': 'Hail',
    'Rain+Thunder': 'Sleet',
    'Flood+Rain': 'Monsoon',
    'Drought+Rain': 'Acid Rain',
    'Fog+Rain': 'Mist',
    'Rain+Storm': 'Downpour',
    'Heat+Rain': 'Mirage',
    'Rain+Rainbow': 'Waterfall',
    'Pressure+Rain': 'Puddle',
    'Frost+Wind': 'Blizzard',
    'Drought+Wind': 'Dust Storm',
    'Storm+Wind': 'Gale',
    'Pressure+Wind': 'Tornado',
    'Heat+Wind': 'Sirocco',
    'Fog+Wind': 'Whirlwind',
    'Thunder+Wind': 'Squall',
    'Rainbow+Wind': 'Breeze',
    'Flood+Wind': 'Sandstorm',
    'Heat+Thunder': 'Lightning',
    'Frost+Thunder': 'Thundersnow',
    'Storm+Thunder': 'Supercell',
    'Flood+Thunder': 'Flash Flood',
    'Fog+Thunder': 'Thunder Fog',
    'Drought+Thunder': 'Dry Storm',
    'Rainbow+Thunder': 'Storm Arc',
    'Flood+Frost': 'Black Ice',
    'Drought+Frost': 'Permafrost',
    'Frost+Pressure': 'Freeze',
    'Fog+Frost': 'Ice Fog',
    'Frost+Storm': 'Polar Vortex',
    'Frost+Heat': 'Frostfire',
    'Frost+Rainbow': 'Sun Dog',
    'Drought+Heat': 'Scorched',
    'Flood+Heat': 'Steam',
    'Fog+Heat': 'Smog',
    'Heat+Pressure': 'Hot Spring',
    'Heat+Rainbow': 'Sunshower',
    'Fog+Pressure': 'Pea Souper',
    'Fog+Rainbow': 'Fogbow',
    'Flood+Fog': 'Fog Bank',
    'Drought+Fog': 'Haboob',
    'Fog+Storm': 'Dead Calm',
    'Drought+Pressure': 'Flash Drought',
    'Drought+Flood': 'Dust Devil',
    'Flood+Pressure': 'Surge',
    'Flood+Rainbow': 'Double Rainbow',
    'Flood+Storm': 'Storm Surge',
    'Pressure+Storm': 'Eye',
    'Rainbow+Storm': 'Storm Bow',
    // 3-element
    'Pressure+Storm+Wind': 'Hurricane',
    'Flood+Frost+Pressure': 'Avalanche',
    'Rain+Storm+Wind': 'Typhoon',
    'Frost+Rainbow+Wind': 'Aurora',
    'Pressure+Storm+Thunder': 'Superstorm',
    'Drought+Heat+Wind': 'Sandfire',
    'Pressure+Rain+Wind': 'Cyclone',
    'Flood+Storm+Wind': 'Waterspout',
    'Frost+Pressure+Rain': 'Freezing Rain',
    'Flood+Heat+Rain': 'Rainforest',
    'Frost+Rain+Wind': 'Snowstorm',
    'Frost+Rain+Thunder': 'Ice Storm',
    'Drought+Frost+Heat': 'Desert Night',
    'Flood+Fog+Rain': 'Sea Fog',
    'Flood+Heat+Wind': 'Steam Devil',
    'Frost+Pressure+Wind': 'Arctic Blast',
    'Heat+Pressure+Thunder': 'Ball Lightning',
    'Rain+Rainbow+Thunder': 'Rainbow Storm',
    'Fog+Storm+Thunder': 'Shelf Cloud',
    'Drought+Thunder+Wind': 'Derecho',
    // 4-element
    'Frost+Rain+Storm+Wind': "Nor'easter",
    'Drought+Fog+Frost+Pressure': 'Polar Night',
    'Drought+Heat+Pressure+Wind': 'Heat Dome',
    'Flood+Frost+Rain+Wind': 'Lake Effect',
    'Flood+Pressure+Rain+Storm': 'Megaflood',
    'Drought+Heat+Storm+Wind': 'Firenado',
    'Drought+Frost+Pressure+Wind': 'Ice Age',
    'Pressure+Rain+Thunder+Wind': 'Thunderstorm Cell',
    'Rain+Storm+Thunder+Wind': 'Squall Line',
    'Drought+Heat+Rain+Wind': 'Virga',
    'Drought+Heat+Thunder+Wind': 'Flash Fire',
    // 5-element
    'Pressure+Rain+Storm+Thunder+Wind': 'Perfect Storm',
    'Drought+Flood+Frost+Pressure+Wind': 'Glacier',
    'Flood+Heat+Rain+Storm+Wind': 'El Nino',
    'Frost+Pressure+Storm+Thunder+Wind': 'Polar Storm',
    'Flood+Pressure+Rain+Storm+Thunder': 'Deluge',
    'Drought+Heat+Storm+Thunder+Wind': 'Firestorm',
    // 6-element
    'Drought+Flood+Frost+Heat+Rain+Wind': 'Climate',
    'Flood+Heat+Pressure+Rain+Storm+Wind': 'Monsoon System',
    'Fog+Frost+Pressure+Storm+Thunder+Wind': 'Polar Vortex System',
    // 7-element
    'Drought+Flood+Frost+Heat+Pressure+Rain+Wind': 'Ice Age Cycle',
    'Frost+Heat+Pressure+Rain+Storm+Thunder+Wind': 'Jet Stream',
    // 8-element
    'Drought+Fog+Frost+Heat+Pressure+Rain+Thunder+Wind': 'Global Weather',
    'Drought+Flood+Frost+Heat+Rain+Rainbow+Storm+Wind': 'Climate Shift',
    // 9-element
    'Fog+Frost+Heat+Pressure+Rain+Rainbow+Storm+Thunder+Wind': 'Atmosphere',
    'Drought+Flood+Frost+Heat+Pressure+Rain+Storm+Thunder+Wind': 'Extreme Weather',
    // 10-element
    'Drought+Flood+Fog+Frost+Heat+Rain+Rainbow+Storm+Thunder+Wind': 'The Tempest',
    "Drought+Flood+Fog+Frost+Heat+Pressure+Rain+Storm+Thunder+Wind": "Earth's Weather",
    // 11-element (all)
    'Drought+Flood+Fog+Frost+Heat+Pressure+Rain+Rainbow+Storm+Thunder+Wind': 'Climate',
  },
};

export function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateLatinSquare(size: number, elements: string[], rng: () => number): string[][] {
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

// Returns a max zone size appropriate for the given grid size and level position.
// 4 difficulty tiers per world:
//   Easy    levels  1-7  : small zones, gentle introduction
//   Medium  levels  8-15 : moderate zone size
//   Hard    levels 16-22 : large zones
//   Extreme levels 23-30 : full grid-size zones, all combinations possible
//
// Base scales with grid so larger worlds never produce swarms of tiny zones.
// Extreme always = gridSize (full combination space).
//   4×4  → 2 / 3 / 4 / 4
//   7×7  → 4 / 5 / 6 / 7
//   11×11→ 6 / 8 / 10 / 11
export function getMaxZoneSize(gridSize: number, levelInWorld: number): number {
  const tier = levelInWorld <= 7 ? 0 : levelInWorld <= 15 ? 1 : levelInWorld <= 22 ? 2 : 3;
  const base = Math.max(2, Math.round(gridSize / 2));
  const range = gridSize - base;
  const fractions = [0, 0.4, 0.8, 1.0];
  return base + Math.round(range * fractions[tier]);
}

// Picks a zone size biased toward the max — smaller zones remain possible
// to produce interesting single-cell "locked" hints organically.
export function boundedZoneSize(max: number, rng: () => number): number {
  const r = rng();
  if (max <= 2) {
    return r < 0.25 ? 1 : 2;
  }
  if (max === 3) {
    if (r < 0.08) return 1;
    if (r < 0.42) return 2;
    return 3;
  }
  if (max === 4) {
    if (r < 0.05) return 1;
    if (r < 0.25) return 2;
    if (r < 0.55) return 3;
    return 4;
  }
  // max >= 5 (larger grids)
  if (r < 0.05) return 2;
  if (r < 0.20) return 3;
  if (r < 0.45) return 4;
  if (r < 0.75) return 5;
  return Math.min(max, 6);
}

export function partitionGrid(size: number, rng: () => number, maxZoneSize?: number): number[][] {
  const cap = maxZoneSize ?? 4;
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

    const zoneSize = boundedZoneSize(cap, rng);
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

export function weightedZoneSize(rng: () => number): number {
  return boundedZoneSize(4, rng);
}

export function splitZonesByUniqueness(
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

  for (const [, cells] of zoneGroups) {
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

function popcount(n: number): number {
  let c = 0;
  while (n) { c += n & 1; n >>>= 1; }
  return c;
}

function buildAllowMasks(
  zones: { ingredients: string[]; cells: { row: number; col: number }[] }[],
  elements: string[],
  size: number
): number[][] {
  const elIdx: Record<string, number> = {};
  elements.forEach((e, i) => (elIdx[e] = i));
  const full = (1 << elements.length) - 1;
  const allow = Array.from({ length: size }, () => Array(size).fill(full));
  for (const z of zones) {
    let ing = 0;
    for (const e of z.ingredients) ing |= 1 << elIdx[e];
    for (const { row, col } of z.cells) allow[row][col] = ing;
  }
  return allow;
}

function countSolutionsUpTo(
  allow: number[][],
  size: number,
  limit: number
): number {
  let count = 0;
  const rowM = Array(size).fill(0);
  const colM = Array(size).fill(0);
  const board: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));

  function solve() {
    if (count >= limit) return;
    let bR = -1, bC = -1, bCnt = size + 1, bCands = 0;
    outer: for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] !== -1) continue;
        const cands = allow[r][c] & ~(rowM[r] | colM[c]);
        const cnt = popcount(cands);
        if (cnt === 0) return;
        if (cnt < bCnt) { bR = r; bC = c; bCnt = cnt; bCands = cands; if (cnt === 1) break outer; }
      }
    }
    if (bR === -1) { count++; return; }
    let cands = bCands;
    while (cands) {
      const bit = cands & (-cands); cands &= ~bit;
      board[bR][bC] = bit; rowM[bR] |= bit; colM[bC] |= bit;
      solve();
      rowM[bR] &= ~bit; colM[bC] &= ~bit; board[bR][bC] = -1;
    }
  }
  solve();
  return count;
}

function findFirstAmbiguousCell(
  allow: number[][],
  size: number
): { r: number; c: number } | null {
  const sols: number[][][] = [];
  const rowM = Array(size).fill(0);
  const colM = Array(size).fill(0);
  const board: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));

  function solve() {
    if (sols.length >= 2) return;
    let bR = -1, bC = -1, bCnt = size + 1, bCands = 0;
    outer: for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] !== -1) continue;
        const cands = allow[r][c] & ~(rowM[r] | colM[c]);
        const cnt = popcount(cands);
        if (cnt === 0) return;
        if (cnt < bCnt) { bR = r; bC = c; bCnt = cnt; bCands = cands; if (cnt === 1) break outer; }
      }
    }
    if (bR === -1) { sols.push(board.map((row) => [...row])); return; }
    let cands = bCands;
    while (cands) {
      const bit = cands & (-cands); cands &= ~bit;
      board[bR][bC] = bit; rowM[bR] |= bit; colM[bC] |= bit;
      solve();
      rowM[bR] &= ~bit; colM[bC] &= ~bit; board[bR][bC] = -1;
    }
  }
  solve();
  if (sols.length < 2) return null;
  const [s1, s2] = sols;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (s1[r][c] !== s2[r][c]) return { r, c };
  return null;
}

function getConnectedComponents(
  cells: { row: number; col: number }[]
): { row: number; col: number }[][] {
  const cellSet = new Set(cells.map((c) => `${c.row},${c.col}`));
  const visited = new Set<string>();
  const components: { row: number; col: number }[][] = [];

  for (const start of cells) {
    const key = `${start.row},${start.col}`;
    if (visited.has(key)) continue;
    const component: { row: number; col: number }[] = [];
    const queue = [start];
    visited.add(key);
    while (queue.length) {
      const { row, col } = queue.shift()!;
      component.push({ row, col });
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as [number, number][]) {
        const nk = `${row + dr},${col + dc}`;
        if (cellSet.has(nk) && !visited.has(nk)) {
          visited.add(nk);
          queue.push({ row: row + dr, col: col + dc });
        }
      }
    }
    components.push(component);
  }
  return components;
}

export function enforceUniqueness(
  zones: { id: string; recipeName: string; ingredients: string[]; cells: { row: number; col: number }[] }[],
  solution: string[][],
  elements: string[],
  size: number,
  worldNum: number
): typeof zones {
  let result = zones.map((z) => ({ ...z, cells: [...z.cells], ingredients: [...z.ingredients] }));
  let nextId = Math.max(...result.map((z) => parseInt(z.id.slice(1)) || 0)) + 1;

  for (let iter = 0; iter < 60; iter++) {
    const allow = buildAllowMasks(result, elements, size);
    if (countSolutionsUpTo(allow, size, 2) <= 1) break;
    const cell = findFirstAmbiguousCell(allow, size);
    if (!cell) break;

    const { r, c } = cell;
    const canonEl = solution[r][c];
    const zIdx = result.findIndex((z) => z.cells.some((cell) => cell.row === r && cell.col === c));
    if (zIdx === -1) break;

    const z = result[zIdx];
    const remaining = z.cells.filter((cell) => !(cell.row === r && cell.col === c));

    // Always add the pinned cell as its own single-element zone
    result.push({
      id: `z${nextId++}`,
      recipeName: canonEl,
      ingredients: [canonEl],
      cells: [{ row: r, col: c }],
    });

    if (remaining.length === 0) {
      // Remove the original zone entirely
      result.splice(zIdx, 1);
    } else {
      // Split remaining cells into connected components (removing pinned cell may disconnect)
      const components = getConnectedComponents(remaining);
      // Replace original zone with first component
      const firstIng = [...new Set(components[0].map((cell) => solution[cell.row][cell.col]))].sort();
      result[zIdx] = {
        ...z,
        cells: components[0],
        ingredients: firstIng,
        recipeName: findRecipe(worldNum, firstIng) ?? getFallbackName(firstIng),
      };
      // Add extra zones for any additional components
      for (let i = 1; i < components.length; i++) {
        const ing = [...new Set(components[i].map((cell) => solution[cell.row][cell.col]))].sort();
        result.push({
          id: `z${nextId++}`,
          recipeName: findRecipe(worldNum, ing) ?? getFallbackName(ing),
          ingredients: ing,
          cells: components[i],
        });
      }
    }
  }

  return result;
}

export function findRecipe(worldNum: number, ingredients: string[]): string | null {
  const key = [...ingredients].sort().join('+');
  return WORLD_RECIPES[worldNum]?.[key] ?? null;
}

// For zones whose combo isn't in the catalog: show ingredients honestly
// rather than inventing a fake generic name.
// Single-element zones always use the element name directly.
export function getFallbackName(ingredients: string[]): string {
  if (ingredients.length === 1) return ingredients[0];
  return ingredients.join(' + ');
}

// Kept for call sites in enforceUniqueness; delegates to getFallbackName.
function getUniqueFallbackName(ingredients: string[], _used: Set<string>): string {
  return getFallbackName(ingredients);
}

export function getStarThresholds(worldNum: number): { three: number; two: number } {
  const map: Record<number, { three: number; two: number }> = {
    1: { three: 60,  two: 120  },
    2: { three: 90,  two: 180  },
    3: { three: 150, two: 300  },
    4: { three: 240, two: 480  },
    5: { three: 360, two: 720  },
    6: { three: 480, two: 960  },
    7: { three: 600, two: 1200 },
    8: { three: 720, two: 1440 },
  };
  return map[worldNum] ?? { three: 60, two: 120 };
}

export function generateLevel(worldNum: number, levelInWorld: number): Level {
  const gridSize = worldNum + 3; // 1->4, 2->5, ... 8->11
  const elements = WORLD_ELEMENTS[worldNum];
  // Wide-scatter seed: same tier levels get very different random streams
  let h = worldNum * 374761393 + levelInWorld * 668265263 + worldNum * levelInWorld * 2246822519;
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  const globalSeed = (h ^ (h >>> 16)) >>> 0;

  // Try up to 8 partition seeds; keep the attempt with fewest duplicate ingredient sets
  let bestSolution: string[][] = [];
  let bestRawZones: { ingredients: string[]; cells: { row: number; col: number }[] }[] = [];
  let bestDupes = Infinity;

  for (let attempt = 0; attempt < 8 && bestDupes > 0; attempt++) {
    const rng = seededRandom(globalSeed + attempt * 7919);
    const solution = generateLatinSquare(gridSize, elements, rng);
    const maxZoneSize = getMaxZoneSize(gridSize, levelInWorld);
    let zoneMap = partitionGrid(gridSize, rng, maxZoneSize);
    zoneMap = splitZonesByUniqueness(zoneMap, solution, gridSize);

    const zoneGroups: Map<number, [number, number][]> = new Map();
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const id = zoneMap[r][c];
        if (!zoneGroups.has(id)) zoneGroups.set(id, []);
        zoneGroups.get(id)!.push([r, c]);
      }
    }

    const rawZones: { ingredients: string[]; cells: { row: number; col: number }[] }[] = [];
    const seenKeys = new Set<string>();
    let dupes = 0;
    for (const [, cells] of zoneGroups) {
      const ingredients = [...new Set(cells.map(([r, c]) => solution[r][c]))].sort();
      const key = ingredients.join('+');
      if (seenKeys.has(key)) dupes++;
      seenKeys.add(key);
      rawZones.push({ ingredients, cells: cells.map(([r, c]) => ({ row: r, col: c })) });
    }

    if (dupes < bestDupes) {
      bestDupes = dupes;
      bestSolution = solution;
      bestRawZones = rawZones;
    }
  }

  // Assign recipe names — single elements use element name, known combos use the
  // catalog recipe name (duplicates allowed), unknown combos show ingredients joined.
  // Never invent fake generic names.
  const zones: Zone[] = bestRawZones.map((z, i) => {
    let recipeName: string;
    if (z.ingredients.length === 1) {
      recipeName = z.ingredients[0];
    } else {
      recipeName = findRecipe(worldNum, z.ingredients) ?? z.ingredients.join(' + ');
    }
    return { id: `z${i}`, recipeName, ingredients: z.ingredients, cells: z.cells };
  });

  const numStr = levelInWorld.toString().padStart(2, '0');
  return {
    id: `w${worldNum}-l${numStr}`,
    worldId: `world${worldNum}`,
    size: gridSize,
    elements,
    zones,
    canonicalSolution: bestSolution,
    starThresholds: getStarThresholds(worldNum),
  };
}
