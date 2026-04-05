import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Zone } from '../lib/types';
import { RECIPE_EMOJIS } from '../lib/elementEmojis';
import { ELEMENT_EMOJIS } from '../lib/elementEmojis';

function normKey(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function getEmoji(recipeName: string): string | null {
  const k = normKey(recipeName);
  return RECIPE_EMOJIS[k] ?? ELEMENT_EMOJIS[k] ?? null;
}

function topLeftCell(cells: { row: number; col: number }[]): { row: number; col: number } {
  return cells.reduce((best, c) => {
    if (c.row < best.row) return c;
    if (c.row === best.row && c.col < best.col) return c;
    return best;
  }, cells[0]);
}

interface ZoneLabelsProps {
  zones: Zone[];
  cellSize: number;
  gap: number;
  minZoneCells?: number;
}

const ZoneLabels = memo(({ zones, cellSize, gap, minZoneCells = 1 }: ZoneLabelsProps) => {
  const labels = useMemo(
    () =>
      zones.flatMap((zone) => {
        if (zone.cells.length < minZoneCells) return [];
        const emoji = getEmoji(zone.recipeName ?? '');
        if (!emoji) return [];
        const cell = topLeftCell(zone.cells);
        const x = cell.col * (cellSize + gap);
        const y = cell.row * (cellSize + gap);
        return [{ key: zone.id, x, y, emoji }];
      }),
    [zones, cellSize, gap],
  );

  const badgeSize = Math.max(14, Math.min(20, cellSize * 0.38));
  const fontSize = badgeSize * 0.72;

  return (
    <>
      {labels.map(({ key, x, y, emoji }) => (
        <View
          key={key}
          pointerEvents="none"
          style={[
            styles.badge,
            {
              left: x + 2,
              top: y + 2,
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize * 0.35,
            },
          ]}
        >
          <Text style={[styles.emoji, { fontSize }]}>{emoji}</Text>
        </View>
      ))}
    </>
  );
});

ZoneLabels.displayName = 'ZoneLabels';

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  emoji: {
    textAlign: 'center',
    lineHeight: undefined,
  },
});

export default ZoneLabels;
