import React, { memo } from 'react';
import { View } from 'react-native';

interface GridLinesProps {
  gridSize: number;
  cellSize: number;
  gap: number;
  totalGridPx: number;
  color?: string;
}

/**
 * Renders thick separator lines between every grid cell.
 * Placed above the background image but below the cells so lines
 * are always pixel-perfect regardless of device screen size.
 */
const GridLines = memo(({ gridSize, cellSize, gap, totalGridPx, color = '#000000' }: GridLinesProps) => {
  const lines: React.ReactElement[] = [];

  for (let i = 1; i < gridSize; i++) {
    const offset = i * (cellSize + gap) - gap;

    lines.push(
      <View
        key={`v${i}`}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: offset,
          top: 0,
          width: gap,
          height: totalGridPx,
          backgroundColor: color,
        }}
      />,
    );

    lines.push(
      <View
        key={`h${i}`}
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: offset,
          left: 0,
          width: totalGridPx,
          height: gap,
          backgroundColor: color,
        }}
      />,
    );
  }

  return <>{lines}</>;
});

GridLines.displayName = 'GridLines';
export default GridLines;
