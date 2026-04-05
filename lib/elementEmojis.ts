// Recipe product ghost icons — keyed by lowercase recipe name
export const RECIPE_EMOJIS: Record<string, string> = {
  // World 1
  mud: '🪨', lightning: '⚡', dust: '🌫️', steam: '💨', ice: '🧊',
  lava: '🌋', storm: '⛈️', sand: '🏜️', clay: '🏺', life: '🌿', energy: '✨',
  // World 2
  plywood: '🪵', mirror: '🪞', goggle: '🥽', seal: '🔒', crate: '📦',
  window: '🪟', tire: '⚫', 'case': '💼', slingshot: '🏹', laminate: '🪵',
  frame: '🖼️', gear: '⚙️', greenhouse: '🏡', spring: '🌀', bumper: '🛡️',
  clamp: '🔧', fixture: '🔩', grip: '✊', machine: '🤖', device: '📱',
  cabinet: '🗄️', console: '🎮', toolkit: '🧰', core: '💎',
  // World 3
  wire: '🔌', gasket: '⭕', pipe: '🔧', switch: '🔁', coil: '🌀',
  cell: '🔋', tank: '⛽', valve: '🚰', flare: '🔦', cable: '🔌',
  chip: '💾', screen: '📺', burner: '🔥', welder: '⚡', motor: '⚙️',
  sensor: '📡', pump: '💧', filter: '🌊', solenoid: '🧲', lantern: '🏮',
  'vacuum tube': '💡', canister: '🧰', dynamo: '⚡', battery: '🔋',
  circuit: '🖥️', turbine: '🌀', generator: '⚡', reactor: '☢️',
  amplifier: '📻', transformer: '🔄', furnace: '🔥', engine: '🚂',
  // World 4
  brine: '🧂', vapor: '💨', ink: '🖊️', rust: '🪝', blight: '🍂',
  alkali: '🧴', 'arc plasma': '⚡', smog: '🌫️', ingot: '🏅', 'acid cloud': '🌫️',
  slag: '🏔️', oxide: '🔴', salt: '🧂', char: '🖤', alloy: '⚙️', patina: '🟢',
  plasma: '☀️', polymer: '🧬', catalyst: '⚗️',
  // World 5
  photon: '✨', ion: '⚛️', pulse: '🌊', aura: '🔮', arc: '⚡',
  echo: '〰️', signal: '📡', vortex: '🌀', torque: '⚙️', quanta: '⚛️',
  atom: '⚛️', electron: '⚡', quantum: '🔮', qubit: '💻',
  // World 6
  algae: '🌿', bacteria: '🦠', glucose: '🍬', membrane: '🔬', seed: '🌱',
  leaf: '🍃', geyser: '💧', foam: '🫧', bubble: '🫧', ozone: '🌍',
  dna: '🧬', blood: '🩸', embryo: '🥚', protein: '🧬',
  // World 7
  blade: '🗡️', mine: '⛏️', axe: '🪓', torch: '🔦', farm: '🌾',
  well: '🪣', lumber: '🪵', forge: '🔥', shrine: '⛩️', totem: '🗿',
  coin: '🪙', scroll: '📜', calendar: '📅', idol: '🏺', crop: '🌾',
  hammer: '🔨', wheel: '🛞', boat: '⛵', sword: '⚔️', armor: '🛡️',
  harvest: '🌾', tower: '🏛️', temple: '⛩️', dynasty: '👑',
  library: '📚', palace: '🏰', pyramid: '🏛️', bridge: '🌉',
  empire: '👑', civilization: '🏛️', fleet: '⛵',
  // Fallback recipe names (from getFallbackName in levelGenerator)
  blend: '🔮', mix: '🌀', fusion: '💫', alloy: '⚗️', bond: '🔗',
  compound: '⚗️', mixture: '🧪', amalgam: '🌀', infusion: '🍵', synthesis: '⚗️',
  formula: '⚗️', concoction: '🧪', tincture: '🧪', elixir: '✨', essence: '✨',
  // World 8
  nebula: '✨', laser: '🔦', lensing: '🌌', decay: '☢️', orbit: '🌍',
  glacier: '🧊', flare: '☀️', 'solar wind': '💨', 'ghost star': '👻',
  shadow: '🌑', frost: '❄️', tail: '☄️', debris: '🪨',
  abyss: '🕳️', 'gas cloud': '💨', star: '⭐', asteroid: '☄️',
  pulsar: '💫', magnetar: '🧲', protostar: '⭐', planet: '🌍',
  supernova: '💥', 'neutron star': '💫', galaxy: '🌌',
  'event horizon': '🕳️', quasar: '✨', universe: '🌌',
};

export const ELEMENT_EMOJIS: Record<string, string> = {
  // World 1
  wind: '💨',
  earth: '🌍',
  fire: '🔥',
  water: '💧',
  // World 2
  wood: '🪵',
  metal: '⚙️',
  glass: '🪟',
  rubber: '⚫',
  plastic: '🧴',
  // World 3
  electricity: '⚡',
  fuel: '⛽',
  // World 4
  heat: '🌡️',
  gas: '💨',
  carbon: '🖤',
  acid: '🧪',
  base: '🧂',
  // World 5
  particle: '⚛️',
  wave: '〰️',
  energy: '✨',
  void: '🌑',
  spin: '🌀',
  field: '🔮',
  observer: '👁️',
  charge: '⚡',
  // World 6
  cell: '🔬',
  light: '💡',
  oxygen: '🫧',
  nitrogen: '🫠',
  enzyme: '🧬',
  // World 7
  stone: '🪨',
  knowledge: '📚',
  labor: '🔨',
  time: '⏳',
  soil: '🪴',
  spirit: '🌟',
  // World 8
  gravity: '🌊',
  plasma: '☀️',
  dust: '🌫️',
  ice: '🧊',
  magnetism: '🧲',
  radiation: '☢️',
  'dark matter': '🕳️',
};
