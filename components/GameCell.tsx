import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ElementID } from '../lib/types';
import colors from '../constants/colors';
import { ELEMENT_EMOJIS } from '../lib/elementEmojis';

interface GameCellProps {
  row: number;
  col: number;
  element: ElementID | null;
  cellSize: number;
  isConflict: boolean;
  isHinted: boolean;
  isSelected: boolean;
  zoneIndex: number;
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
  zoneIndex,
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

  const fontSize = cellSize * 0.28;
  const badgeFontSize = 7;

  const zoneTint = colors.zoneTints[zoneIndex % colors.zoneTints.length];

  const borderColor = isConflict
    ? '#ee0000'
    : isHinted
    ? '#3aa7ff'
    : isSelected
    ? '#ff5500'
    : '#242e42';

  const borderWidth = isConflict ? 2.5 : isHinted ? 2 : isSelected ? 2 : 1;

  const emoji = element ? (ELEMENT_EMOJIS[element.toLowerCase()] ?? element[0]) : '';

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
            backgroundColor: element
              ? `${zoneTint}40`
              : '#1a2030',
            borderColor,
            borderWidth,
            shadowColor: isConflict ? '#ee0000' : 'transparent',
            shadowOpacity: isConflict ? 0.6 : 0,
            shadowRadius: isConflict ? 6 : 0,
          },
        ]}
      >
        {element ? (
          <>
            <Text style={[styles.emoji, { fontSize }]}>{emoji}</Text>
            {cellSize >= 38 && (
              <Text
                style={[styles.label, { fontSize: cellSize * 0.18 }]}
                numberOfLines={1}
              >
                {element.length > 6 ? element.substring(0, 4) : element}
              </Text>
            )}
          </>
        ) : null}
      </View>
    </AnimatedTouchable>
  );
});

GameCell.displayName = 'GameCell';

const styles = StyleSheet.create({
  cell: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoji: {
    textAlign: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
});

export default GameCell;
