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

const ZONE_YELLOW  = '#FFD700';
const ZONE_WIDTH   = 3.5;
const ZONE_OPACITY = 0.9;

// Build the outer perimeter path for a group of cells (shared edges suppressed).
// Each border is drawn at the MIDPOINT of the gap between cells so that borders
// from adjacent different-zone cells land on the same coordinate and appear as
// a single line rather than two parallel lines.
function buildMergedPerimeterPath(
  cells: { row: number; col: number }[],
  cellSize: number,
  gap: number,
): string {
  const cellSet = new Set(cells.map((c) => `${c.row},${c.col}`));
  const h = gap / 2; // half-gap — extend each border to the midpoint of the gap
  const segs: string[] = [];

  for (const { row, col } of cells) {
    const x  = col * (cellSize + gap);
    const y  = row * (cellSize + gap);
    const x2 = x + cellSize;
    const y2 = y + cellSize;

    if (!cellSet.has(`${row - 1},${col}`))
      segs.push(`M ${x - h} ${y - h} L ${x2 + h} ${y - h}`);
    if (!cellSet.has(`${row + 1},${col}`))
      segs.push(`M ${x - h} ${y2 + h} L ${x2 + h} ${y2 + h}`);
    if (!cellSet.has(`${row},${col - 1}`))
      segs.push(`M ${x - h} ${y - h} L ${x - h} ${y2 + h}`);
    if (!cellSet.has(`${row},${col + 1}`))
      segs.push(`M ${x2 + h} ${y - h} L ${x2 + h} ${y2 + h}`);
  }

  return segs.join(' ');
}

// ─── Static yellow borders ────────────────────────────────────────────────────
// Props: zones / cellSize / gap / svgSize / h
// This component is fully memoised: it never re-renders when selectedZone
// changes, preventing a costly SVG repaint on every cell tap.
interface StaticBordersProps {
  zones: Zone[];
  cellSize: number;
  gap: number;
  svgSize: number;
  h: number;
}

const StaticBorders = memo(({ zones, cellSize, gap, svgSize, h }: StaticBordersProps) => {
  const paths = useMemo(
    () => zones.map((zone) => ({
      key: zone.id,
      path: buildMergedPerimeterPath(zone.cells, cellSize, gap),
    })),
    [zones, cellSize, gap],
  );

  return (
    <Svg
      width={svgSize}
      height={svgSize}
      viewBox={`${-h} ${-h} ${svgSize} ${svgSize}`}
      style={{ position: 'absolute', top: -h, left: -h, pointerEvents: 'none' }}
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
      </Defs>

      {paths.map(({ key, path }) => {
        if (!path) return null;
        return (
          <Path
            key={key}
            d={path}
            stroke={ZONE_YELLOW}
            strokeWidth={ZONE_WIDTH}
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
            opacity={ZONE_OPACITY}
            filter="url(#zone-glow)"
          />
        );
      })}
    </Svg>
  );
});

StaticBorders.displayName = 'StaticBorders';

// ─── Selection overlay ────────────────────────────────────────────────────────
// Only this lightweight SVG re-renders when selectedZone changes.
interface SelectionOverlayProps {
  selectedZone: Zone | null;
  cellSize: number;
  gap: number;
  svgSize: number;
  h: number;
}

const SelectionOverlay = memo(({ selectedZone, cellSize, gap, svgSize, h }: SelectionOverlayProps) => {
  const path = useMemo(
    () => (selectedZone ? buildMergedPerimeterPath(selectedZone.cells, cellSize, gap) : ''),
    [selectedZone, cellSize, gap],
  );

  if (!path) return null;

  return (
    <Svg
      width={svgSize}
      height={svgSize}
      viewBox={`${-h} ${-h} ${svgSize} ${svgSize}`}
      style={{ position: 'absolute', top: -h, left: -h, pointerEvents: 'none' }}
    >
      <Defs>
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
      <Path
        d={path}
        stroke="#22c55e"
        strokeWidth={4.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#sel-glow)"
      />
    </Svg>
  );
});

SelectionOverlay.displayName = 'SelectionOverlay';

// ─── Public component ─────────────────────────────────────────────────────────
const ZoneBorders = memo(({ zones, size, cellSize, gap, selectedZone }: ZoneBordersProps) => {
  const totalSize = size * cellSize + (size - 1) * gap;
  const h = gap / 2;
  const svgSize = totalSize + gap; // = totalSize + 2*h

  return (
    <>
      <StaticBorders
        zones={zones}
        cellSize={cellSize}
        gap={gap}
        svgSize={svgSize}
        h={h}
      />
      <SelectionOverlay
        selectedZone={selectedZone}
        cellSize={cellSize}
        gap={gap}
        svgSize={svgSize}
        h={h}
      />
    </>
  );
});

ZoneBorders.displayName = 'ZoneBorders';
export default ZoneBorders;
