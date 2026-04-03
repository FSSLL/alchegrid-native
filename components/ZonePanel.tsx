import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import type { Zone, Level, ElementID } from '../lib/types';
import { isZoneSatisfied } from '../lib/validators';
import colors from '../constants/colors';
import { ELEMENT_EMOJIS } from '../lib/elementEmojis';

interface ZonePanelProps {
  level: Level;
  board: (ElementID | null)[][];
  selectedZone: Zone | null;
  onSelectZone: (zone: Zone | null) => void;
}

const ZonePanel = memo(({ level, board, selectedZone, onSelectZone }: ZonePanelProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {level.zones.map((zone, i) => {
        const satisfied = isZoneSatisfied(zone, board);
        const isSelected = selectedZone?.id === zone.id;
        const tint = colors.zoneTints[i % colors.zoneTints.length];

        return (
          <TouchableOpacity
            key={zone.id}
            onPress={() => onSelectZone(isSelected ? null : zone)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.zoneCard,
                {
                  borderColor: isSelected ? '#ff5500' : satisfied ? '#10b981' : tint,
                  backgroundColor: `${tint}20`,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.recipeName, { color: satisfied ? '#10b981' : '#eef1f5' }]}>
                  {satisfied ? '✓ ' : ''}{zone.recipeName ?? 'Unknown'}
                </Text>
              </View>
              <View style={styles.ingredients}>
                {zone.ingredients.map((el) => (
                  <Text key={el} style={styles.ingredientText}>
                    {ELEMENT_EMOJIS[el.toLowerCase()] ?? '●'} {el}
                  </Text>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

ZonePanel.displayName = 'ZonePanel';

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 8,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 4,
  },
  zoneCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 8,
    minWidth: 100,
    maxWidth: 130,
  },
  cardHeader: {
    marginBottom: 4,
  },
  recipeName: {
    fontSize: 11,
    fontWeight: '700',
  },
  ingredients: {
    gap: 2,
  },
  ingredientText: {
    fontSize: 9,
    color: '#8e9ab0',
    fontWeight: '500',
  },
});

export default ZonePanel;
