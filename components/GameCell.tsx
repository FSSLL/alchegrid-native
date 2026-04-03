import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ElementID } from '../lib/types';
import { ELEMENT_EMOJIS, RECIPE_EMOJIS } from '../lib/elementEmojis';

interface GameCellProps {
  row: number;
  col: number;
  element: ElementID | null;
  cellSize: number;
  isConflict: boolean;
  isHinted: boolean;
  isSelected: boolean;
  ghostElement: string | null;
  ghostOpacity: number;
  ghostGrayscale: boolean;
  onPress: (row: number, col: number) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const GameCell = memo(({
  row,
  col,
  element,
  cellSize,
  isConflict,
  isHinted,
  isSelected,
  ghostElement,
  ghostOpacity,
  ghostGrayscale,
  onPress,
}: GameCellProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.90, { stiffness: 400, damping: 25 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1.0, { stiffness: 400, damping: 25 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(row, col);
  }, [row, col, onPress]);

  const fontSize = cellSize * 0.42;
  const labelFontSize = cellSize * 0.18;

  // Cell border per spec:
  // Conflict: 7px #ee0000 + red shadow (§7.2)
  // Hinted: 2px #3aa7ff (§3.4 R21)
  // Normal: transparent
  const borderColor = isConflict
    ? '#ee0000'
    : isHinted
    ? '#3aa7ff'
    : 'transparent';

  const borderWidth = isConflict ? 7 : isHinted ? 2 : 0;

  const shadowColor = isConflict ? '#ee0000' : isHinted ? '#3aa7ff' : 'transparent';
  const shadowOpacity = isConflict ? 0.5 : isHinted ? 0.6 : 0;
  const shadowRadius = isConflict ? 5 : isHinted ? 4 : 0;

  const emoji = element
    ? (ELEMENT_EMOJIS[element.toLowerCase()] ?? element[0])
    : '';

  const ghostEmoji = ghostElement
    ? (RECIPE_EMOJIS[ghostElement.toLowerCase()] ?? ELEMENT_EMOJIS[ghostElement.toLowerCase()] ?? '✦')
    : '';

  // Cell background: subtle tint for selected zone
  const cellBg = isSelected
    ? 'rgba(255,85,0,0.12)'
    : 'transparent';

  return (
    <AnimatedTouchable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={1}
      style={[animatedStyle]}
    >
      <View
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: cellBg,
            borderColor,
            borderWidth,
            shadowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity,
            shadowRadius,
          },
        ]}
      >
        {element ? (
          <>
            <Text style={[styles.emoji, { fontSize }]}>{emoji}</Text>
            {cellSize >= 38 && (
              <Text style={[styles.label, { fontSize: labelFontSize }]} numberOfLines={1}>
                {element.length > 6 ? element.substring(0, 4) : element}
              </Text>
            )}
          </>
        ) : ghostElement ? (
          // Ghost icon: recipe product at 70% opacity (45% + grayscale for single-cell zones)
          <Text
            style={[
              styles.emoji,
              {
                fontSize,
                opacity: ghostOpacity,
                // grayscale filter not directly supported in RN; approximated via opacity
              },
            ]}
          >
            {ghostEmoji}
          </Text>
        ) : null}
      </View>
    </AnimatedTouchable>
  );
});

GameCell.displayName = 'GameCell';

const styles = StyleSheet.create({
  cell: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoji: {
    textAlign: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
});

export default GameCell;
