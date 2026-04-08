/**
 * Comprehensive level generator for Alchegrid.
 * Run: node artifacts/alchegrid/scripts/generateLevels.cjs
 *
 * Outputs:
 *   artifacts/alchegrid/lib/levelData.ts          — 240 official levels (Worlds 1-8, 30 per world)
 *   artifacts/alchegrid/lib/hardcoreLevelData.ts  — 70 hardcore levels
 *   artifacts/alchegrid/lib/endlessLevelData.ts   — 240 endless levels
 *
 * Algorithm: Latin-square → BFS partition → uniqueness split → connectivity repair
 *            → 500-attempt fitness loop → combination pass → singleton budget pass
 * Fitness score: (invalidZones × 1000) + singletonCount
 * Singleton budget: floor(gridSize / 2)
 */
'use strict';
const fs   = require('fs');
const path = require('path');

// ── World definitions ─────────────────────────────────────────────────────────

const WORLD_ELEMENTS = {
  1: ['Wind', 'Earth', 'Fire', 'Water'],
  2: ['Wood', 'Metal', 'Glass', 'Rubber', 'Plastic'],
  3: ['Metal', 'Rubber', 'Plastic', 'Glass', 'Electricity', 'Fuel'],
  4: ['Water', 'Heat', 'Gas', 'Carbon', 'Metal', 'Acid', 'Base'],
  5: ['Particle', 'Wave', 'Energy', 'Void', 'Spin', 'Field', 'Observer', 'Charge'],
  6: ['Cell', 'Water', 'Light', 'Carbon', 'Oxygen', 'Nitrogen', 'Heat', 'Acid', 'Enzyme'],
  7: ['Stone', 'Wood', 'Metal', 'Fire', 'Knowledge', 'Labor', 'Time', 'Soil', 'Water', 'Spirit'],
  8: ['Wind', 'Rain', 'Thunder', 'Frost', 'Heat', 'Fog', 'Pressure', 'Drought', 'Flood', 'Storm', 'Rainbow'],
};

// ── Recipe catalog ─────────────────────────────────────────────────────────────

const WORLD_RECIPES = {
  1: {
    'Earth+Water':'Mud','Fire+Wind':'Lightning','Earth+Wind':'Dust',
    'Fire+Water':'Steam','Water+Wind':'Ice','Earth+Fire':'Lava',
    'Fire+Water+Wind':'Storm','Earth+Fire+Wind':'Sand',
    'Earth+Fire+Water':'Clay','Earth+Water+Wind':'Life',
    'Earth+Fire+Water+Wind':'Energy',
  },
  2: {
    'Metal+Wood':'Plywood','Glass+Metal':'Mirror','Glass+Rubber':'Goggle',
    'Plastic+Rubber':'Seal','Plastic+Wood':'Crate','Glass+Wood':'Window',
    'Metal+Rubber':'Tire','Metal+Plastic':'Case','Rubber+Wood':'Slingshot',
    'Glass+Plastic':'Laminate','Glass+Metal+Wood':'Frame',
    'Metal+Plastic+Rubber':'Gear','Glass+Plastic+Wood':'Greenhouse',
    'Glass+Metal+Rubber':'Spring','Plastic+Rubber+Wood':'Bumper',
    'Metal+Rubber+Wood':'Clamp','Metal+Plastic+Wood':'Fixture',
    'Glass+Plastic+Rubber':'Grip','Glass+Metal+Rubber+Wood':'Machine',
    'Glass+Metal+Plastic':'Display','Glass+Rubber+Wood':'Handle',
    'Glass+Metal+Plastic+Rubber':'Device','Glass+Plastic+Rubber+Wood':'Cabinet',
    'Metal+Plastic+Rubber+Wood':'Console','Glass+Metal+Plastic+Wood':'Toolkit',
    'Glass+Metal+Plastic+Rubber+Wood':'Core',
  },
  3: {
    'Electricity+Metal':'Wire','Plastic+Rubber':'Gasket','Metal+Plastic':'Pipe',
    'Glass+Metal':'Switch','Metal+Rubber':'Coil','Electricity+Glass':'Cell',
    'Fuel+Plastic':'Tank','Fuel+Rubber':'Valve','Fuel+Glass':'Flare',
    'Electricity+Rubber':'Cable','Glass+Rubber':'Goggle',
    'Electricity+Plastic':'Chip','Glass+Plastic':'Screen','Fuel+Metal':'Burner',
    'Electricity+Fuel':'Welder','Electricity+Fuel+Metal':'Motor',
    'Electricity+Glass+Plastic':'Sensor','Fuel+Metal+Rubber':'Pump',
    'Glass+Plastic+Rubber':'Filter','Electricity+Metal+Rubber':'Solenoid',
    'Fuel+Glass+Plastic':'Lantern','Electricity+Glass+Rubber':'Vacuum Tube',
    'Fuel+Metal+Plastic':'Canister','Glass+Metal+Rubber':'Gauge',
    'Electricity+Fuel+Glass':'Lighthouse','Glass+Metal+Plastic':'Visor',
    'Electricity+Fuel+Rubber':'Dynamo','Electricity+Fuel+Plastic':'Battery',
    'Electricity+Glass+Metal':'Relay','Electricity+Metal+Plastic':'Circuit',
    'Fuel+Plastic+Rubber':'Hose','Metal+Plastic+Rubber':'Piston',
    'Electricity+Plastic+Rubber':'Cartridge','Fuel+Glass+Rubber':'Nozzle',
    'Fuel+Glass+Metal':'Turbine','Electricity+Fuel+Metal+Rubber':'Generator',
    'Electricity+Fuel+Glass+Metal':'Reactor',
    'Electricity+Glass+Plastic+Rubber':'Amplifier',
    'Electricity+Glass+Metal+Plastic':'Transformer',
    'Fuel+Glass+Plastic+Rubber':'Compressor',
    'Fuel+Metal+Plastic+Rubber':'Furnace',
    'Electricity+Metal+Plastic+Rubber':'Regulator',
    'Fuel+Glass+Metal+Rubber':'Pressure Vessel',
    'Electricity+Fuel+Metal+Plastic':'Terminal',
    'Electricity+Fuel+Plastic+Rubber':'Exhaust',
    'Electricity+Fuel+Glass+Rubber':'Floodlight',
    'Glass+Metal+Plastic+Rubber':'Cockpit',
    'Electricity+Glass+Metal+Rubber':'Processor',
    'Electricity+Fuel+Metal+Plastic+Rubber':'Powercore',
    'Electricity+Fuel+Glass+Metal+Rubber':'Rig',
    'Electricity+Fuel+Glass+Plastic+Rubber':'Capsule',
    'Electricity+Glass+Metal+Plastic+Rubber':'Network',
    'Fuel+Glass+Metal+Plastic+Rubber':'System',
    'Electricity+Fuel+Glass+Metal+Plastic+Rubber':'Engine',
  },
  4: {
    'Heat+Water':'Brine','Gas+Water':'Vapor','Carbon+Water':'Ink',
    'Metal+Water':'Rust','Acid+Water':'Blight','Base+Water':'Alkali',
    'Gas+Heat':'Arc Plasma','Carbon+Gas':'Smog','Gas+Metal':'Ingot',
    'Acid+Gas':'Acid Cloud','Base+Gas':'Foam','Carbon+Heat':'Resin',
    'Carbon+Metal':'Coal','Acid+Carbon':'Limestone','Heat+Metal':'Alloy',
    'Acid+Heat':'Cinder','Acid+Metal':'Etch','Base+Metal':'Oxide',
    'Acid+Base':'Salt','Gas+Heat+Water':'Tonic','Carbon+Heat+Water':'Calcium',
    'Heat+Metal+Water':'Deposit','Acid+Heat+Water':'Potion',
    'Base+Heat+Water':'Cement','Carbon+Gas+Water':'Haze',
    'Gas+Metal+Water':'Dross','Acid+Gas+Water':'Solvent',
    'Base+Gas+Water':'Spray','Carbon+Metal+Water':'Pigment',
    'Acid+Carbon+Water':'Reagent','Base+Carbon+Water':'Slurry',
    'Acid+Metal+Water':'Lotion','Base+Metal+Water':'Rinse',
    'Acid+Base+Water':'Antidote','Carbon+Gas+Heat':'Graphite',
    'Gas+Heat+Metal':'Smelt','Acid+Gas+Heat':'Fume',
    'Base+Gas+Heat':'Calciner','Carbon+Heat+Metal':'Crucible',
    'Acid+Carbon+Heat':'Char','Acid+Heat+Metal':'Blaze',
    'Base+Heat+Metal':'Quench','Acid+Base+Heat':'Flash',
    'Carbon+Gas+Metal':'Rocket','Acid+Carbon+Gas':'Fumarate',
    'Base+Carbon+Gas':'Cloud','Acid+Gas+Metal':'Corrosion',
    'Base+Gas+Metal':'Vent','Acid+Base+Gas':'Aerosol',
    'Acid+Carbon+Metal':'Tarnish','Base+Carbon+Metal':'Compound',
    'Acid+Base+Carbon':'Vinegar','Acid+Base+Metal':'Patina',
    'Carbon+Gas+Heat+Water':'Formula','Acid+Base+Heat+Metal':'Converter',
    'Carbon+Gas+Heat+Metal+Water':'Mixture',
    'Acid+Base+Carbon+Gas+Heat+Metal+Water':'Solution',
  },
  5: {
    'Energy+Wave':'Photon','Charge+Particle':'Ion','Charge+Wave':'Pulse',
    'Energy+Field':'Aura','Field+Spin':'Arc','Void+Wave':'Echo',
    'Observer+Wave':'Signal','Energy+Spin':'Vortex','Charge+Spin':'Torque',
    'Particle+Wave':'Quanta','Energy+Observer':'Radiance','Charge+Field':'Flux',
    'Energy+Void':'Warp','Observer+Void':'Ghost','Charge+Energy':'Glow',
    'Charge+Particle+Spin':'Atom','Charge+Field+Particle':'Electron',
    'Observer+Spin+Wave':'Quantum','Particle+Void+Wave':'Qubit',
    'Energy+Field+Wave':'Resonance','Energy+Observer+Wave':'Spectrum',
    'Energy+Field+Observer':'Beacon','Energy+Particle+Spin':'Momentum',
    'Charge+Observer+Wave':'Event','Energy+Particle+Wave':'String',
    'Observer+Spin+Void':'Anomaly','Field+Observer+Spin':'Gyroscope',
    'Charge+Field+Void':'Fold','Charge+Spin+Wave':'Helix',
    'Field+Void+Wave':'Dark Field','Field+Particle+Spin+Wave':'Entanglement',
    'Observer+Particle+Void+Wave':'Superposition',
    'Charge+Field+Particle+Spin':'Hadron',
    'Observer+Spin+Void+Wave':'Wave Function',
    'Field+Observer+Spin+Void':'Singularity',
    'Energy+Particle+Void+Wave':'Many Worlds',
    'Energy+Field+Void+Wave':'Spacetime',
    'Charge+Energy+Field+Void':'Dark Energy',
    'Charge+Energy+Field+Particle+Wave':'God Particle',
    'Energy+Particle+Spin+Void+Wave':'Schrodinger',
    'Charge+Energy+Observer+Particle+Void':'Quantum Leap',
    'Energy+Field+Observer+Spin+Void':'Phantom',
    'Energy+Field+Observer+Particle+Spin+Wave':'Observer Effect',
    'Charge+Field+Observer+Particle+Void+Wave':'Uncertainty',
    'Charge+Energy+Field+Particle+Spin+Void+Wave':'Superstring',
    'Charge+Energy+Field+Observer+Particle+Spin+Void+Wave':'Unified Field',
  },
  6: {
    'Cell+Light':'Algae','Carbon+Cell':'Bacteria','Carbon+Light':'Glucose',
    'Cell+Oxygen':'Membrane','Carbon+Water':'Seed','Light+Oxygen':'Leaf',
    'Heat+Water':'Geyser','Acid+Water':'Foam','Oxygen+Water':'Bubble',
    'Heat+Oxygen':'Ozone','Carbon+Nitrogen':'Pheromone','Acid+Carbon':'Amber',
    'Cell+Nitrogen':'Hormone','Acid+Enzyme':'Activator','Acid+Cell':'Bile',
    'Carbon+Cell+Nitrogen':'DNA','Cell+Oxygen+Water':'Blood',
    'Carbon+Cell+Water':'Embryo','Carbon+Heat+Nitrogen':'Egg',
    'Cell+Heat+Water':'Fever','Acid+Cell+Nitrogen':'Toxin',
    'Carbon+Enzyme+Nitrogen':'Protein','Heat+Light+Water':'Rain',
    'Heat+Nitrogen+Water':'Sweat','Cell+Heat+Oxygen':'Respiration',
    'Carbon+Light+Oxygen':'Photosynthesis','Cell+Enzyme+Nitrogen':'Immune Cell',
    'Acid+Carbon+Heat':'Fossil','Cell+Nitrogen+Oxygen':'Neuron',
    'Cell+Enzyme+Light':'Vision','Carbon+Cell+Enzyme+Nitrogen':'Genome',
    'Acid+Carbon+Cell+Heat':'Mutation','Carbon+Cell+Nitrogen+Oxygen':'Brain',
    'Carbon+Cell+Light+Nitrogen':'Chlorophyll',
    'Carbon+Cell+Enzyme+Heat':'Evolution',
    'Cell+Enzyme+Nitrogen+Water':'Antibody',
    'Acid+Carbon+Heat+Nitrogen':'Fungi',
    'Acid+Enzyme+Nitrogen+Oxygen':'Sting',
    'Carbon+Cell+Light+Nitrogen+Oxygen':'Ecosystem',
    'Carbon+Cell+Enzyme+Nitrogen+Oxygen':'Consciousness',
    'Carbon+Cell+Enzyme+Light+Nitrogen':'Symbiosis',
    'Carbon+Cell+Heat+Light+Water':'Life Force',
    'Carbon+Cell+Heat+Nitrogen+Oxygen+Water':'Breath',
    'Carbon+Cell+Light+Nitrogen+Oxygen+Water':'Biosphere',
    'Acid+Carbon+Cell+Heat+Light+Nitrogen+Water':'Ancient Life',
    'Acid+Carbon+Cell+Heat+Light+Nitrogen+Oxygen+Water':'Deep Biology',
    'Acid+Carbon+Cell+Enzyme+Heat+Light+Nitrogen+Oxygen+Water':'Primordial Soup',
  },
  7: {
    'Metal+Stone':'Blade','Labor+Stone':'Mine','Metal+Wood':'Axe',
    'Fire+Wood':'Torch','Labor+Soil':'Farm','Stone+Water':'Well',
    'Labor+Wood':'Lumber','Fire+Metal':'Forge','Spirit+Stone':'Shrine',
    'Spirit+Wood':'Totem','Knowledge+Metal':'Coin','Knowledge+Wood':'Scroll',
    'Knowledge+Time':'Calendar','Metal+Spirit':'Idol','Soil+Time':'Crop',
    'Fire+Labor+Metal':'Hammer','Labor+Metal+Wood':'Wheel',
    'Labor+Water+Wood':'Boat','Fire+Knowledge+Metal':'Sword',
    'Fire+Labor+Stone':'Armor','Knowledge+Labor+Soil':'Harvest',
    'Knowledge+Labor+Water':'Irrigation','Knowledge+Labor+Stone':'Tower',
    'Knowledge+Time+Wood':'Library','Labor+Spirit+Stone':'Temple',
    'Knowledge+Spirit+Time':'Dynasty','Knowledge+Spirit+Water':'Legend',
    'Knowledge+Metal+Time':'Map','Knowledge+Labor+Metal':'Market',
    'Labor+Stone+Time':'Arch','Knowledge+Labor+Stone+Water':'Aqueduct',
    'Labor+Metal+Stone+Water':'Dam','Fire+Labor+Metal+Spirit':'Army',
    'Knowledge+Labor+Spirit+Stone':'Palace',
    'Knowledge+Labor+Stone+Time':'Pyramid',
    'Labor+Stone+Water+Wood':'Bridge',
    'Fire+Knowledge+Labor+Stone':'Colosseum',
    'Knowledge+Labor+Metal+Spirit+Stone':'Empire',
    'Knowledge+Labor+Metal+Soil+Stone':'Civilization',
    'Knowledge+Labor+Metal+Water+Wood':'Fleet',
    'Knowledge+Labor+Spirit+Stone+Wood':'Cathedral',
    'Fire+Knowledge+Labor+Metal+Spirit+Stone':'Golden Age',
    'Fire+Knowledge+Labor+Metal+Time+Water':'Revolution',
    'Fire+Knowledge+Labor+Metal+Soil+Spirit+Stone':'Ancient Empire',
    'Fire+Knowledge+Labor+Metal+Soil+Spirit+Stone+Water':'Civilization Full',
    'Fire+Knowledge+Labor+Metal+Soil+Spirit+Stone+Time+Water':'Chronicle',
    'Fire+Knowledge+Labor+Metal+Soil+Spirit+Stone+Time+Water+Wood':'Legacy',
  },
  8: {
    // 2-element
    'Rain+Wind':'Drizzle','Frost+Rain':'Hail','Rain+Thunder':'Sleet',
    'Flood+Rain':'Monsoon','Drought+Rain':'Acid Rain','Fog+Rain':'Mist',
    'Rain+Storm':'Downpour','Heat+Rain':'Mirage','Rain+Rainbow':'Waterfall',
    'Pressure+Rain':'Puddle','Frost+Wind':'Blizzard','Drought+Wind':'Dust Storm',
    'Storm+Wind':'Gale','Pressure+Wind':'Tornado','Heat+Wind':'Sirocco',
    'Fog+Wind':'Whirlwind','Thunder+Wind':'Squall','Rainbow+Wind':'Breeze',
    'Flood+Wind':'Sandstorm','Heat+Thunder':'Lightning','Frost+Thunder':'Thundersnow',
    'Storm+Thunder':'Supercell','Flood+Thunder':'Flash Flood','Fog+Thunder':'Thunder Fog',
    'Drought+Thunder':'Dry Storm','Rainbow+Thunder':'Storm Arc','Flood+Frost':'Black Ice',
    'Drought+Frost':'Permafrost','Frost+Pressure':'Freeze','Fog+Frost':'Ice Fog',
    'Frost+Storm':'Polar Vortex','Frost+Heat':'Frostfire','Frost+Rainbow':'Sun Dog',
    'Drought+Heat':'Scorched','Flood+Heat':'Steam','Fog+Heat':'Smog',
    'Heat+Pressure':'Hot Spring','Heat+Rainbow':'Sunshower','Fog+Pressure':'Pea Souper',
    'Fog+Rainbow':'Fogbow','Flood+Fog':'Fog Bank','Drought+Fog':'Haboob',
    'Fog+Storm':'Dead Calm','Drought+Pressure':'Flash Drought','Drought+Flood':'Dust Devil',
    'Flood+Pressure':'Surge','Flood+Rainbow':'Double Rainbow','Flood+Storm':'Storm Surge',
    'Pressure+Storm':'Eye','Rainbow+Storm':'Storm Bow',
    // 3-element
    'Pressure+Storm+Wind':'Hurricane','Flood+Frost+Pressure':'Avalanche',
    'Rain+Storm+Wind':'Typhoon','Frost+Rainbow+Wind':'Aurora',
    'Pressure+Storm+Thunder':'Superstorm','Drought+Heat+Wind':'Sandfire',
    'Pressure+Rain+Wind':'Cyclone','Flood+Storm+Wind':'Waterspout',
    'Frost+Pressure+Rain':'Freezing Rain','Flood+Heat+Rain':'Rainforest',
    'Frost+Rain+Wind':'Snowstorm','Frost+Rain+Thunder':'Ice Storm',
    'Drought+Frost+Heat':'Desert Night','Flood+Fog+Rain':'Sea Fog',
    'Flood+Heat+Wind':'Steam Devil','Frost+Pressure+Wind':'Arctic Blast',
    'Heat+Pressure+Thunder':'Ball Lightning','Rain+Rainbow+Thunder':'Rainbow Storm',
    'Fog+Storm+Thunder':'Shelf Cloud','Drought+Thunder+Wind':'Derecho',
    // 4-element
    'Frost+Rain+Storm+Wind':"Nor'easter",'Drought+Fog+Frost+Pressure':'Polar Night',
    'Drought+Heat+Pressure+Wind':'Heat Dome','Flood+Frost+Rain+Wind':'Lake Effect',
    'Flood+Pressure+Rain+Storm':'Megaflood','Drought+Heat+Storm+Wind':'Firenado',
    'Drought+Frost+Pressure+Wind':'Ice Age','Pressure+Rain+Thunder+Wind':'Thunderstorm Cell',
    'Rain+Storm+Thunder+Wind':'Squall Line','Drought+Heat+Rain+Wind':'Virga',
    'Drought+Heat+Thunder+Wind':'Flash Fire',
    // 5-element
    'Pressure+Rain+Storm+Thunder+Wind':'Perfect Storm',
    'Drought+Flood+Frost+Pressure+Wind':'Glacier',
    'Flood+Heat+Rain+Storm+Wind':'El Nino',
    'Frost+Pressure+Storm+Thunder+Wind':'Polar Storm',
    'Flood+Pressure+Rain+Storm+Thunder':'Deluge',
    'Drought+Heat+Storm+Thunder+Wind':'Firestorm',
    // 6-element
    'Drought+Flood+Frost+Heat+Rain+Wind':'Climate',
    'Flood+Heat+Pressure+Rain+Storm+Wind':'Monsoon System',
    'Fog+Frost+Pressure+Storm+Thunder+Wind':'Polar Vortex System',
    // 7-element
    'Drought+Flood+Frost+Heat+Pressure+Rain+Wind':'Ice Age Cycle',
    'Frost+Heat+Pressure+Rain+Storm+Thunder+Wind':'Jet Stream',
    // 8-element
    'Drought+Fog+Frost+Heat+Pressure+Rain+Thunder+Wind':'Global Weather',
    'Drought+Flood+Frost+Heat+Rain+Rainbow+Storm+Wind':'Climate Shift',
    // 9-element
    'Fog+Frost+Heat+Pressure+Rain+Rainbow+Storm+Thunder+Wind':'Atmosphere',
    'Drought+Flood+Frost+Heat+Pressure+Rain+Storm+Thunder+Wind':'Extreme Weather',
    // 10-element
    'Drought+Flood+Fog+Frost+Heat+Rain+Rainbow+Storm+Thunder+Wind':'The Tempest',
    'Drought+Flood+Fog+Frost+Heat+Pressure+Rain+Storm+Thunder+Wind':"Earth's Weather",
    // 11-element
    'Drought+Flood+Fog+Frost+Heat+Pressure+Rain+Rainbow+Storm+Thunder+Wind':'Climate',
  },
};

// ── Recipe helpers ─────────────────────────────────────────────────────────────

function findRecipe(worldNum, ingredients) {
  const key = [...ingredients].sort().join('+');
  return WORLD_RECIPES[worldNum]?.[key] ?? null;
}

function recipeName(worldNum, ingredients) {
  if (ingredients.length === 1) return ingredients[0];
  return findRecipe(worldNum, ingredients) ?? ingredients.join(' + ');
}

// ── Catalog validity set ───────────────────────────────────────────────────────

function buildCatalogNames() {
  const catPath = path.join(__dirname, '..', 'constants', 'recipeCatalog.ts');
  const src = fs.readFileSync(catPath, 'utf8');
  const byWorld = {};
  const re = /\{[^}]*\}/gs;
  let m;
  while ((m = re.exec(src)) !== null) {
    const block = m[0];
    const wm = block.match(/world:\s*(\d+)/);
    const nm = block.match(/name:\s*'([^']+)'/);
    if (wm && nm) {
      const w = parseInt(wm[1]);
      if (!byWorld[w]) byWorld[w] = new Set();
      byWorld[w].add(nm[1]);
    }
  }
  return byWorld;
}
const CATALOG_NAMES = buildCatalogNames();

function isValidZone(worldNum, ingredients, name) {
  if (ingredients.length === 1) return true;
  if (!findRecipe(worldNum, ingredients)) return false;
  return CATALOG_NAMES[worldNum]?.has(name) ?? false;
}

// ── RNG (LCG) ─────────────────────────────────────────────────────────────────

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffleArray(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Latin square ──────────────────────────────────────────────────────────────

function generateLatinSquare(size, elements, rng) {
  const shuffled = shuffleArray(elements, rng);
  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) row.push(shuffled[(r + c) % size]);
    grid.push(row);
  }
  const rowOrder = shuffleArray([...Array(size).keys()], rng);
  const rowShuffled = rowOrder.map(i => grid[i]);
  const colOrder = shuffleArray([...Array(size).keys()], rng);
  return rowShuffled.map(row => colOrder.map(c => row[c]));
}

// ── Zone size helpers ─────────────────────────────────────────────────────────

// All-Time tiers (Worlds 2-8 official + Endless)
function getMaxZoneAllTime(gridSize, levelInWorld) {
  const tier = levelInWorld <= 7 ? 0 : levelInWorld <= 15 ? 1 : levelInWorld <= 22 ? 2 : 3;
  const base = Math.max(2, Math.round(gridSize / 2));
  const range = gridSize - base;
  const fracs = [0, 0.4, 0.8, 1.0];
  return base + Math.round(range * fracs[tier]);
}

// World 1 modified tiers:
//   Levels  1-5  → special cap (base only) + forceSingletons=true
//   Levels  6-7  → Tier 0 (base)
//   Levels  8-15 → Tier 1
//   Levels 16-22 → Tier 2
//   Levels 23-30 → Tier 3
function getMaxZoneWorld1(levelInWorld) {
  const base = 2; // max(2, round(4/2)) = 2
  const range = 2; // 4 - 2 = 2
  const fracs = [0, 0.4, 0.8, 1.0];
  // levels 1-5: same cap as tier 0 (base), singletons handled externally
  const tier = levelInWorld <= 7 ? 0 : levelInWorld <= 15 ? 1 : levelInWorld <= 22 ? 2 : 3;
  return base + Math.round(range * fracs[tier]);
}

// Hardcore: Tier 2 for first 4 levels of block, Tier 3 for last 4
function getMaxZoneHardcore(gridSize, posInBlock) {
  const base = Math.max(2, Math.round(gridSize / 2));
  const range = gridSize - base;
  const frac = posInBlock <= 4 ? 0.8 : 1.0; // Tier 2 or Tier 3
  return base + Math.round(range * frac);
}

function singletonBudget(gridSize) {
  return Math.floor(gridSize / 2);
}

function boundedZoneSize(max, rng) {
  const r = rng();
  if (max <= 2) return r < 0.25 ? 1 : 2;
  if (max === 3) { if (r < 0.08) return 1; if (r < 0.42) return 2; return 3; }
  if (max === 4) { if (r < 0.05) return 1; if (r < 0.25) return 2; if (r < 0.55) return 3; return 4; }
  if (r < 0.05) return 2; if (r < 0.20) return 3; if (r < 0.45) return 4;
  if (r < 0.75) return 5; return Math.min(max, 6);
}

// ── Grid partitioner ─────────────────────────────────────────────────────────

function partitionGrid(size, rng, maxZoneSize) {
  const cap = maxZoneSize ?? 4;
  const zoneGrid = Array.from({ length: size }, () => new Array(size).fill(-1));
  let zoneId = 0;
  const cells = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) cells.push([r, c]);
  const shuffledCells = shuffleArray(cells, rng);

  for (const [startR, startC] of shuffledCells) {
    if (zoneGrid[startR][startC] !== -1) continue;
    const zoneSize = boundedZoneSize(cap, rng);
    const queue = [[startR, startC]];
    const zone = [];
    while (queue.length > 0 && zone.length < zoneSize) {
      const idx = Math.floor(rng() * queue.length);
      const [r, c] = queue.splice(idx, 1)[0];
      if (zoneGrid[r][c] !== -1) continue;
      zoneGrid[r][c] = zoneId;
      zone.push([r, c]);
      for (const [nr, nc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && zoneGrid[nr][nc] === -1)
          queue.push([nr, nc]);
      }
    }
    if (zone.length > 0) zoneId++;
  }
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (zoneGrid[r][c] === -1) zoneGrid[r][c] = zoneId++;
  return zoneGrid;
}

// ── Uniqueness enforcement ────────────────────────────────────────────────────

function splitZonesByUniqueness(zoneMap, solution, size) {
  const result = zoneMap.map(row => [...row]);
  let nextId = Math.max(...result.flat()) + 1;
  const zoneGroups = new Map();
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const id = result[r][c];
      if (!zoneGroups.has(id)) zoneGroups.set(id, []);
      zoneGroups.get(id).push([r, c]);
    }
  for (const [, cells] of zoneGroups) {
    const seen = new Set();
    for (const [r, c] of cells) {
      const el = solution[r][c];
      if (seen.has(el)) result[r][c] = nextId++;
      else seen.add(el);
    }
  }
  return result;
}

// ── Connectivity enforcement ──────────────────────────────────────────────────

function ensureZoneConnectivity(zoneMap, size) {
  const result = zoneMap.map(row => [...row]);
  let nextId = Math.max(...result.flat()) + 1;

  const zoneGroups = new Map();
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const id = result[r][c];
      if (!zoneGroups.has(id)) zoneGroups.set(id, []);
      zoneGroups.get(id).push([r, c]);
    }

  for (const [, cells] of zoneGroups) {
    if (cells.length <= 1) continue;
    const cellSet = new Set(cells.map(([r, c]) => r + ',' + c));
    const visited = new Set();
    let firstComponent = true;

    for (const [startR, startC] of cells) {
      const startKey = startR + ',' + startC;
      if (visited.has(startKey)) continue;
      const component = [];
      const queue = [[startR, startC]];
      visited.add(startKey);
      while (queue.length > 0) {
        const [r, c] = queue.shift();
        component.push([r, c]);
        for (const [nr, nc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]) {
          const nk = nr + ',' + nc;
          if (cellSet.has(nk) && !visited.has(nk)) {
            visited.add(nk);
            queue.push([nr, nc]);
          }
        }
      }
      if (firstComponent) {
        firstComponent = false;
      } else {
        const newId = nextId++;
        for (const [r, c] of component) result[r][c] = newId;
      }
    }
  }
  return result;
}

// ── Star thresholds ───────────────────────────────────────────────────────────

function getStarThresholds(worldNum) {
  const map = {
    1:{three:60,two:120},2:{three:90,two:180},3:{three:150,two:300},
    4:{three:240,two:480},5:{three:360,two:720},6:{three:480,two:960},
    7:{three:600,two:1200},8:{three:720,two:1440},
  };
  return map[worldNum] ?? {three:60,two:120};
}

// ── Combination pass ──────────────────────────────────────────────────────────
// Finds connected components in pool, then greedily assigns valid recipe zones
// by trying all cartesian cell-combinations per recipe (largest recipe first).

function isConnectedCells(cells) {
  if (cells.length <= 1) return true;
  const cellSet = new Set(cells.map(c => c.row + ',' + c.col));
  const visited = new Set();
  const queue = [cells[0]];
  visited.add(cells[0].row + ',' + cells[0].col);
  while (queue.length > 0) {
    const { row, col } = queue.shift();
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nk = (row + dr) + ',' + (col + dc);
      if (cellSet.has(nk) && !visited.has(nk)) {
        visited.add(nk);
        queue.push({ row: row + dr, col: col + dc });
      }
    }
  }
  return visited.size === cells.length;
}

// Cartesian: find first set of cells (one per option list) that are connected
function findConnectedCombination(cellOptions) {
  const n = cellOptions.length;
  if (cellOptions.some(opts => opts.length === 0)) return null;

  // Guard against cartesian explosion (max 512 combinations)
  const totalCombos = cellOptions.reduce((p, opts) => p * opts.length, 1);
  if (totalCombos > 512) return null;

  const indices = new Array(n).fill(0);
  while (true) {
    const combo = indices.map((idx, i) => cellOptions[i][idx]);
    const keys = combo.map(c => c.row + ',' + c.col);
    if (new Set(keys).size === n && isConnectedCells(combo)) return combo;

    let i = n - 1;
    while (i >= 0) {
      indices[i]++;
      if (indices[i] < cellOptions[i].length) break;
      indices[i] = 0;
      i--;
    }
    if (i < 0) return null;
  }
}

// Main combination pass
function combinationPass(poolCells, solution, worldNum) {
  if (!poolCells || poolCells.length === 0) return [];

  const cellMap = {};
  for (const c of poolCells) cellMap[c.row + ',' + c.col] = c;
  const poolSet = new Set(Object.keys(cellMap));

  const resultZones = [];
  const visitedGlobal = new Set();

  // Get all valid recipes sorted by ingredient count descending
  const sortedRecipes = Object.entries(WORLD_RECIPES[worldNum] || {})
    .filter(([, name]) => CATALOG_NAMES[worldNum]?.has(name))
    .sort((a, b) => b[0].split('+').length - a[0].split('+').length);

  for (const startKey of Object.keys(cellMap)) {
    if (visitedGlobal.has(startKey)) continue;

    // BFS: find connected component in pool
    const component = [];
    const queue = [startKey];
    visitedGlobal.add(startKey);
    while (queue.length > 0) {
      const key = queue.shift();
      component.push(cellMap[key]);
      const [r, c] = key.split(',').map(Number);
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nk = (r + dr) + ',' + (c + dc);
        if (poolSet.has(nk) && !visitedGlobal.has(nk)) {
          visitedGlobal.add(nk);
          queue.push(nk);
        }
      }
    }

    // Build element→cells map for this component
    const elemToCells = {};
    for (const cell of component) {
      const el = solution[cell.row][cell.col];
      if (!elemToCells[el]) elemToCells[el] = [];
      elemToCells[el].push(cell);
    }

    const componentUsed = new Set();

    // Try recipes largest-first
    for (const [recipeKey, rName] of sortedRecipes) {
      const recipeElems = recipeKey.split('+'); // already sorted alphabetically

      // All elements must have at least one available cell in this component
      const cellOptions = recipeElems.map(e =>
        (elemToCells[e] || []).filter(c => !componentUsed.has(c.row + ',' + c.col))
      );
      if (cellOptions.some(opts => opts.length === 0)) continue;

      const combo = findConnectedCombination(cellOptions);
      if (!combo) continue;

      for (const cell of combo) componentUsed.add(cell.row + ',' + cell.col);
      resultZones.push({ ingredients: recipeElems.sort(), cells: combo });
    }

    // Remaining cells → singletons
    for (const cell of component) {
      if (!componentUsed.has(cell.row + ',' + cell.col)) {
        resultZones.push({
          ingredients: [solution[cell.row][cell.col]],
          cells: [cell],
        });
      }
    }
  }

  return resultZones;
}

// ── Core level generator ──────────────────────────────────────────────────────
// Shared by Official (World 1 & All-Time), Hardcore, and Endless generators.

function generateLevelCore({
  levelId,
  worldId,
  worldNum,
  gridSize,
  elements,
  maxZone,
  forceSingletons,  // true → skip singleton-budget merge pass (World 1 levels 1-5)
  baseSeed,
}) {
  const budget = singletonBudget(gridSize);
  const TRIES = 500;

  let bestScore = Infinity;
  let bestSolution = null;
  let bestRawZones = null;

  for (let attempt = 0; attempt < TRIES; attempt++) {
    const seed = (baseSeed + attempt * 99991) & 0xffffffff;
    const rng  = seededRandom(seed);
    const solution = generateLatinSquare(gridSize, elements, rng);
    let zoneMap = partitionGrid(gridSize, rng, maxZone);
    zoneMap = splitZonesByUniqueness(zoneMap, solution, gridSize);
    zoneMap = ensureZoneConnectivity(zoneMap, gridSize);

    // Score: (invalid × 1000) + singleton count
    const zoneIds = [...new Set(zoneMap.flat())];
    let invalid = 0, singles = 0;
    const rawZones = [];

    for (const zid of zoneIds) {
      const cells = [];
      for (let r = 0; r < gridSize; r++)
        for (let c = 0; c < gridSize; c++)
          if (zoneMap[r][c] === zid) cells.push([r, c]);
      const ingSet      = new Set(cells.map(([r, c]) => solution[r][c]));
      const ingredients = [...ingSet].sort();
      const name        = recipeName(worldNum, ingredients);
      if (!isValidZone(worldNum, ingredients, name)) invalid++;
      else if (ingredients.length === 1) singles++;
      rawZones.push({ ingredients, cells: cells.map(([r, c]) => ({ row: r, col: c })) });
    }

    const score = invalid * 1000 + singles;
    if (score < bestScore) {
      bestScore    = score;
      bestSolution = solution;
      bestRawZones = rawZones;
      if (invalid === 0 && singles <= budget) break; // perfect
    }
  }

  // Phase 6: combination pass on invalid zones
  const validNonSingle = bestRawZones.filter(z => {
    const n = recipeName(worldNum, z.ingredients);
    return isValidZone(worldNum, z.ingredients, n) && z.ingredients.length > 1;
  });
  const validSingles = bestRawZones.filter(z => z.ingredients.length === 1);
  const invalidList  = bestRawZones.filter(z => {
    const n = recipeName(worldNum, z.ingredients);
    return !isValidZone(worldNum, z.ingredients, n);
  });

  const invalidPoolCells = invalidList.flatMap(z => z.cells);
  const fixedFromInvalid = combinationPass(invalidPoolCells, bestSolution, worldNum);

  const fixedMulti    = fixedFromInvalid.filter(z => z.ingredients.length > 1);
  const fixedSingles  = fixedFromInvalid.filter(z => z.ingredients.length === 1);
  const allSingletons = [...validSingles, ...fixedSingles];

  // Phase 7: singleton budget — merge excess singletons (unless forceSingletons)
  let finalZones;
  if (!forceSingletons && allSingletons.length > budget) {
    const singletonCells  = allSingletons.flatMap(z => z.cells);
    const mergedSingletons = combinationPass(singletonCells, bestSolution, worldNum);
    finalZones = [...validNonSingle, ...fixedMulti, ...mergedSingletons];
  } else {
    finalZones = [...validNonSingle, ...fixedMulti, ...allSingletons];
  }

  const zones = finalZones.map((z, i) => ({
    id:          `z${i}`,
    recipeName:  recipeName(worldNum, z.ingredients),
    ingredients: z.ingredients,
    cells:       z.cells,
  }));

  return {
    id:               levelId,
    worldId,
    size:             gridSize,
    elements,
    zones,
    canonicalSolution: bestSolution,
    starThresholds:   getStarThresholds(worldNum),
  };
}

// ── Generator: Official levels (Worlds 1-8, 30 per world) ────────────────────

function generateOfficialLevels() {
  const levels = [];
  for (let worldNum = 1; worldNum <= 8; worldNum++) {
    const gridSize = worldNum + 3;
    const elements = WORLD_ELEMENTS[worldNum];
    for (let lvl = 1; lvl <= 30; lvl++) {
      const isW1Special = worldNum === 1 && lvl <= 5;
      const maxZone     = worldNum === 1
        ? getMaxZoneWorld1(lvl)
        : getMaxZoneAllTime(gridSize, lvl);
      const numStr  = lvl.toString().padStart(2, '0');
      const baseSeed = (worldNum * 10000 + lvl * 317 + 42) & 0xffffffff;

      const level = generateLevelCore({
        levelId:        `w${worldNum}-l${numStr}`,
        worldId:        `world${worldNum}`,
        worldNum,
        gridSize,
        elements,
        maxZone,
        forceSingletons: isW1Special,
        baseSeed,
      });
      levels.push(level);

      const global = (worldNum - 1) * 30 + lvl;
      if (global % 10 === 0) process.stdout.write(`\r  Official: ${global}/240`);
    }
  }
  console.log('\r  Official: 240/240 ✓');
  return levels;
}

// ── Generator: Hardcore (70 levels) ──────────────────────────────────────────
// Grid blocks: 5×5→11×11, 8 levels each (4 Tier 2 + 4 Tier 3).
// Remaining 14 levels (57-70): 11×11 Tier 3.
// Elements follow world mapping: gridSize n → World (n-3).

function generateHardcoreLevels() {
  const GRID_SIZES = [5, 6, 7, 8, 9, 10, 11];
  const levels = [];
  let levelNum = 1;

  // 7 blocks × 8 levels = 56
  for (const gridSize of GRID_SIZES) {
    const worldNum = gridSize - 3;
    const elements = WORLD_ELEMENTS[worldNum];
    for (let posInBlock = 1; posInBlock <= 8; posInBlock++) {
      const maxZone  = getMaxZoneHardcore(gridSize, posInBlock);
      const baseSeed = (3000000 + levelNum * 99991) & 0xffffffff;

      levels.push(generateLevelCore({
        levelId:         `hc-${levelNum.toString().padStart(2,'0')}`,
        worldId:         'hardcore',
        worldNum,
        gridSize,
        elements,
        maxZone,
        forceSingletons: false,
        baseSeed,
      }));
      levelNum++;
      if (levelNum % 5 === 0) process.stdout.write(`\r  Hardcore: ${levelNum-1}/70`);
    }
  }

  // Remaining 14 levels (57-70): 11×11 Tier 3
  const w8  = WORLD_ELEMENTS[8];
  for (let extra = 0; extra < 14; extra++) {
    const maxZone  = getMaxZoneHardcore(11, 8); // posInBlock 8 → Tier 3
    const baseSeed = (3000000 + levelNum * 99991) & 0xffffffff;

    levels.push(generateLevelCore({
      levelId:         `hc-${levelNum.toString().padStart(2,'0')}`,
      worldId:         'hardcore',
      worldNum:        8,
      gridSize:        11,
      elements:        w8,
      maxZone,
      forceSingletons: false,
      baseSeed,
    }));
    levelNum++;
  }

  console.log('\r  Hardcore: 70/70 ✓');
  return levels;
}

// ── Generator: Endless (240 levels) ──────────────────────────────────────────
// Follows world progression (30 per world), World 1 modified tiers for first 30.
// Fresh seeds distinct from official levels.

function generateEndlessLevels() {
  const levels = [];
  for (let worldNum = 1; worldNum <= 8; worldNum++) {
    const gridSize = worldNum + 3;
    const elements = WORLD_ELEMENTS[worldNum];
    for (let lvl = 1; lvl <= 30; lvl++) {
      const globalLvl  = (worldNum - 1) * 30 + lvl;
      const isW1Special = worldNum === 1 && lvl <= 5;
      const maxZone    = worldNum === 1
        ? getMaxZoneWorld1(lvl)
        : getMaxZoneAllTime(gridSize, lvl);
      const baseSeed = (2000000 + worldNum * 10000 + lvl * 317 + 77) & 0xffffffff;

      const level = generateLevelCore({
        levelId:         `en-${globalLvl.toString().padStart(3,'0')}`,
        worldId:         `endless-w${worldNum}`,
        worldNum,
        gridSize,
        elements,
        maxZone,
        forceSingletons: isW1Special,
        baseSeed,
      });
      levels.push(level);

      if (globalLvl % 10 === 0) process.stdout.write(`\r  Endless:  ${globalLvl}/240`);
    }
  }
  console.log('\r  Endless:  240/240 ✓');
  return levels;
}

// ── Validation ────────────────────────────────────────────────────────────────

function inferWorldNum(lv) {
  if (lv.worldId === 'hardcore')           return lv.size - 3;
  if (lv.worldId.startsWith('endless-w')) return parseInt(lv.worldId.replace('endless-w', '')) || 1;
  return parseInt(lv.worldId.replace('world', '')) || 1;
}

function validateLevels(levels, label) {
  let badRecipe = 0, disconnected = 0, uncovered = 0;
  for (const lv of levels) {
    const size    = lv.size;
    const worldNum = inferWorldNum(lv);
    const covered = new Set();
    for (const z of lv.zones) {
      if (z.ingredients.length > 1) {
        const name = recipeName(worldNum, z.ingredients);
        if (!isValidZone(worldNum, z.ingredients, name)) badRecipe++;
        if (!isConnectedCells(z.cells)) disconnected++;
      }
      for (const c of z.cells) covered.add(c.row + ',' + c.col);
    }
    if (covered.size !== size * size) uncovered++;
  }
  console.log(`  ${label}: bad recipes=${badRecipe}, disconnected=${disconnected}, uncovered=${uncovered}`);
  return badRecipe === 0 && disconnected === 0 && uncovered === 0;
}

// ── Serialise to TypeScript ───────────────────────────────────────────────────

function levelToTs(lv) {
  const zonesStr = lv.zones.map(z => {
    const cellsStr = z.cells.map(c => `{row:${c.row},col:${c.col}}`).join(',');
    const ingStr   = z.ingredients.map(s => JSON.stringify(s)).join(',');
    return `{id:${JSON.stringify(z.id)},recipeName:${JSON.stringify(z.recipeName)},ingredients:[${ingStr}],cells:[${cellsStr}]}`;
  }).join(',\n    ');
  const solRows = lv.canonicalSolution.map(row =>
    '[' + row.map(e => JSON.stringify(e)).join(',') + ']'
  ).join(',\n    ');
  const elStr = lv.elements.map(e => JSON.stringify(e)).join(',');
  return `{
  id:${JSON.stringify(lv.id)},
  worldId:${JSON.stringify(lv.worldId)},
  size:${lv.size},
  elements:[${elStr}],
  zones:[
    ${zonesStr}
  ],
  canonicalSolution:[
    ${solRows}
  ],
  starThresholds:{three:${lv.starThresholds.three},two:${lv.starThresholds.two}},
}`;
}

function writeDataFile(filePath, levels, exportName, header) {
  const body = levels.map(levelToTs).join(',\n');
  const src  = `${header}\nimport type { Level } from './types';\n\nexport const ${exportName}: Level[] = [\n${body}\n];\n\nexport function get${exportName.charAt(0).toUpperCase() + exportName.slice(1)}Level(oneBasedIndex: number): Level | null {\n  return ${exportName}[oneBasedIndex - 1] ?? null;\n}\n`;
  fs.writeFileSync(filePath, src, 'utf8');
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('Alchegrid Level Generator\n');

console.log('Generating official levels (240)...');
const officialLevels = generateOfficialLevels();

console.log('Generating hardcore levels (70)...');
const hardcoreLevels = generateHardcoreLevels();

console.log('Generating endless levels (240)...');
const endlessLevels  = generateEndlessLevels();

console.log('\nValidation:');
const okOfficial = validateLevels(officialLevels,  'Official ');
const okHardcore = validateLevels(hardcoreLevels, 'Hardcore ');
const okEndless  = validateLevels(endlessLevels,  'Endless  ');

// ── Write output files ────────────────────────────────────────────────────────

const libDir = path.join(__dirname, '..', 'lib');

// Official levels — exported per-world for getOfficialLevel
const globalSol = `// AUTO-GENERATED by scripts/generateLevels.cjs — DO NOT EDIT\nimport type { Level } from './types';\n\nconst OFFICIAL_LEVELS: Level[] = [\n${officialLevels.map(levelToTs).join(',\n')}\n];\n\nexport function getOfficialLevel(globalLevel: number): Level | null {\n  return OFFICIAL_LEVELS[globalLevel - 1] ?? null;\n}\n`;
fs.writeFileSync(path.join(libDir, 'levelData.ts'), globalSol, 'utf8');

// Hardcore levels
writeDataFile(
  path.join(libDir, 'hardcoreLevelData.ts'),
  hardcoreLevels,
  'hardcoreLevels',
  '// AUTO-GENERATED by scripts/generateLevels.cjs — DO NOT EDIT',
);

// Endless levels
writeDataFile(
  path.join(libDir, 'endlessLevelData.ts'),
  endlessLevels,
  'endlessLevels',
  '// AUTO-GENERATED by scripts/generateLevels.cjs — DO NOT EDIT',
);

console.log('\nFiles written:');
console.log('  lib/levelData.ts');
console.log('  lib/hardcoreLevelData.ts');
console.log('  lib/endlessLevelData.ts');

if (!okOfficial || !okHardcore || !okEndless) {
  console.warn('\nWARNING: validation errors detected above.');
  process.exit(1);
} else {
  console.log('\nAll levels valid. Done.');
}
