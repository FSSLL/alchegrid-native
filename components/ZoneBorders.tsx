import React, { memo, useMemo } from 'react';
import Svg, { Path, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';
import type { Zone } from '../lib/types';

interface ZoneBordersProps {
  zones: Zone[];
  size: number;
  cellSize: number;
  gap: number;
  selectedZone: Zone | null;
}

const ZONE_GREEN   = '#22c55e';
const ZONE_WIDTH   = 3.5;
const ZONE_OPACITY = 0.9;

// Build the outer perimeter path for a group of cells (shared edges suppressed)
function buildMergedPerimeterPath(
  cells: { row: number; col: number }[],
  cellSize: number,
  gap: number,
): string {
  const cellSet = new Set(cells.map((c) => `${c.row},${c.col}`));
  const inset = 0;
  const segs: string[] = [];

  for (const { row, col } of cells) {
    const x  = col * (cellSize + gap);
    const y  = row * (cellSize + gap);
    const x2 = x + cellSize;
    const y2 = y + cellSize;

    if (!cellSet.has(`${row - 1},${col}`))
      segs.push(`M ${x + inset} ${y} L ${x2 - inset} ${y}`);
    if (!cellSet.has(`${row + 1},${col}`))
      segs.push(`M ${x + inset} ${y2} L ${x2 - inset} ${y2}`);
    if (!cellSet.has(`${row},${col - 1}`))
      segs.push(`M ${x} ${y + inset} L ${x} ${y2 - inset}`);
    if (!cellSet.has(`${row},${col + 1}`))
      segs.push(`M ${x2} ${y + inset} L ${x2} ${y2 - inset}`);
  }

  return segs.join(' ');
}

const ZoneBorders = memo(({ zones, size, cellSize, gap, selectedZone }: ZoneBordersProps) => {
  const totalSize = size * cellSize + (size - 1) * gap;

  // Group zones by recipeName — adjacent same-recipe zones share no internal border
  const groupPaths = useMemo(() => {
    const groups: Record<string, { row: number; col: number }[]> = {};
    for (const zone of zones) {
      const key = zone.recipeName ?? zone.id;
      if (!groups[key]) groups[key] = [];
      for (const c of zone.cells) groups[key].push(c);
    }
    return Object.entries(groups).map(([key, cells]) => ({
      key,
      path: buildMergedPerimeterPath(cells, cellSize, gap),
    }));
  }, [zones, cellSize, gap]);

  // Selected zone highlight (individual zone, per tap)
  const selectedPath = useMemo(
    () => (selectedZone ? buildMergedPerimeterPath(selectedZone.cells, cellSize, gap) : ''),
    [selectedZone, cellSize, gap],
  );

  return (
    <Svg
      width={totalSize}
      height={totalSize}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      <Defs>
        <Filter id="zone-glow" x="-40%" y="-40%" width="180%" height="180%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation={2.5} result="blur1" />
          <FeGaussianBlur in="SourceGraphic" stdDeviation={4}   result="blur2" />
          <FeMerge>
            <FeMergeNode in="blur2" />
            <FeMergeNode in="blur1" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>

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

      {/* Zone borders — same-recipe groups share no internal edge */}
      {groupPaths.map(({ key, path }) => {
        if (!path) return null;
        return (
          <Path
            key={key}
            d={path}
            stroke={ZONE_GREEN}
            strokeWidth={ZONE_WIDTH}
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
            opacity={ZONE_OPACITY}
            filter="url(#zone-glow)"
          />
        );
      })}

      {/* Selected zone — orange neon glow */}
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
