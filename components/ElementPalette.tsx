import React, { memo, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
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
  const { startDrag, moveDrag, endDrag, cancelDrag } = useDrag();
  const scale = useSharedValue(1);
  const isDraggingRef = useRef(false);

  React.useEffect(() => {
    if (!isDraggingRef.current) {
      scale.value = withSpring(isActive ? 1.08 : 1, { stiffness: 300, damping: 20 });
    }
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // PanResponder: drag-and-drop. Tap is handled by the TouchableOpacity wrapper.
  const elementRef = useRef(element);
  elementRef.current = element;
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  const panResponder = useRef(
    PanResponder.create({
      // Don't claim on start — let tap fall through to TouchableOpacity
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Claim when significant movement detected
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
        scale.value = withSpring(isActive ? 1.08 : 1, { stiffness: 300, damping: 20 });
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
  const labelFontSize = itemSize * 0.19;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={exhausted}
      style={styles.itemWrapper}
      {...panResponder.panHandlers}
    >
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
            borderColor: isActive ? '#ff6a00' : exhausted ? '#1a1f2e' : '#2a3550',
            borderWidth: isActive ? 2.5 : 1,
            opacity: exhausted ? 0.4 : 1,
          },
          animatedStyle,
        ]}
      >
        {png ? (
          <Image source={png} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />
        ) : (
          <Text style={{ fontSize }}>{emoji}</Text>
        )}

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{remaining}</Text>
        </View>
      </Animated.View>

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

  const itemSize =
    gridSize <= 4 ? 80 :
    gridSize <= 5 ? 52 :
    gridSize <= 6 ? 44 : 38;

  const gap =
    gridSize <= 4 ? 16 :
    gridSize <= 5 ? 12 : 8;

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
    [activeElement, onSelectElement],
  );

  return (
    <View style={styles.container}>
      {/* space-evenly keeps all items in a single row regardless of padding */}
      <View style={styles.row}>
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
