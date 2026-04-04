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
  // ── World 1 – Nature (elements) ─────────────────────────────────────────────
  earth:     require('../assets/images/earth.png'),
  fire:      require('../assets/images/fire.png'),
  water:     require('../assets/images/water.png'),
  wind:      require('../assets/images/wind.png'),

  // World 1 – recipe combos
  clay:      require('../assets/images/clay.png'),
  dust:      require('../assets/images/dust.png'),
  energy:    require('../assets/images/energy.png'),
  ice:       require('../assets/images/ice.png'),
  lava:      require('../assets/images/lava.png'),
  life:      require('../assets/images/life.png'),
  lightning: require('../assets/images/lightning.png'),
  mud:       require('../assets/images/mud.png'),
  sand:      require('../assets/images/sand.png'),
  steam:     require('../assets/images/steam.png'),
  storm:     require('../assets/images/storm.png'),

  // ── World 2 – Materials Workshop (elements) ──────────────────────────────────
  glass:     require('../assets/images/glass.png'),
  metal:     require('../assets/images/metal.png'),
  plastic:   require('../assets/images/plastic.png'),
  rubber:    require('../assets/images/rubber.png'),
  wood:      require('../assets/images/wood.png'),

  // World 2 – recipe combos
  bumper:    require('../assets/images/bumper.png'),
  cabinet:   require('../assets/images/cabinet.png'),
  case:      require('../assets/images/case.png'),
  clamp:     require('../assets/images/clamp.png'),
  console:   require('../assets/images/console.png'),
  core:      require('../assets/images/core.png'),
  crate:     require('../assets/images/crate.png'),
  device:    require('../assets/images/device.png'),
  fixture:   require('../assets/images/fixture.png'),
  frame:     require('../assets/images/frame.png'),
  gear:      require('../assets/images/gear.png'),
  goggle:    require('../assets/images/goggle.png'),
  greenhouse:require('../assets/images/greenhouse.png'),
  grip:      require('../assets/images/grip.png'),
  laminate:  require('../assets/images/laminate.png'),
  machine:   require('../assets/images/machine.png'),
  mirror:    require('../assets/images/mirror.png'),
  plywood:   require('../assets/images/plywood.png'),
  seal:      require('../assets/images/seal.png'),
  slingshot: require('../assets/images/slingshot.png'),
  spring:    require('../assets/images/spring.png'),
  tire:      require('../assets/images/tire.png'),
  toolkit:   require('../assets/images/toolkit.png'),
  window:    require('../assets/images/window.png'),

  // ── World 3 – Machines & Power (elements) ────────────────────────────────────
  electricity: require('../assets/images/electricity.png'),
  fuel:        require('../assets/images/fuel.png'),

  // World 3 – recipe combos
  amplifier:         require('../assets/images/w3_amplifier.png'),
  assembly:          require('../assets/images/w3_assembly.png'),
  battery:           require('../assets/images/w3_battery.png'),
  burner:            require('../assets/images/w3_burner.png'),
  cable:             require('../assets/images/w3_cable.png'),
  canister:          require('../assets/images/w3_canister.png'),
  capsule:           require('../assets/images/w3_capsule.png'),
  cartridge:         require('../assets/images/w3_cartridge.png'),
  cell:              require('../assets/images/w3_cell.png'),
  chip:              require('../assets/images/w3_chip.png'),
  circuit:           require('../assets/images/w3_circuit.png'),
  cockpit:           require('../assets/images/w3_cockpit.png'),
  coil:              require('../assets/images/w3_coil.png'),
  compressor:        require('../assets/images/w3_compressor.png'),
  coupler:           require('../assets/images/w3_coupler.png'),
  dynamo:            require('../assets/images/w3_dynamo.png'),
  engine:            require('../assets/images/w3_engine.png'),
  exhaust:           require('../assets/images/w3_exhaust.png'),
  filter:            require('../assets/images/w3_filter.png'),
  flare:             require('../assets/images/w3_flare.png'),
  floodlight:        require('../assets/images/w3_floodlight.png'),
  furnace:           require('../assets/images/w3_furnace.png'),
  gasket:            require('../assets/images/w3_gasket.png'),
  gauge:             require('../assets/images/w3_gauge.png'),
  generator:         require('../assets/images/w3_generator.png'),
  hose:              require('../assets/images/w3_hose.png'),
  inverter:          require('../assets/images/w3_inverter.png'),
  junction:          require('../assets/images/w3_junction.png'),
  lantern:           require('../assets/images/w3_lantern.png'),
  lighthouse:        require('../assets/images/w3_lighthouse.png'),
  mainframe:         require('../assets/images/w3_mainframe.png'),
  manifold:          require('../assets/images/w3_manifold.png'),
  motor:             require('../assets/images/w3_motor.png'),
  network:           require('../assets/images/w3_network.png'),
  nozzle:            require('../assets/images/w3_nozzle.png'),
  pipe:              require('../assets/images/w3_pipe.png'),
  piston:            require('../assets/images/w3_piston.png'),
  powercore:         require('../assets/images/w3_power_core.png'),
  'power core':      require('../assets/images/w3_power_core.png'),
  'pressure vessel': require('../assets/images/w3_pressure_vessel.png'),
  processor:         require('../assets/images/w3_processor.png'),
  pump:              require('../assets/images/w3_pump.png'),
  reactor:           require('../assets/images/w3_reactor.png'),
  regulator:         require('../assets/images/w3_regulator.png'),
  relay:             require('../assets/images/w3_relay.png'),
  rig:               require('../assets/images/w3_rig.png'),
  screen:            require('../assets/images/w3_screen.png'),
  sensor:            require('../assets/images/w3_sensor.png'),
  solenoid:          require('../assets/images/w3_solenoid.png'),
  switch:            require('../assets/images/w3_switch.png'),
  system:            require('../assets/images/w3_system.png'),
  tank:              require('../assets/images/w3_tank.png'),
  terminal:          require('../assets/images/w3_terminal.png'),
  transformer:       require('../assets/images/w3_transformer.png'),
  turbine:           require('../assets/images/w3_turbine.png'),
  'vacuum tube':     require('../assets/images/w3_vacuum_tube.png'),
  valve:             require('../assets/images/w3_valve.png'),
  visor:             require('../assets/images/w3_visor.png'),
  welder:            require('../assets/images/w3_welder.png'),
  wire:              require('../assets/images/w3_wire.png'),
};
