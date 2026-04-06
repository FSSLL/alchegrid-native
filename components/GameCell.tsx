import React, { memo, useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ElementID } from '../lib/types';
import { useDrag } from '../contexts/DragContext';
import ElementIcon from './ElementIcon';
import { tap } from '../lib/feedback';

interface GameCellProps {
  row: number;
  col: number;
  element: ElementID | null;
  cellSize: number;
  isConflict: boolean;
  isHinted: boolean;
  ghostElement: string | null;
  ghostOpacity: number;
  onPress: (row: number, col: number) => void;
}

const TAP_THRESHOLD = 6;

const GameCell = memo(({
  row,
  col,
  element,
  cellSize,
  isConflict,
  isHinted,
  ghostElement,
  ghostOpacity,
  onPress,
}: GameCellProps) => {
  const { startDrag, moveDrag, endDrag, cancelDrag } = useDrag();
  const scale = useSharedValue(1);
  const isDragging = useRef(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const elementRef = useRef(element);
  elementRef.current = element;
  const rowRef = useRef(row);
  rowRef.current = row;
  const colRef = useRef(col);
  colRef.current = col;
  const isHintedRef = useRef(isHinted);
  isHintedRef.current = isHinted;
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => false,

      onPanResponderGrant: () => {
        isDragging.current = false;
        scale.value = withSpring(0.90, { stiffness: 400, damping: 25 });
      },

      onPanResponderMove: (e, gs) => {
        const moved = Math.abs(gs.dx) + Math.abs(gs.dy);

        if (!isDragging.current && moved > TAP_THRESHOLD && elementRef.current && !isHintedRef.current) {
          isDragging.current = true;
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
        }

        if (isDragging.current) {
          moveDrag(e.nativeEvent.pageX, e.nativeEvent.pageY);
        }
      },

      onPanResponderRelease: (e) => {
        scale.value = withSpring(1.0, { stiffness: 400, damping: 25 });
        if (isDragging.current) {
          isDragging.current = false;
          endDrag(e.nativeEvent.pageX, e.nativeEvent.pageY);
        } else {
          tap();
          onPressRef.current(rowRef.current, colRef.current);
        }
      },

      onPanResponderTerminate: () => {
        scale.value = withSpring(1.0, { stiffness: 400, damping: 25 });
        if (isDragging.current) {
          isDragging.current = false;
          cancelDrag();
        }
      },
    }),
  ).current;

  const iconSize = cellSize * 0.96;
  const labelFontSize = cellSize * 0.18;
  const showLabel = false;

  const borderColor = isConflict ? '#ee0000' : isHinted ? '#3aa7ff' : 'transparent';
  const borderWidth = isConflict ? 7 : isHinted ? 2 : 0;
  const shadowColor = isConflict ? '#ee0000' : isHinted ? '#3aa7ff' : 'transparent';
  const shadowOpacity = isConflict ? 0.5 : isHinted ? 0.6 : 0;
  const shadowRadius = isConflict ? 5 : isHinted ? 4 : 0;

  return (
    <Animated.View style={animatedStyle} {...panResponder.panHandlers}>
      <View
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
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
    </Animated.View>
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
