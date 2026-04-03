import React, { memo, useCallback, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ElementID } from '../lib/types';
import { ELEMENT_EMOJIS, RECIPE_EMOJIS } from '../lib/elementEmojis';
import { ELEMENT_PNGS } from '../constants/assets';
import { useDrag } from '../contexts/DragContext';

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

function getElementSource(name: string) {
  return ELEMENT_PNGS[name.toLowerCase()] ?? ELEMENT_PNGS[name] ?? null;
}

function getGhostSource(recipeName: string) {
  const key = recipeName.toLowerCase();
  return ELEMENT_PNGS[key] ?? ELEMENT_PNGS[recipeName] ?? null;
}

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

  // Refs so PanResponder callbacks always see current values
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
      // Only steal the gesture once element is present and finger has moved
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

  const iconSize = cellSize * 0.62;
  const fontSize = cellSize * 0.42;
  const labelFontSize = cellSize * 0.18;

  const borderColor = isConflict
    ? '#ee0000'
    : isHinted
    ? '#3aa7ff'
    : 'transparent';

  const borderWidth = isConflict ? 7 : isHinted ? 2 : 0;
  const shadowColor = isConflict ? '#ee0000' : isHinted ? '#3aa7ff' : 'transparent';
  const shadowOpacity = isConflict ? 0.5 : isHinted ? 0.6 : 0;
  const shadowRadius = isConflict ? 5 : isHinted ? 4 : 0;
  const cellBg = isSelected ? 'rgba(255,85,0,0.12)' : 'transparent';

  const elementPng = element ? getElementSource(element) : null;
  const elementEmoji = element
    ? (ELEMENT_EMOJIS[element.toLowerCase()] ?? element[0])
    : '';

  const ghostPng = ghostElement ? getGhostSource(ghostElement) : null;
  const ghostEmoji = ghostElement
    ? (RECIPE_EMOJIS[ghostElement.toLowerCase()] ?? ELEMENT_EMOJIS[ghostElement.toLowerCase()] ?? '✦')
    : '';

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
          elementPng ? (
            <>
              <Image
                source={elementPng}
                style={{ width: iconSize, height: iconSize }}
                resizeMode="contain"
              />
              {cellSize >= 38 && (
                <Text style={[styles.label, { fontSize: labelFontSize }]} numberOfLines={1}>
                  {element.length > 6 ? element.substring(0, 4) : element}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.emoji, { fontSize }]}>{elementEmoji}</Text>
              {cellSize >= 38 && (
                <Text style={[styles.label, { fontSize: labelFontSize }]} numberOfLines={1}>
                  {element.length > 6 ? element.substring(0, 4) : element}
                </Text>
              )}
            </>
          )
        ) : ghostElement ? (
          ghostPng ? (
            <Image
              source={ghostPng}
              style={{ width: iconSize, height: iconSize, opacity: ghostOpacity }}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.emoji, { fontSize, opacity: ghostOpacity }]}>
              {ghostEmoji}
            </Text>
          )
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
