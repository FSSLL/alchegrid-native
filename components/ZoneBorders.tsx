import React, { memo, useMemo } from 'react';
import Svg, { Path, Rect, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';
import type { Zone } from '../lib/types';

interface ZoneBordersProps {
  zones: Zone[];
  size: number;
  cellSize: number;
  gap: number;
  selectedZone: Zone | null;
}

function buildZoneMap(zones: Zone[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const z of zones) {
    for (const c of z.cells) {
      map[`${c.row},${c.col}`] = z.id;
    }
  }
  return map;
}

function cellToPixel(row: number, col: number, cellSize: number, gap: number) {
  return { x: col * (cellSize + gap), y: row * (cellSize + gap) };
}

function buildBorderSegments(size: number, zones: Zone[], cellSize: number, gap: number): string {
  const zoneMap = buildZoneMap(zones);
  const inset = 3;
  const segs: string[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const myZone = zoneMap[`${r},${c}`] ?? '';
      const { x, y } = cellToPixel(r, c, cellSize, gap);
      const cx2 = x + cellSize;
      const cy2 = y + cellSize;

      const topZone = r > 0 ? zoneMap[`${r - 1},${c}`] ?? '' : null;
      const botZone = r < size - 1 ? zoneMap[`${r + 1},${c}`] ?? '' : null;
      const leftZone = c > 0 ? zoneMap[`${r},${c - 1}`] ?? '' : null;
      const rightZone = c < size - 1 ? zoneMap[`${r},${c + 1}`] ?? '' : null;

      if (topZone !== myZone) segs.push(`M ${x + inset} ${y} L ${cx2 - inset} ${y}`);
      if (botZone !== myZone) { const ey = cy2 + gap; segs.push(`M ${x + inset} ${ey} L ${cx2 - inset} ${ey}`); }
      if (leftZone !== myZone) segs.push(`M ${x} ${y + inset} L ${x} ${cy2 - inset}`);
      if (rightZone !== myZone) { const ex = cx2 + gap; segs.push(`M ${ex} ${y + inset} L ${ex} ${cy2 - inset}`); }
    }
  }
  return segs.join(' ');
}

function buildHighlightPath(zone: Zone, cellSize: number, gap: number): string {
  const segs: string[] = [];
  const inset = 2;
  const cellSet = new Set(zone.cells.map((c) => `${c.row},${c.col}`));

  for (const { row, col } of zone.cells) {
    const { x, y } = cellToPixel(row, col, cellSize, gap);
    const cx2 = x + cellSize;
    const cy2 = y + cellSize;

    if (!cellSet.has(`${row - 1},${col}`)) segs.push(`M ${x + inset} ${y} L ${cx2 - inset} ${y}`);
    if (!cellSet.has(`${row + 1},${col}`)) segs.push(`M ${x + inset} ${cy2} L ${cx2 - inset} ${cy2}`);
    if (!cellSet.has(`${row},${col - 1}`)) segs.push(`M ${x} ${y + inset} L ${x} ${cy2 - inset}`);
    if (!cellSet.has(`${row},${col + 1}`)) segs.push(`M ${cx2} ${y + inset} L ${cx2} ${cy2 - inset}`);
  }
  return segs.join(' ');
}

const ZoneBorders = memo(({ zones, size, cellSize, gap, selectedZone }: ZoneBordersProps) => {
  const totalSize = size * cellSize + (size - 1) * gap;

  const borderPath = useMemo(
    () => buildBorderSegments(size, zones, cellSize, gap),
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
        <Filter id="zone-glow" x="-25%" y="-25%" width="150%" height="150%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation={1.5} result="blur" />
          <FeMerge>
            <FeMergeNode in="blur" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
        <Filter id="highlight-glow" x="-25%" y="-25%" width="150%" height="150%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation={3} result="blur" />
          <FeMerge>
            <FeMergeNode in="blur" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>

      {/* Outer grid border */}
      <Rect
        x={1}
        y={1}
        width={totalSize - 2}
        height={totalSize - 2}
        rx={10}
        ry={10}
        fill="none"
        stroke="#ff5500"
        strokeWidth={5.5}
        filter="url(#zone-glow)"
      />

      {/* Zone divider lines */}
      {borderPath ? (
        <Path
          d={borderPath}
          stroke="#ff5500"
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#zone-glow)"
        />
      ) : null}

      {/* Selected zone highlight */}
      {highlightPath ? (
        <Path
          d={highlightPath}
          stroke="#ff6a00"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#highlight-glow)"
        />
      ) : null}
    </Svg>
  );
});

ZoneBorders.displayName = 'ZoneBorders';
export default ZoneBorders;
