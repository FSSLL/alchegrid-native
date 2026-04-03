import React, { memo, useMemo } from 'react';
import Svg, { Path, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';
import type { Zone } from '../lib/types';
import colors from '../constants/colors';

interface ZoneBordersProps {
  zones: Zone[];
  size: number;
  cellSize: number;
  gap: number;
  selectedZone: Zone | null;
}

// Build the outer perimeter path for a single zone (shared edges not drawn)
function buildZonePerimeterPath(zone: Zone, cellSize: number, gap: number): string {
  const cellSet = new Set(zone.cells.map((c) => `${c.row},${c.col}`));
  const inset = 3;
  const segs: string[] = [];

  for (const { row, col } of zone.cells) {
    const x = col * (cellSize + gap);
    const y = row * (cellSize + gap);
    const x2 = x + cellSize;
    const y2 = y + cellSize;

    // Top edge: draw if no same-zone cell above
    if (!cellSet.has(`${row - 1},${col}`))
      segs.push(`M ${x + inset} ${y} L ${x2 - inset} ${y}`);

    // Bottom edge: draw if no same-zone cell below
    if (!cellSet.has(`${row + 1},${col}`))
      segs.push(`M ${x + inset} ${y2} L ${x2 - inset} ${y2}`);

    // Left edge: draw if no same-zone cell to the left
    if (!cellSet.has(`${row},${col - 1}`))
      segs.push(`M ${x} ${y + inset} L ${x} ${y2 - inset}`);

    // Right edge: draw if no same-zone cell to the right
    if (!cellSet.has(`${row},${col + 1}`))
      segs.push(`M ${x2} ${y + inset} L ${x2} ${y2 - inset}`);
  }

  return segs.join(' ');
}

const ZoneBorders = memo(({ zones, size, cellSize, gap, selectedZone }: ZoneBordersProps) => {
  const totalSize = size * cellSize + (size - 1) * gap;

  const zonePaths = useMemo(
    () => zones.map((z) => buildZonePerimeterPath(z, cellSize, gap)),
    [zones, cellSize, gap]
  );

  const selectedPath = useMemo(
    () => (selectedZone ? buildZonePerimeterPath(selectedZone, cellSize, gap) : ''),
    [selectedZone, cellSize, gap]
  );

  return (
    <Svg
      width={totalSize}
      height={totalSize}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      <Defs>
        {/* Glow filter for selected zone per spec §17.13 */}
        <Filter id="sel-glow" x="-30%" y="-30%" width="160%" height="160%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation={1.5} result="blur1" />
          <FeGaussianBlur in="SourceGraphic" stdDeviation={1.5} result="blur2" />
          <FeGaussianBlur in="SourceGraphic" stdDeviation={1.5} result="blur3" />
          <FeMerge>
            <FeMergeNode in="blur1" />
            <FeMergeNode in="blur2" />
            <FeMergeNode in="blur3" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>

      {/* Normal zone borders: 2.5px, each zone gets its own color (spec §17.13) */}
      {zonePaths.map((path, i) => {
        if (!path) return null;
        const zoneColor = colors.zoneTints[i % colors.zoneTints.length];
        return (
          <Path
            key={zones[i].id}
            d={path}
            stroke={zoneColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.75}
          />
        );
      })}

      {/* Selected zone overlay: 5.5px #ff5500 with neon glow (spec §17.13) */}
      {selectedPath ? (
        <Path
          d={selectedPath}
          stroke="#ff5500"
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#sel-glow)"
        />
      ) : null}
    </Svg>
  );
});

ZoneBorders.displayName = 'ZoneBorders';
export default ZoneBorders;
