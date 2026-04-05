import React, { memo } from 'react';
import { View } from 'react-native';
import type { Zone } from '../lib/types';

interface ZoneHighlightOverlayProps {
  zone: Zone | null;
  cellSize: number;
  gap: number;
}

const ZoneHighlightOverlay = memo(({ zone, cellSize, gap }: ZoneHighlightOverlayProps) => {
  if (!zone) return null;
  return (
    <>
      {zone.cells.map(({ row, col }) => (
        <View
          key={`${row},${col}`}
          style={{
            position: 'absolute',
            top: row * (cellSize + gap),
            left: col * (cellSize + gap),
            width: cellSize,
            height: cellSize,
            backgroundColor: 'rgba(255,85,0,0.12)',
            borderRadius: 10,
            pointerEvents: 'box-none',
          }}
        />
      ))}
    </>
  );
});

export default ZoneHighlightOverlay;
