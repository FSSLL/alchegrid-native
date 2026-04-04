import React, { memo, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ElementID } from '../lib/types';
import { useDrag } from '../contexts/DragContext';
import ElementIcon from './ElementIcon';

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
  onPress,
}: GameCellProps) => {
  const { startDrag, moveDrag, endDrag, cancelDrag } = useDrag();
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

  const elementRef = useRef(element);
  elementRef.current = element;
  const rowRef = useRef(row);
  rowRef.current = row;
  const colRef = useRef(col);
  colRef.current = col;
  const isHintedRef = useRef(isHinted);
  isHintedRef.current = isHinted;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_e, gs) =>
        !!elementRef.current &&
        !isHintedRef.current &&
        (Math.abs(gs.dx) > 6 || Math.abs(gs.dy) > 6),
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: (e) => {
        if (!elementRef.current || isHintedRef.current) return;
        scale.value = withSpring(0.88, { stiffness: 400, damping: 20 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        startDrag(
          elementRef.current,
          'cell',
          e.nativeEvent.pageX,
          e.nativeEvent.pageY,
          rowRef.current,
          colRef.current,
        );
      },
      onPanResponderMove: (e) => {
        moveDrag(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderRelease: (e) => {
        scale.value = withSpring(1.0, { stiffness: 400, damping: 25 });
        endDrag(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderTerminate: () => {
        scale.value = withSpring(1.0, { stiffness: 400, damping: 25 });
        cancelDrag();
      },
    }),
  ).current;

  const iconSize = cellSize * 0.80;
  const labelFontSize = cellSize * 0.18;
  const showLabel = cellSize >= 38;

  const borderColor = isConflict ? '#ee0000' : isHinted ? '#3aa7ff' : 'transparent';
  const borderWidth = isConflict ? 7 : isHinted ? 2 : 0;
  const shadowColor = isConflict ? '#ee0000' : isHinted ? '#3aa7ff' : 'transparent';
  const shadowOpacity = isConflict ? 0.5 : isHinted ? 0.6 : 0;
  const shadowRadius = isConflict ? 5 : isHinted ? 4 : 0;
  const cellBg = isSelected ? 'rgba(255,85,0,0.12)' : 'transparent';

  return (
    <AnimatedTouchable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={1}
      style={[animatedStyle]}
      {...panResponder.panHandlers}
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
          <ElementIcon
            name={element}
            size={iconSize}
            showLabel={showLabel}
            labelFontSize={labelFontSize}
          />
        ) : ghostElement ? (
          <ElementIcon
            name={ghostElement}
            size={iconSize}
            showLabel={false}
            opacity={ghostOpacity}
          />
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
});

export default GameCell;
