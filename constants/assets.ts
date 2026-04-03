// ── Global background + core UI ─────────────────────────────────────────────
export const BG_IMAGE = require('../assets/images/5E4BE7C0-FFE3-4E50-9702-1224F230B569_1772165562320.png');
export const LOGO = require('../assets/images/Alchegrid_logo_1772115867830.png');
export const CARD_BG = require('../assets/images/card_3_1772169104967.png');
export const PLAY_BTN = require('../assets/images/play_button_1772167927124.png');
export const BANNER_BG = require('../assets/images/text_field_background_1772167557322.png');
export const HARDCORE_BG = require('../assets/images/Hardcore_2_button_background_1772167502894.png');

// ── Exact aspect ratios for each PNG (measured from actual files) ────────────
export const LOGO_ASPECT = 1536 / 1024;        // 1.50
export const CARD_ASPECT = 1.55;               // landscape card (wider than tall)
export const PLAY_BTN_ASPECT = 1397 / 440;     // 3.17
export const BANNER_ASPECT = 1382 / 307;       // 4.50
export const HARDCORE_ASPECT = 1487 / 652;     // 2.28

export const WORLD_ASPECTS = [2.09, 1.86, 1.77, 1.81, 1.67, 1.84, 1.90, 1.82];

// ── World plate buttons (index = worldIndex 0–7) ────────────────────────────
export const WORLD_BUTTONS = [
  require('../assets/images/nature_lab_button_1772170531713.png'),           // W1
  require('../assets/images/Materials_workshop_button_1772171244487.png'),   // W2
  require('../assets/images/Machines_and_power_button_1772171452437.png'),   // W3
  require('../assets/images/chemistry_lab_button_1772171567710.png'),        // W4
  require('../assets/images/quantum_realm_button_1772171673767.png'),        // W5
  require('../assets/images/WORLD_6_PLATE_BIOLOGY_1775168325470.png'),       // W6
  require('../assets/images/WORLD_7_PLATE_CIVILIZATION_filled_1775221671691.png'), // W7
  require('../assets/images/WORLD_8_PLATE_COSMOS_1775168325469.png'),        // W8
];

// ── Grid background PNGs per board size ──────────────────────────────────────
export const GRID_BACKGROUNDS: Record<number, ReturnType<typeof require>> = {
  4:  require('../assets/images/4x4_grid_1772147269726.png'),
  5:  require('../assets/images/5x5_grid_1775164818218.png'),
  6:  require('../assets/images/6x6_grid_1775164822535.png'),
  7:  require('../assets/images/7x7_grid_1775164830287.png'),
  8:  require('../assets/images/8x8_grid_1775164830288.png'),
  9:  require('../assets/images/9x9_grid_1775164830288.png'),
  10: require('../assets/images/10x10_1775164830288.png'),
  11: require('../assets/images/10x10_1775164830288.png'),
};

// ── World 1 element PNGs ─────────────────────────────────────────────────────
export const ELEMENT_PNGS: Record<string, ReturnType<typeof require>> = {
  // World 1 – Nature
  air:       require('../assets/images/air_PNG_1772164017110.png'),
  ash:       require('../assets/images/ash_png_1772115452685.png'),
  clay:      require('../assets/images/clay_PNG_1772225088469.png'),
  cloud:     require('../assets/images/cloud_png_1772115452685.png'),
  dust:      require('../assets/images/dust_png_1772244847452.png'),
  earth:     require('../assets/images/earth_png_1772224818032.png'),
  energy:    require('../assets/images/energy_png_1772115452683.png'),
  fire:      require('../assets/images/fire_png_1772224742303.png'),
  fog:       require('../assets/images/Fog_png_1772115452683.png'),
  ice:       require('../assets/images/ice_png_1772226065816.png'),
  lava:      require('../assets/images/lava_png_1772225804262.png'),
  life:      require('../assets/images/LIFE_PNG_1772172150742.png'),
  lightning: require('../assets/images/lightning_1_1772226178069.png'),
  mud:       require('../assets/images/mud_PNG_1772225555372.png'),
  plant:     require('../assets/images/plant_png_1772115452684.png'),
  sand:      require('../assets/images/sand_png_1772225712096.png'),
  steam:     require('../assets/images/steam_png_1772244348009.png'),
  stone:     require('../assets/images/stone_png_1772115452685.png'),
  storm:     require('../assets/images/storm_PNG_1772172368268.png'),
  water:     require('../assets/images/water_png_1772115452685.png'),
  wind:      require('../assets/images/wind_png_1772224822918.png'),

  // World 2 – Materials Workshop (base elements)
  glass:     require('../assets/images/GLASS_PNG_1775175540985.png'),
  metal:     require('../assets/images/METAL_PNG_1775175540985.png'),
  plastic:   require('../assets/images/PLASTIC_PNG_1775175540985.png'),
  plywood:   require('../assets/images/PLYWOOD_PNG_1775175596945.png'),
  rubber:    require('../assets/images/RUBBER_PNG_1775175540985.png'),
  wood:      require('../assets/images/WOOD_PNG_1775175540984.png'),

  // World 2 – Recipe combos
  bumper:    require('../assets/images/BUMPER_PNG_1775175573822.png'),
  cabinet:   require('../assets/images/CABINET_PNG_1775175573823.png'),
  case:      require('../assets/images/CASE_PNG_1775175573823.png'),
  clamp:     require('../assets/images/CLAMP_PNG_1775175573824.png'),
  console:   require('../assets/images/CONSOLE_PNG_1775175573824.png'),
  core:      require('../assets/images/CORE_PNG_1775175573824.png'),
  crate:     require('../assets/images/CRATE_PNG_1775175573825.png'),
  device:    require('../assets/images/DEVICE_PNG_1775175573825.png'),
  fixture:   require('../assets/images/FIXTURE_PNG_1775175573826.png'),
  frame:     require('../assets/images/FRAME_PNG_1775175573826.png'),
  gear:      require('../assets/images/GEAR_PNG_1775175573826.png'),
  goggle:    require('../assets/images/GOGGLE_world_2_PNG_1775175573820.png'),
  greenhouse: require('../assets/images/GREENHOUSE_PNG_1775175573821.png'),
  grip:      require('../assets/images/GRIP_PNG_1775175573821.png'),
  laminate:  require('../assets/images/LAMINATE_PNG_1775175573822.png'),
  machine:   require('../assets/images/MACHINE_PNG_1775175596946.png'),
  mirror:    require('../assets/images/MIRROR_PNG_1775175596945.png'),
  seal:      require('../assets/images/SEAL_PNG_1775175596945.png'),
  slingshot: require('../assets/images/SLINGSHOT_PNG_1775175596946.png'),
  spring:    require('../assets/images/SPRING_PNG_1775175596946.png'),
  tire:      require('../assets/images/TIRE_PNG_1775175596946.png'),
  toolkit:   require('../assets/images/TOOLKIT_PNG_1775175596946.png'),
  window:    require('../assets/images/WINDOW_PNG_1775175596946.png'),

  // World 3 – Machines & Power (base elements)
  electricity: require('../assets/images/electricity_256.png'),
  fuel:      require('../assets/images/fuel_256.png'),

  // World 3 – Recipe combos (w3_ prefix)
  amplifier: require('../assets/images/w3_amplifier_256.png'),
  assembly:  require('../assets/images/w3_assembly_256.png'),
  battery:   require('../assets/images/w3_battery_256.png'),
  burner:    require('../assets/images/w3_burner_256.png'),
  cable:     require('../assets/images/w3_cable_256.png'),
  canister:  require('../assets/images/w3_canister_256.png'),
  capsule:   require('../assets/images/w3_capsule_256.png'),
  cartridge: require('../assets/images/w3_cartridge_256.png'),
  cell:      require('../assets/images/w3_cell_256.png'),
  chip:      require('../assets/images/w3_chip_256.png'),
  circuit:   require('../assets/images/w3_circuit_256.png'),
  cockpit:   require('../assets/images/w3_cockpit_256.png'),
  coil:      require('../assets/images/w3_coil_256.png'),
  compressor: require('../assets/images/w3_compressor_256.png'),
  coupler:   require('../assets/images/w3_coupler_256.png'),
  dynamo:    require('../assets/images/w3_dynamo_256.png'),
  engine:    require('../assets/images/w3_engine_256.png'),
  exhaust:   require('../assets/images/w3_exhaust_256.png'),
  filter:    require('../assets/images/w3_filter_256.png'),
  flare:     require('../assets/images/w3_flare_256.png'),
  floodlight: require('../assets/images/w3_floodlight_256.png'),
  furnace:   require('../assets/images/w3_furnace_256.png'),
  gasket:    require('../assets/images/w3_gasket_256.png'),
  gauge:     require('../assets/images/w3_gauge_256.png'),
  generator: require('../assets/images/w3_generator_256.png'),
  hose:      require('../assets/images/w3_hose_256.png'),
  inverter:  require('../assets/images/w3_inverter_256.png'),
  junction:  require('../assets/images/w3_junction_256.png'),
  lantern:   require('../assets/images/w3_lantern_256.png'),
  lighthouse: require('../assets/images/w3_lighthouse_256.png'),
  mainframe: require('../assets/images/w3_mainframe_256.png'),
  manifold:  require('../assets/images/w3_manifold_256.png'),
  motor:     require('../assets/images/w3_motor_256.png'),
  network:   require('../assets/images/w3_network_256.png'),
  nozzle:    require('../assets/images/w3_nozzle_256.png'),
  pipe:      require('../assets/images/w3_pipe_256.png'),
  piston:    require('../assets/images/w3_piston_256.png'),
  'power core': require('../assets/images/w3_power_core_256.png'),
  'pressure vessel': require('../assets/images/w3_pressure_vessel_256.png'),
  processor: require('../assets/images/w3_processor_256.png'),
  pump:      require('../assets/images/w3_pump_256.png'),
  reactor:   require('../assets/images/w3_reactor_256.png'),
  regulator: require('../assets/images/w3_regulator_256.png'),
  relay:     require('../assets/images/w3_relay_256.png'),
  rig:       require('../assets/images/w3_rig_256.png'),
  screen:    require('../assets/images/w3_screen_256.png'),
  sensor:    require('../assets/images/w3_sensor_256.png'),
  solenoid:  require('../assets/images/w3_solenoid_256.png'),
  switch:    require('../assets/images/w3_switch_256.png'),
  system:    require('../assets/images/w3_system_256.png'),
  tank:      require('../assets/images/w3_tank_256.png'),
  terminal:  require('../assets/images/w3_terminal_256.png'),
  transformer: require('../assets/images/w3_transformer_256.png'),
  turbine:   require('../assets/images/w3_turbine_256.png'),
  'vacuum tube': require('../assets/images/w3_vacuum_tube_256.png'),
  valve:     require('../assets/images/w3_valve_256.png'),
  visor:     require('../assets/images/w3_visor_256.png'),
  welder:    require('../assets/images/w3_welder_256.png'),
  wire:      require('../assets/images/w3_wire_256.png'),
};
