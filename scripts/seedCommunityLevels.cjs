'use strict';

/**
 * Seed script — generates 20 community levels (5 per grid size: 4×4–7×7)
 * and outputs SQL INSERT statements to stdout.
 *
 * Run: node artifacts/alchegrid/scripts/seedCommunityLevels.cjs | psql "$DATABASE_URL"
 */

// ── World definitions ─────────────────────────────────────────────────────────

const WORLD_ELEMENTS = {
  1: ['Wind', 'Earth', 'Fire', 'Water'],
  2: ['Wood', 'Metal', 'Glass', 'Rubber', 'Plastic'],
  3: ['Metal', 'Rubber', 'Plastic', 'Glass', 'Electricity', 'Fuel'],
  4: ['Water', 'Heat', 'Gas', 'Carbon', 'Metal', 'Acid', 'Base'],
};

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
};

const CATALOG_NAMES = {
  1: new Set(['Wind','Earth','Fire','Water','Mud','Lightning','Dust','Steam','Ice','Lava','Storm','Sand','Clay','Life','Energy']),
  2: new Set(['Wood','Metal','Glass','Rubber','Plastic','Plywood','Mirror','Goggle','Seal','Crate','Window','Tire','Case','Slingshot','Laminate','Frame','Gear','Greenhouse','Spring','Bumper','Clamp','Fixture','Grip','Machine','Display','Handle','Device','Cabinet','Console','Toolkit','Core']),
  3: new Set(['Metal','Rubber','Plastic','Glass','Electricity','Fuel','Wire','Gasket','Pipe','Switch','Coil','Cell','Tank','Valve','Flare','Cable','Goggle','Chip','Screen','Burner','Welder','Motor','Sensor','Pump','Filter','Solenoid','Lantern','Vacuum Tube','Canister','Gauge','Lighthouse','Visor','Dynamo','Battery','Relay','Circuit','Hose','Piston','Cartridge','Nozzle','Turbine','Generator','Reactor','Amplifier','Transformer','Compressor','Furnace','Regulator','Pressure Vessel','Terminal','Exhaust','Floodlight','Cockpit','Processor','Powercore','Rig','Capsule','Network','System','Engine']),
  4: new Set(['Water','Heat','Gas','Carbon','Metal','Acid','Base','Brine','Vapor','Ink','Rust','Blight','Alkali','Arc Plasma','Smog','Ingot','Acid Cloud','Foam','Resin','Coal','Limestone','Alloy','Cinder','Etch','Oxide','Salt','Tonic','Calcium','Deposit','Potion','Cement','Haze','Dross','Solvent','Spray','Pigment','Reagent','Slurry','Lotion','Rinse','Antidote','Graphite','Smelt','Fume','Calciner','Crucible','Char','Blaze','Quench','Flash','Rocket','Fumarate','Cloud','Corrosion','Vent','Aerosol','Tarnish','Compound','Vinegar','Patina','Formula','Converter','Mixture','Solution']),
};

// ── Recipe helpers ─────────────────────────────────────────────────────────────

function findRecipe(worldNum, ingredients) {
  const key = [...ingredients].sort().join('+');
  return WORLD_RECIPES[worldNum]?.[key] ?? null;
}
function recipeName(worldNum, ingredients) {
  if (ingredients.length === 1) return ingredients[0];
  return findRecipe(worldNum, ingredients) ?? ingredients.sort().join(' + ');
}
function isValidZone(worldNum, ingredients, name) {
  if (ingredients.length === 1) return true;
  if (!findRecipe(worldNum, ingredients)) return false;
  return CATALOG_NAMES[worldNum]?.has(name) ?? false;
}

// ── RNG ───────────────────────────────────────────────────────────────────────

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function shuffleArray(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
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

// ── Partition helpers ─────────────────────────────────────────────────────────

function singletonBudget(n) { return Math.floor(n / 2); }
function maxZoneForTier(n, tier) {
  const base = Math.max(2, Math.round(n / 2));
  const fracs = [0, 0.4, 0.8, 1.0];
  return base + Math.round((n - base) * fracs[Math.min(tier, 3)]);
}
function boundedZoneSize(max, rng) {
  const r = rng();
  if (max <= 2) return r < 0.25 ? 1 : 2;
  if (max === 3) { if (r < 0.08) return 1; if (r < 0.42) return 2; return 3; }
  if (max === 4) { if (r < 0.05) return 1; if (r < 0.25) return 2; if (r < 0.55) return 3; return 4; }
  if (r < 0.05) return 2; if (r < 0.20) return 3; if (r < 0.45) return 4;
  if (r < 0.75) return 5; return Math.min(max, 6);
}
function partitionGrid(size, rng, maxZoneSize) {
  const cap = maxZoneSize ?? 4;
  const zoneGrid = Array.from({ length: size }, () => new Array(size).fill(-1));
  let zoneId = 0;
  const cells = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) cells.push([r, c]);
  for (const [startR, startC] of shuffleArray(cells, rng)) {
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
      for (const [nr, nc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]])
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && zoneGrid[nr][nc] === -1) queue.push([nr, nc]);
    }
    if (zone.length > 0) zoneId++;
  }
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (zoneGrid[r][c] === -1) zoneGrid[r][c] = zoneId++;
  return zoneGrid;
}
function splitZonesByUniqueness(zoneMap, solution, size) {
  const result = zoneMap.map(row => [...row]);
  let nextId = Math.max(...result.flat()) + 1;
  const zoneGroups = new Map();
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
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
function ensureZoneConnectivity(zoneMap, size) {
  const result = zoneMap.map(row => [...row]);
  let nextId = Math.max(...result.flat()) + 1;
  const zoneGroups = new Map();
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    const id = result[r][c];
    if (!zoneGroups.has(id)) zoneGroups.set(id, []);
    zoneGroups.get(id).push([r, c]);
  }
  for (const [, cells] of zoneGroups) {
    if (cells.length <= 1) continue;
    const cellSet = new Set(cells.map(([r, c]) => r + ',' + c));
    const visited = new Set();
    let first = true;
    for (const [startR, startC] of cells) {
      const sk = startR + ',' + startC;
      if (visited.has(sk)) continue;
      const comp = [];
      const q = [[startR, startC]]; visited.add(sk);
      while (q.length > 0) {
        const [r, c] = q.shift(); comp.push([r, c]);
        for (const [nr, nc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]) {
          const nk = nr + ',' + nc;
          if (cellSet.has(nk) && !visited.has(nk)) { visited.add(nk); q.push([nr, nc]); }
        }
      }
      if (first) { first = false; } else { const nid = nextId++; for (const [r, c] of comp) result[r][c] = nid; }
    }
  }
  return result;
}
function isConnectedCells(cells) {
  if (cells.length <= 1) return true;
  const cs = new Set(cells.map(c => c.row + ',' + c.col));
  const vis = new Set(); const q = [cells[0]]; vis.add(cells[0].row + ',' + cells[0].col);
  while (q.length > 0) {
    const { row, col } = q.shift();
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nk = (row+dr)+','+(col+dc);
      if (cs.has(nk) && !vis.has(nk)) { vis.add(nk); q.push({ row: row+dr, col: col+dc }); }
    }
  }
  return vis.size === cells.length;
}
function findConnectedCombination(cellOptions) {
  const n = cellOptions.length;
  if (cellOptions.some(o => o.length === 0)) return null;
  if (cellOptions.reduce((p, o) => p * o.length, 1) > 512) return null;
  const indices = new Array(n).fill(0);
  while (true) {
    const combo = indices.map((idx, i) => cellOptions[i][idx]);
    if (new Set(combo.map(c => c.row+','+c.col)).size === n && isConnectedCells(combo)) return combo;
    let i = n - 1;
    while (i >= 0) { indices[i]++; if (indices[i] < cellOptions[i].length) break; indices[i] = 0; i--; }
    if (i < 0) return null;
  }
}
function combinationPass(poolCells, solution, worldNum) {
  if (!poolCells || poolCells.length === 0) return [];
  const cellMap = {}; for (const c of poolCells) cellMap[c.row+','+c.col] = c;
  const poolSet = new Set(Object.keys(cellMap));
  const resultZones = [], visitedGlobal = new Set();
  const sortedRecipes = Object.entries(WORLD_RECIPES[worldNum] || {})
    .filter(([, name]) => CATALOG_NAMES[worldNum]?.has(name))
    .sort((a, b) => b[0].split('+').length - a[0].split('+').length);
  for (const startKey of Object.keys(cellMap)) {
    if (visitedGlobal.has(startKey)) continue;
    const comp = []; const q = [startKey]; visitedGlobal.add(startKey);
    while (q.length > 0) {
      const key = q.shift(); comp.push(cellMap[key]);
      const [r, c] = key.split(',').map(Number);
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nk = (r+dr)+','+(c+dc);
        if (poolSet.has(nk) && !visitedGlobal.has(nk)) { visitedGlobal.add(nk); q.push(nk); }
      }
    }
    const elemToCells = {};
    for (const cell of comp) { const el = solution[cell.row][cell.col]; if (!elemToCells[el]) elemToCells[el] = []; elemToCells[el].push(cell); }
    const used = new Set();
    for (const [rk, rName] of sortedRecipes) {
      const elems = rk.split('+');
      const opts = elems.map(e => (elemToCells[e]||[]).filter(c => !used.has(c.row+','+c.col)));
      if (opts.some(o => o.length === 0)) continue;
      const combo = findConnectedCombination(opts);
      if (!combo) continue;
      for (const cell of combo) used.add(cell.row+','+cell.col);
      resultZones.push({ ingredients: elems.sort(), cells: combo });
    }
    for (const cell of comp) if (!used.has(cell.row+','+cell.col)) resultZones.push({ ingredients: [solution[cell.row][cell.col]], cells: [cell] });
  }
  return resultZones;
}

// ── Core level generator ──────────────────────────────────────────────────────

function generateLevel(worldNum, gridSize, tier, baseSeed) {
  const elements = WORLD_ELEMENTS[worldNum];
  const maxZone  = maxZoneForTier(gridSize, tier);
  const budget   = singletonBudget(gridSize);
  let bestScore = Infinity, bestSolution = null, bestRawZones = null;

  for (let attempt = 0; attempt < 500; attempt++) {
    const seed = (baseSeed + attempt * 99991) & 0xffffffff;
    const rng  = seededRandom(seed);
    const solution = generateLatinSquare(gridSize, elements, rng);
    let zoneMap = partitionGrid(gridSize, rng, maxZone);
    zoneMap = splitZonesByUniqueness(zoneMap, solution, gridSize);
    zoneMap = ensureZoneConnectivity(zoneMap, gridSize);
    const zoneIds = [...new Set(zoneMap.flat())];
    let invalid = 0, singles = 0; const rawZones = [];
    for (const zid of zoneIds) {
      const cells = [];
      for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) if (zoneMap[r][c] === zid) cells.push([r, c]);
      const ingredients = [...new Set(cells.map(([r, c]) => solution[r][c]))].sort();
      const name = recipeName(worldNum, ingredients);
      if (!isValidZone(worldNum, ingredients, name)) invalid++;
      else if (ingredients.length === 1) singles++;
      rawZones.push({ ingredients, cells: cells.map(([r, c]) => ({ row: r, col: c })) });
    }
    const score = invalid * 1000 + singles;
    if (score < bestScore) { bestScore = score; bestSolution = solution; bestRawZones = rawZones; if (invalid === 0 && singles <= budget) break; }
  }

  const validNonSingle = bestRawZones.filter(z => { const n = recipeName(worldNum, z.ingredients); return isValidZone(worldNum, z.ingredients, n) && z.ingredients.length > 1; });
  const validSingles   = bestRawZones.filter(z => z.ingredients.length === 1);
  const invalidList    = bestRawZones.filter(z => { const n = recipeName(worldNum, z.ingredients); return !isValidZone(worldNum, z.ingredients, n); });
  const fixed = combinationPass(invalidList.flatMap(z => z.cells), bestSolution, worldNum);
  const fixedMulti = fixed.filter(z => z.ingredients.length > 1);
  const fixedSingles = fixed.filter(z => z.ingredients.length === 1);
  const allSingletons = [...validSingles, ...fixedSingles];
  let finalZones;
  if (allSingletons.length > budget) {
    const merged = combinationPass(allSingletons.flatMap(z => z.cells), bestSolution, worldNum);
    finalZones = [...validNonSingle, ...fixedMulti, ...merged];
  } else {
    finalZones = [...validNonSingle, ...fixedMulti, ...allSingletons];
  }

  const zones = finalZones.map((z, i) => ({
    id:          `z${i}`,
    recipeName:  recipeName(worldNum, z.ingredients),
    ingredients: z.ingredients,
    cells:       z.cells,
  }));

  return { elements, zones, canonicalSolution: bestSolution };
}

// ── Level specifications ───────────────────────────────────────────────────────

const SPECS = [
  // 4×4 World 1 — Wind, Earth, Fire, Water
  { id: 'cl-seed-w1-t0-c301', name: 'Mudslide',          worldNum: 1, size: 4, tier: 0, plays: 187, seed: 0xA1C30100 },
  { id: 'cl-seed-w1-t1-c302', name: 'Ember & Ice',        worldNum: 1, size: 4, tier: 1, plays:  94, seed: 0xA1C30200 },
  { id: 'cl-seed-w1-t1-c303', name: 'Desert Wind',        worldNum: 1, size: 4, tier: 1, plays: 143, seed: 0xA1C30300 },
  { id: 'cl-seed-w1-t2-c304', name: 'Lava Run',           worldNum: 1, size: 4, tier: 2, plays:  61, seed: 0xA1C30400 },
  { id: 'cl-seed-w1-t3-c305', name: 'Eye of the Storm',   worldNum: 1, size: 4, tier: 3, plays:  29, seed: 0xA1C30500 },

  // 5×5 World 2 — Wood, Metal, Glass, Rubber, Plastic
  { id: 'cl-seed-w2-t0-d401', name: 'First Workshop',     worldNum: 2, size: 5, tier: 0, plays: 162, seed: 0xB2D40100 },
  { id: 'cl-seed-w2-t1-d402', name: 'Mirror Pass',        worldNum: 2, size: 5, tier: 1, plays:  78, seed: 0xB2D40200 },
  { id: 'cl-seed-w2-t1-d403', name: 'Slingshot',          worldNum: 2, size: 5, tier: 1, plays: 115, seed: 0xB2D40300 },
  { id: 'cl-seed-w2-t2-d404', name: 'Gear Train',         worldNum: 2, size: 5, tier: 2, plays:  47, seed: 0xB2D40400 },
  { id: 'cl-seed-w2-t3-d405', name: 'Core Melt',          worldNum: 2, size: 5, tier: 3, plays:  22, seed: 0xB2D40500 },

  // 6×6 World 3 — Metal, Rubber, Plastic, Glass, Electricity, Fuel
  { id: 'cl-seed-w3-t0-e501', name: 'Live Wire',          worldNum: 3, size: 6, tier: 0, plays: 199, seed: 0xC3E50100 },
  { id: 'cl-seed-w3-t1-e502', name: 'Static Loop',        worldNum: 3, size: 6, tier: 1, plays:  88, seed: 0xC3E50200 },
  { id: 'cl-seed-w3-t1-e503', name: 'Fuel Cell',          worldNum: 3, size: 6, tier: 1, plays: 134, seed: 0xC3E50300 },
  { id: 'cl-seed-w3-t2-e504', name: 'The Generator',      worldNum: 3, size: 6, tier: 2, plays:  53, seed: 0xC3E50400 },
  { id: 'cl-seed-w3-t3-e505', name: 'Full Engine',        worldNum: 3, size: 6, tier: 3, plays:  31, seed: 0xC3E50500 },

  // 7×7 World 4 — Water, Heat, Gas, Carbon, Metal, Acid, Base
  { id: 'cl-seed-w4-t0-f601', name: 'Acid Rain',          worldNum: 4, size: 7, tier: 0, plays: 176, seed: 0xD4F60100 },
  { id: 'cl-seed-w4-t1-f602', name: 'Carbon Trace',       worldNum: 4, size: 7, tier: 1, plays:  99, seed: 0xD4F60200 },
  { id: 'cl-seed-w4-t1-f603', name: 'Heat Exchange',      worldNum: 4, size: 7, tier: 1, plays: 121, seed: 0xD4F60300 },
  { id: 'cl-seed-w4-t2-f604', name: 'Alloy Equation',     worldNum: 4, size: 7, tier: 2, plays:  44, seed: 0xD4F60400 },
  { id: 'cl-seed-w4-t3-f605', name: 'Full Reaction',      worldNum: 4, size: 7, tier: 3, plays:  27, seed: 0xD4F60500 },
];

// ── SQL helpers ───────────────────────────────────────────────────────────────

function sqlStr(val) { return "'" + String(val).replace(/'/g, "''") + "'"; }
function sqlJson(val) { return sqlStr(JSON.stringify(val)); }

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('BEGIN;');

const now = new Date().toISOString();
let ok = 0, skipped = 0;

for (const spec of SPECS) {
  const { id, name, worldNum, size, tier, plays, seed } = spec;
  process.stderr.write(`Generating "${name}" (${size}×${size} tier ${tier})… `);

  const baseSeed = (seed + 9_000_000) & 0xffffffff;
  const level = generateLevel(worldNum, size, tier, baseSeed);

  // Validate: no zone with unrecognised multi-element recipe
  const badZones = level.zones.filter(z => z.ingredients.length > 1 && !findRecipe(worldNum, z.ingredients));
  if (badZones.length > 0) {
    process.stderr.write(`SKIP (${badZones.length} bad zones)\n`);
    skipped++;
    continue;
  }

  // Validate Latin square
  let valid = true;
  const sol = level.canonicalSolution;
  for (let r = 0; r < size && valid; r++) if (new Set(sol[r]).size !== size) valid = false;
  for (let c = 0; c < size && valid; c++) if (new Set(sol.map(row => row[c])).size !== size) valid = false;
  if (!valid) { process.stderr.write('SKIP (bad Latin square)\n'); skipped++; continue; }

  // Stagger published_at_ts so ordering is deterministic (newest = "Full Reaction" at top)
  const tsOffset = (SPECS.length - SPECS.indexOf(spec) - 1) * 60000;
  const ts = new Date(Date.now() - tsOffset).toISOString();

  console.log(
    `INSERT INTO community_levels ` +
    `(id, name, size, elements, zones, canonical_solution, created_at, updated_at, published_at, published, plays, likes, created_by_player, published_at_ts) ` +
    `VALUES (` +
    `${sqlStr(id)}, ${sqlStr(name)}, ${size}, ${sqlJson(level.elements)}, ` +
    `${sqlJson(level.zones)}, ${sqlJson(level.canonicalSolution)}, ` +
    `${sqlStr(now)}, ${sqlStr(now)}, ${sqlStr(now)}, true, ${plays}, 0, false, ${sqlStr(ts)}` +
    `) ON CONFLICT (id) DO UPDATE SET ` +
    `name=${sqlStr(name)}, plays=${plays}, published_at_ts=${sqlStr(ts)};`
  );

  process.stderr.write(`✓  (${level.zones.length} zones, ${plays} plays)\n`);
  ok++;
}

console.log('COMMIT;');
process.stderr.write(`\nSQL generated: ${ok} levels (${skipped} skipped).\n`);
