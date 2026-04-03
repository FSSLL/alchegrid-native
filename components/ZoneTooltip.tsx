import React, { memo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import type { Zone, ElementID } from '../lib/types';
import { ELEMENT_PNGS } from '../constants/assets';
import { ELEMENT_EMOJIS, RECIPE_EMOJIS } from '../lib/elementEmojis';
import { isZoneSatisfied } from '../lib/validators';

interface ZoneTooltipProps {
  zone: Zone | null;
  board: (ElementID | null)[][];
  activeElement: ElementID | null;
  onSelectElement: (el: ElementID | null) => void;
  onClose: () => void;
}

function getIcon(name: string) {
  return ELEMENT_PNGS[name.toLowerCase()] ?? ELEMENT_PNGS[name] ?? null;
}

function getEmoji(name: string) {
  const key = name.toLowerCase();
  return RECIPE_EMOJIS[key] ?? ELEMENT_EMOJIS[key] ?? '◈';
}

const ZoneTooltip = memo(({
  zone,
  board,
  activeElement,
  onSelectElement,
  onClose,
}: ZoneTooltipProps) => {
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

  if (!zone) return (
    <Animated.View style={[styles.container, animStyle, styles.hidden]} />
  );

  const satisfied = isZoneSatisfied(zone, board);
  const recipePng = zone.recipeName ? getIcon(zone.recipeName) : null;
  const recipeEmoji = zone.recipeName ? getEmoji(zone.recipeName) : '◈';
  const recipeName = zone.recipeName ?? 'Unknown';

  return (
    <Animated.View style={[styles.container, animStyle]}>
      {/* Recipe product */}
      <View style={styles.recipeWrap}>
        {recipePng ? (
          <Image source={recipePng} style={styles.recipeIcon} resizeMode="contain" />
        ) : (
          <Text style={styles.recipeEmoji}>{recipeEmoji}</Text>
        )}
        <Text style={[styles.recipeName, satisfied && styles.recipeNameDone]}>
          {satisfied ? '✓ ' : ''}{recipeName}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Ingredient tiles — tap to select element */}
      {zone.ingredients.map((el) => {
        const png = getIcon(el);
        const emoji = getEmoji(el);
        const isActive = activeElement === el;
        return (
          <TouchableOpacity
            key={el}
            onPress={() => onSelectElement(isActive ? null : el)}
            activeOpacity={0.7}
            style={[styles.ingredientBtn, isActive && styles.ingredientBtnActive]}
          >
            {png ? (
              <Image source={png} style={styles.ingredientIcon} resizeMode="contain" />
            ) : (
              <Text style={styles.ingredientEmoji}>{emoji}</Text>
            )}
          </TouchableOpacity>
        );
      })}

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
    color: '#10b981',
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
  ingredientBtnActive: {
    borderColor: '#ff6a00',
    backgroundColor: 'rgba(255,106,0,0.15)',
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
    // Keeps layout space but invisible and non-interactive
    opacity: 0,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
});

export default ZoneTooltip;
