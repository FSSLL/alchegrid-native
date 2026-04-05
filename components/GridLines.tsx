import React, { memo } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GridLinesProps {
  gridSize: number;
  cellSize: number;
  gap: number;
  totalGridPx: number;
}

// Pipe-top cross-section gradient: edges fall into darkness, crown catches the light.
// Reading left→right (or top→bottom) across the 8 px groove:
//   deep shadow → dark brown → mid brown → warm crown → mid brown → dark brown → deep shadow
const PIPE_COLORS: readonly string[] = [
  '#0B0301',  // 0.00 — deep shadow at far edge
  '#2C1005',  // 0.18 — dark recessed wall
  '#6B3010',  // 0.38 — rising curved surface
  '#C47828',  // 0.50 — crown (peak highlight)
  '#6B3010',  // 0.62 — descending curved surface
  '#2C1005',  // 0.82 — dark recessed wall
  '#0B0301',  // 1.00 — deep shadow at far edge
] as const;

const PIPE_STOPS = [0, 0.18, 0.38, 0.5, 0.62, 0.82, 1] as const;

const GridLines = memo(({ gridSize, cellSize, gap, totalGridPx }: GridLinesProps) => {
  const lines: React.ReactElement[] = [];

  for (let i = 1; i < gridSize; i++) {
    const offset = i * (cellSize + gap) - gap;

    // Vertical divider — gradient runs left → right across the groove width
    lines.push(
      <LinearGradient
        key={`v${i}`}
        colors={PIPE_COLORS as unknown as string[]}
        locations={PIPE_STOPS as unknown as number[]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          position: 'absolute',
          left: offset,
          top: 0,
          width: gap,
          height: totalGridPx,
        }}
        pointerEvents="none"
      />,
    );

    // Horizontal divider — gradient runs top → bottom across the groove height
    lines.push(
      <LinearGradient
        key={`h${i}`}
        colors={PIPE_COLORS as unknown as string[]}
        locations={PIPE_STOPS as unknown as number[]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          top: offset,
          left: 0,
          height: gap,
          width: totalGridPx,
        }}
        pointerEvents="none"
      />,
    );
  }

  return <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0 }}>{lines}</View>;
});

GridLines.displayName = 'GridLines';
export default GridLines;
