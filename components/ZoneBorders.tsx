import React, { memo, useMemo } from 'react';
import Svg, { Path, Rect, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';
import type { Zone, CellCoord } from '../lib/types';

interface ZoneBordersProps {
  zones: Zone[];
  size: number;
  cellSize: number;
  gap: number;
  selectedZone: Zone | null;
}

function getZoneId(row: number, col: number, zones: Zone[]): string {
  for (const z of zones) {
    for (const c of z.cells) {
      if (c.row === row && c.col === col) return z.id;
    }
  }
  return '';
}

function buildZoneMap(size: number, zones: Zone[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const z of zones) {
    for (const c of z.cells) {
      map[`${c.row},${c.col}`] = z.id;
    }
  }
  return map;
}

function cellToPixel(row: number, col: number, cellSize: number, gap: number): { x: number; y: number } {
  return {
    x: col * (cellSize + gap),
    y: row * (cellSize + gap),
  };
}

function buildBorderPaths(size: number, zones: Zone[], cellSize: number, gap: number): string {
  const zoneMap = buildZoneMap(size, zones);
  const segments: string[] = [];
  const inset = 3;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const myZone = zoneMap[`${r},${c}`] ?? '';
      const { x, y } = cellToPixel(r, c, cellSize, gap);

      // Top edge
      const topZone = r > 0 ? zoneMap[`${r - 1},${c}`] ?? '' : null;
      if (topZone !== myZone) {
        segments.push(`M ${x + inset} ${y} L ${x + cellSize - inset} ${y}`);
      }

      // Bottom edge
      const botZone = r < size - 1 ? zoneMap[`${r + 1},${c}`] ?? '' : null;
      if (botZone !== myZone) {
        const ey = y + cellSize + gap;
        segments.push(`M ${x + inset} ${ey} L ${x + cellSize - inset} ${ey}`);
      }

      // Left edge
      const leftZone = c > 0 ? zoneMap[`${r},${c - 1}`] ?? '' : null;
      if (leftZone !== myZone) {
        segments.push(`M ${x} ${y + inset} L ${x} ${y + cellSize - inset}`);
      }

      // Right edge
      const rightZone = c < size - 1 ? zoneMap[`${r},${c + 1}`] ?? '' : null;
      if (rightZone !== myZone) {
        const ex = x + cellSize + gap;
        segments.push(`M ${ex} ${y + inset} L ${ex} ${y + cellSize - inset}`);
      }
    }
  }

  return segments.join(' ');
}

function buildHighlightPath(zone: Zone, cellSize: number, gap: number): string {
  const segments: string[] = [];
  const inset = 2;

  const cellSet = new Set(zone.cells.map((c) => `${c.row},${c.col}`));

  for (const { row, col } of zone.cells) {
    const { x, y } = cellToPixel(row, col, cellSize, gap);

    const hasTop = !cellSet.has(`${row - 1},${col}`);
    const hasBot = !cellSet.has(`${row + 1},${col}`);
    const hasLeft = !cellSet.has(`${row},${col - 1}`);
    const hasRight = !cellSet.has(`${row},${col + 1}`);

    if (hasTop) segments.push(`M ${x + inset} ${y} L ${x + cellSize - inset} ${y}`);
    if (hasBot) segments.push(`M ${x + inset} ${y + cellSize} L ${x + cellSize - inset} ${y + cellSize}`);
    if (hasLeft) segments.push(`M ${x} ${y + inset} L ${x} ${y + cellSize - inset}`);
    if (hasRight) segments.push(`M ${x + cellSize} ${y + inset} L ${x + cellSize} ${y + cellSize - inset}`);
  }

  return segments.join(' ');
}

const ZoneBorders = memo(({ zones, size, cellSize, gap, selectedZone }: ZoneBordersProps) => {
  const totalSize = size * cellSize + (size - 1) * gap;

  const borderPath = useMemo(
    () => buildBorderPaths(size, zones, cellSize, gap),
    [size, zones, cellSize, gap]
  );

  const highlightPath = useMemo(
    () => (selectedZone ? buildHighlightPath(selectedZone, cellSize, gap) : ''),
    [selectedZone, cellSize, gap]
  );

  return (
    <Svg
      width={totalSize}
      height={totalSize}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <Filter id="zone-glow" x="-20%" y="-20%" width="140%" height="140%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation={1.5} result="blur" />
          <FeMerge>
            <FeMergeNode in="blur" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
        <Filter id="zone-highlight-glow" x="-20%" y="-20%" width="140%" height="140%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation={2} result="blur" />
          <FeMerge>
            <FeMergeNode in="blur" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>

      <Rect
        x={0.5}
        y={0.5}
        width={totalSize - 1}
        height={totalSize - 1}
        rx={12}
        ry={12}
        fill="none"
        stroke="#00ff55"
        strokeWidth={4.5}
        filter="url(#zone-glow)"
      />

      {borderPath ? (
        <Path
          d={borderPath}
          stroke="#00ff55"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#zone-glow)"
        />
      ) : null}

      {highlightPath ? (
        <Path
          d={highlightPath}
          stroke="#ff5500"
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#zone-highlight-glow)"
        />
      ) : null}
    </Svg>
  );
});

ZoneBorders.displayName = 'ZoneBorders';
export default ZoneBorders;
