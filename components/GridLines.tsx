import React, { memo } from 'react';
import { View } from 'react-native';

interface GridLinesProps {
  gridSize: number;
  cellSize: number;
  gap: number;
  totalGridPx: number;
}

// ── Bevel color layers ──────────────────────────────────────────────────────
// Simulates a chiseled-stone groove between cells:
//   HIGHLIGHT  — top-left edge catches the light
//   MID_DARK   — deep groove core
//   SHADOW     — bottom-right edge falls into shadow
const HIGHLIGHT  = 'rgba(180, 110, 45, 0.80)';  // warm golden brown
const MID_DARK   = 'rgba(55,  26,  6, 0.97)';   // very dark brown core
const SHADOW     = 'rgba(10,   3,  0, 0.88)';   // near-black shadow

/**
 * Draws beveled brown separator lines between every grid cell.
 * Uses the full gap width (8 px) split into three color bands:
 *   [1 px highlight] [6 px dark core] [1 px shadow]
 * Placed below the cells so touch events are never intercepted.
 */
const GridLines = memo(({ gridSize, cellSize, gap, totalGridPx }: GridLinesProps) => {
  const lines: React.ReactElement[] = [];
  const hl = 1;             // highlight strip width (px)
  const sh = 1;             // shadow strip width (px)
  const core = gap - hl - sh; // main dark strip (fills remainder)

  for (let i = 1; i < gridSize; i++) {
    const offset = i * (cellSize + gap) - gap; // start of gap in px

    // ── Vertical divider ─────────────────────────────────────────────────
    lines.push(
      <View
        key={`v${i}`}
        pointerEvents="none"
        style={{ position: 'absolute', left: offset, top: 0, width: gap, height: totalGridPx }}
      >
        <View style={{ position: 'absolute', left: 0,        top: 0, bottom: 0, width: hl,   backgroundColor: HIGHLIGHT }} />
        <View style={{ position: 'absolute', left: hl,       top: 0, bottom: 0, width: core, backgroundColor: MID_DARK }} />
        <View style={{ position: 'absolute', left: hl + core, top: 0, bottom: 0, width: sh,  backgroundColor: SHADOW }} />
      </View>,
    );

    // ── Horizontal divider ───────────────────────────────────────────────
    lines.push(
      <View
        key={`h${i}`}
        pointerEvents="none"
        style={{ position: 'absolute', top: offset, left: 0, height: gap, width: totalGridPx }}
      >
        <View style={{ position: 'absolute', top: 0,        left: 0, right: 0, height: hl,   backgroundColor: HIGHLIGHT }} />
        <View style={{ position: 'absolute', top: hl,       left: 0, right: 0, height: core, backgroundColor: MID_DARK }} />
        <View style={{ position: 'absolute', top: hl + core, left: 0, right: 0, height: sh,  backgroundColor: SHADOW }} />
      </View>,
    );
  }

  return <>{lines}</>;
});

GridLines.displayName = 'GridLines';
export default GridLines;
