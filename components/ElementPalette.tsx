import React, { memo, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  PanResponder,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Level, ElementID } from '../lib/types';
import { ELEMENT_EMOJIS } from '../lib/elementEmojis';
import { ELEMENT_PNGS } from '../constants/assets';
import { useDrag } from '../contexts/DragContext';

interface ElementPaletteProps {
  level: Level;
  board: (ElementID | null)[][];
}

interface PaletteItemProps {
  element: ElementID;
  remaining: number;
  itemSize: number;
}

const PaletteItem = memo(({ element, remaining, itemSize }: PaletteItemProps) => {
  const { startDrag, moveDrag, endDrag, cancelDrag } = useDrag();
  const scale = useSharedValue(1);
  const isDraggingRef = useRef(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const elementRef = useRef(element);
  elementRef.current = element;
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  const panResponder = useRef(
    PanResponder.create({
      // Don't claim on finger-down — only claim once movement detected
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_e, gs) =>
        (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5) && remainingRef.current > 0,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: (e) => {
        isDraggingRef.current = true;
        scale.value = withSpring(1.15, { stiffness: 400, damping: 20 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        startDrag(elementRef.current, 'palette', e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderMove: (e) => {
        moveDrag(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderRelease: (e) => {
        isDraggingRef.current = false;
        scale.value = withSpring(1, { stiffness: 300, damping: 20 });
        endDrag(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        scale.value = withSpring(1, { stiffness: 300, damping: 20 });
        cancelDrag();
      },
    }),
  ).current;

  const exhausted = remaining === 0;
  const png = ELEMENT_PNGS[element.toLowerCase()] ?? ELEMENT_PNGS[element] ?? null;
  const emoji = ELEMENT_EMOJIS[element.toLowerCase()] ?? element[0];
  const iconSize = itemSize * 0.62;
  const fontSize = itemSize * 0.44;
  const labelFontSize = Math.max(9, itemSize * 0.19);

  return (
    <View
      style={[styles.itemWrapper, exhausted && { opacity: 0.35 }]}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          styles.item,
          {
            width: itemSize,
            height: itemSize,
            borderColor: exhausted ? '#1a1f2e' : '#2a3550',
            borderWidth: 1.5,
          },
          animatedStyle,
        ]}
      >
        {png ? (
          <Image source={png} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />
        ) : (
          <Text style={{ fontSize }}>{emoji}</Text>
        )}

        {/* Remaining count badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{remaining}</Text>
        </View>
      </Animated.View>

      <Text style={[styles.elementLabel, { fontSize: labelFontSize }]} numberOfLines={1}>
        {element}
      </Text>
    </View>
  );
});

PaletteItem.displayName = 'PaletteItem';

const ElementPalette = memo(({ level, board }: ElementPaletteProps) => {
  const gridSize = level.size;

  const itemSize =
    gridSize <= 4 ? 76 :
    gridSize <= 5 ? 52 :
    gridSize <= 6 ? 44 : 38;

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

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {level.elements.map((el) => (
          <PaletteItem
            key={el}
            element={el}
            remaining={remaining[el] ?? 0}
            itemSize={itemSize}
          />
        ))}
      </View>
    </View>
  );
});

ElementPalette.displayName = 'ElementPalette';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(23,28,38,0.95)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242e42',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  itemWrapper: {
    alignItems: 'center',
    gap: 4,
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
    color: '#6b7a96',
    fontWeight: '500',
  },
});

export default ElementPalette;
