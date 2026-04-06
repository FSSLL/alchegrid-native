import React, { memo, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  PanResponder,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { Level, ElementID } from '../lib/types';
import { useDrag } from '../contexts/DragContext';
import ElementIcon from './ElementIcon';
import { tap } from '../lib/feedback';

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
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_e, gs) =>
        remainingRef.current > 0 &&
        Math.abs(gs.dy) > 8 &&
        Math.abs(gs.dy) > Math.abs(gs.dx),
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: (e) => {
        isDraggingRef.current = true;
        scale.value = withSpring(1.15, { stiffness: 400, damping: 20 });
        tap();
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
  const iconSize = itemSize * 0.76;
  const labelFontSize = Math.max(8, itemSize * 0.19);

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
        <ElementIcon name={element} size={iconSize} showLabel={false} />
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
  const { isDragging } = useDrag();

  const itemSize =
    gridSize <= 4 ? 72 :
    gridSize <= 5 ? 62 :
    gridSize <= 6 ? 56 : 52;

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

  // Available elements first, exhausted ones last (stable relative order preserved)
  const sortedElements = useMemo(
    () =>
      [...level.elements].sort((a, b) => {
        const aEx = (remaining[a] ?? 0) === 0 ? 1 : 0;
        const bEx = (remaining[b] ?? 0) === 0 ? 1 : 0;
        return aEx - bEx;
      }),
    [level.elements, remaining],
  );

  const useScrollRow = gridSize > 5;

  const items = sortedElements.map((el) => (
    <PaletteItem
      key={el}
      element={el}
      remaining={remaining[el] ?? 0}
      itemSize={itemSize}
    />
  ));

  return (
    <View style={styles.container}>
      {useScrollRow ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!isDragging}
          contentContainerStyle={styles.scrollRow}
        >
          {items}
        </ScrollView>
      ) : (
        <View style={styles.row}>{items}</View>
      )}
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
  scrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 10,
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
