import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Zone, ElementID } from '../lib/types';
import { isZoneSatisfied } from '../lib/validators';
import { useDrag } from '../contexts/DragContext';
import ElementIcon from './ElementIcon';

interface ZoneTooltipProps {
  zone: Zone | null;
  board: (ElementID | null)[][];
  onClose: () => void;
}

// ─── Draggable ingredient chip (drag-only, no tap-to-select) ──────────────────
interface IngredientChipProps {
  element: ElementID;
}

const IngredientChip = memo(({ element }: IngredientChipProps) => {
  const { startDrag, moveDrag, endDrag, cancelDrag } = useDrag();
  const elementRef = useRef(element);
  elementRef.current = element;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_e, gs) =>
        Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: (e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        startDrag(elementRef.current, 'palette', e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderMove: (e) => {
        moveDrag(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderRelease: (e) => {
        endDrag(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderTerminate: () => {
        cancelDrag();
      },
    }),
  ).current;

  return (
    <View style={styles.ingredientBtn} {...panResponder.panHandlers}>
      <ElementIcon name={element} size={22} showLabel={false} />
    </View>
  );
});

IngredientChip.displayName = 'IngredientChip';

// ─── Main tooltip ─────────────────────────────────────────────────────────────
const ZoneTooltip = memo(({ zone, board, onClose }: ZoneTooltipProps) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (zone) {
      opacity.value = withTiming(1, { duration: 160 });
      translateY.value = withSpring(0, { stiffness: 400, damping: 28 });
      scale.value = withSpring(1, { stiffness: 400, damping: 28 });
    } else {
      opacity.value = withTiming(0, { duration: 120 });
      translateY.value = withTiming(6, { duration: 120 });
      scale.value = withTiming(0.97, { duration: 120 });
    }
  }, [zone]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!zone) {
    return <Animated.View style={[styles.container, animStyle, styles.hidden]} />;
  }

  const satisfied = isZoneSatisfied(zone, board);
  const recipeName = zone.recipeName ?? 'Unknown';

  return (
    <Animated.View style={[styles.container, animStyle]}>
      {/* Recipe product */}
      <View style={styles.recipeWrap}>
        <ElementIcon name={recipeName} size={28} showLabel={false} />
        <Text style={[styles.recipeName, satisfied && styles.recipeNameDone]}>
          {satisfied ? '✓ ' : ''}{recipeName}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Ingredient chips — drag from here onto the grid */}
      {zone.ingredients.map((el) => (
        <IngredientChip key={el} element={el} />
      ))}

      {/* Close */}
      <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

ZoneTooltip.displayName = 'ZoneTooltip';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,22,34,0.96)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242e42',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    minHeight: 44,
  },
  recipeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recipeIcon: {
    width: 28,
    height: 28,
  },
  recipeEmoji: {
    fontSize: 22,
  },
  recipeName: {
    color: '#eef1f5',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 80,
  },
  recipeNameDone: {
    color: '#FFD700',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#2a3550',
    marginHorizontal: 2,
  },
  ingredientBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1a2035',
    borderWidth: 1.5,
    borderColor: '#2a3550',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientIcon: {
    width: 22,
    height: 22,
  },
  ingredientEmoji: {
    fontSize: 18,
  },
  closeBtn: {
    marginLeft: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a2035',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#6b7a96',
    fontSize: 11,
    fontWeight: '700',
  },
  hidden: {
    opacity: 0,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
});

export default ZoneTooltip;
