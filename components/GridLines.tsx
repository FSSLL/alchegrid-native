import React, { memo } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GridLinesProps {
  gridSize: number;
  cellSize: number;
  gap: number;
  totalGridPx: number;
}

// Pipe-top cross-section gradient (dark edge → bright crown → dark edge)
const PIPE_COLORS: readonly string[] = [
  '#0B0301',
  '#2C1005',
  '#6B3010',
  '#C47828',  // crown (peak)
  '#6B3010',
  '#2C1005',
  '#0B0301',
] as const;
const PIPE_STOPS = [0, 0.18, 0.38, 0.5, 0.62, 0.82, 1] as const;

// At every intersection (i, j), render two overlapping LinearGradients:
//   1. L→R  (same profile as the vertical strip, fills the intersection horizontally)
//   2. T→B  (same profile as the horizontal strip, blended on top at half opacity)
// Together they produce a bright raised "node" at the center with shadow falling
// off in all four directions — exactly how two rounded pipes join.

const GridLines = memo(({ gridSize, cellSize, gap, totalGridPx }: GridLinesProps) => {
  const separators: React.ReactElement[] = [];
  const junctions: React.ReactElement[] = [];

  for (let i = 1; i < gridSize; i++) {
    const offset = i * (cellSize + gap) - gap;

    // ── Vertical strip (full height, gradient L→R) ──────────────────────
    separators.push(
      <LinearGradient
        key={`v${i}`}
        colors={PIPE_COLORS as unknown as string[]}
        locations={PIPE_STOPS as unknown as number[]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', left: offset, top: 0, width: gap, height: totalGridPx, pointerEvents: 'none' }}
      />,
    );

    // ── Horizontal strip (full width, gradient T→B) ─────────────────────
    separators.push(
      <LinearGradient
        key={`h${i}`}
        colors={PIPE_COLORS as unknown as string[]}
        locations={PIPE_STOPS as unknown as number[]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: offset, left: 0, height: gap, width: totalGridPx, pointerEvents: 'none' }}
      />,
    );
  }

  // ── Junction caps — rendered on top of all strips ──────────────────────
  // One per intersection (i, j). Two blended gradients give a rounded node.
  for (let i = 1; i < gridSize; i++) {
    for (let j = 1; j < gridSize; j++) {
      const top  = i * (cellSize + gap) - gap;
      const left = j * (cellSize + gap) - gap;

      junctions.push(
        // Layer 1: L→R gradient (matches vertical strip)
        <LinearGradient
          key={`jv${i}_${j}`}
          colors={PIPE_COLORS as unknown as string[]}
          locations={PIPE_STOPS as unknown as number[]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', top, left, width: gap, height: gap, pointerEvents: 'none' }}
        />,
      );

      junctions.push(
        // Layer 2: T→B gradient (matches horizontal strip) at 50% opacity — blends with layer 1
        <LinearGradient
          key={`jh${i}_${j}`}
          colors={PIPE_COLORS as unknown as string[]}
          locations={PIPE_STOPS as unknown as number[]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', top, left, width: gap, height: gap, opacity: 0.55, pointerEvents: 'none' }}
        />,
      );
    }
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      {separators}
      {junctions}
    </View>
  );
});

GridLines.displayName = 'GridLines';
export default GridLines;
