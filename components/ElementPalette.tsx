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
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Level, ElementID } from '../lib/types';
import colors from '../constants/colors';
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
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withSpring(1);
    }
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const exhausted = remaining === 0;
  const emoji = ELEMENT_EMOJIS[element.toLowerCase()] ?? element[0];
  const fontSize = itemSize * 0.42;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={exhausted}
    >
      <Animated.View
        style={[
          styles.item,
          {
            width: itemSize,
            height: itemSize,
            backgroundColor: isActive ? '#ff6a00' : '#171c26',
            borderColor: isActive ? '#ff6a00' : '#242e42',
            opacity: exhausted ? 0.4 : 1,
          },
          animatedStyle,
        ]}
      >
        <Text style={{ fontSize }}>{emoji}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{remaining}</Text>
        </View>
      </Animated.View>
      <Text style={[styles.elementName, { fontSize: itemSize * 0.18 }]} numberOfLines={1}>
        {element}
      </Text>
    </TouchableOpacity>
  );
});

PaletteItem.displayName = 'PaletteItem';

const ElementPalette = memo(({ level, board, activeElement, onSelectElement }: ElementPaletteProps) => {
  const gridSize = level.size;
  const itemSize = gridSize <= 4 ? 72 : gridSize <= 5 ? 52 : gridSize <= 6 ? 44 : 38;
  const gap = gridSize <= 4 ? 16 : gridSize <= 5 ? 12 : 8;

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
    <View style={styles.container}>
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
    backgroundColor: '#171c26',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  scroll: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  item: {
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 7,
    fontWeight: '700',
  },
  elementName: {
    color: '#8e9ab0',
    textAlign: 'center',
    marginTop: 3,
    fontWeight: '500',
  },
});

export default ElementPalette;
