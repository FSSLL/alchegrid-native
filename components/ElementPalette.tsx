import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Level, ElementID } from '../lib/types';
import { ELEMENT_EMOJIS } from '../lib/elementEmojis';

interface ElementPaletteProps {
  level: Level;
  board: (ElementID | null)[][];
  activeElement: ElementID | null;
  onSelectElement: (el: ElementID | null) => void;
}

interface PaletteItemProps {
  element: ElementID;
  remaining: number;
  isActive: boolean;
  itemSize: number;
  onPress: () => void;
}

const PaletteItem = memo(({ element, remaining, isActive, itemSize, onPress }: PaletteItemProps) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.08 : 1, { stiffness: 300, damping: 20 });
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const exhausted = remaining === 0;
  const emoji = ELEMENT_EMOJIS[element.toLowerCase()] ?? element[0];
  const fontSize = itemSize * 0.44;
  const labelFontSize = itemSize * 0.19;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={exhausted}
      style={styles.itemWrapper}
    >
      {/* Label above tile — visible (orange) when active, hidden (transparent) when not */}
      <Text
        style={[
          styles.elementLabel,
          {
            fontSize: labelFontSize,
            color: isActive ? '#ff6a00' : 'transparent',
            fontWeight: '700',
          },
        ]}
        numberOfLines={1}
      >
        {element}
      </Text>

      <Animated.View
        style={[
          styles.item,
          {
            width: itemSize,
            height: itemSize,
            // Active: orange ring border only (not fill)
            borderColor: isActive ? '#ff6a00' : exhausted ? '#1a1f2e' : '#2a3550',
            borderWidth: isActive ? 2.5 : 1,
            opacity: exhausted ? 0.4 : 1,
          },
          animatedStyle,
        ]}
      >
        <Text style={{ fontSize }}>{emoji}</Text>

        {/* Count badge — bottom-left corner per spec §1.5 */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{remaining}</Text>
        </View>
      </Animated.View>

      {/* Label below tile — visible (muted) when not active, hidden when active */}
      <Text
        style={[
          styles.elementLabel,
          {
            fontSize: labelFontSize,
            color: isActive ? 'transparent' : '#6b7a96',
            fontWeight: '500',
          },
        ]}
        numberOfLines={1}
      >
        {element}
      </Text>
    </TouchableOpacity>
  );
});

PaletteItem.displayName = 'PaletteItem';

const ElementPalette = memo(({ level, board, activeElement, onSelectElement }: ElementPaletteProps) => {
  const gridSize = level.size;

  // Spec §17.9: item sizes by grid size
  const itemSize =
    gridSize <= 4 ? 80 :
    gridSize <= 5 ? 52 :
    gridSize <= 6 ? 44 : 38;

  const gap =
    gridSize <= 4 ? 16 :
    gridSize <= 5 ? 12 : 8;

  const paddingH =
    gridSize <= 5 ? 16 : 10;

  // Inventory counts per spec §6.1
  const remaining = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of board) {
      for (const el of row) {
        if (el) counts[el] = (counts[el] ?? 0) + 1;
      }
    }
    const result: Record<string, number> = {};
    for (const el of level.elements) {
      result[el] = gridSize - (counts[el] ?? 0);
    }
    return result;
  }, [board, level.elements, gridSize]);

  const handlePress = useCallback(
    (el: ElementID) => {
      Haptics.selectionAsync();
      onSelectElement(activeElement === el ? null : el);
    },
    [activeElement, onSelectElement]
  );

  return (
    <View style={[styles.container, { paddingHorizontal: paddingH }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { gap }]}
      >
        {level.elements.map((el) => (
          <PaletteItem
            key={el}
            element={el}
            remaining={remaining[el] ?? 0}
            isActive={activeElement === el}
            itemSize={itemSize}
            onPress={() => handlePress(el)}
          />
        ))}
      </ScrollView>
    </View>
  );
});

ElementPalette.displayName = 'ElementPalette';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(23,28,38,0.95)',
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242e42',
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  itemWrapper: {
    alignItems: 'center',
  },
  item: {
    borderRadius: 12,
    backgroundColor: '#12172280',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    left: 3,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
  },
  elementLabel: {
    textAlign: 'center',
    marginVertical: 2,
  },
});

export default ElementPalette;
