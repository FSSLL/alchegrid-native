import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StarProgressProps {
  elapsed: number;
  thresholds: { three: number; two: number };
}

const StarProgress = memo(({ elapsed, thresholds }: StarProgressProps) => {
  // Spec §16.3: max display = two * 1.5
  const maxDisplay = thresholds.two * 1.5;
  const pct = Math.min(elapsed / maxDisplay, 1);

  let color = '#10b981'; // green — 3-star pace
  if (elapsed > thresholds.three) color = '#f59e0b'; // amber — 2-star pace
  if (elapsed > thresholds.two) color = '#ef4444';   // red — 1-star pace

  // Tick mark positions as fractions of the bar
  const barWidth = 200; // reference width for calculations
  const threeTick = (thresholds.three / maxDisplay) * 100; // %
  const twoTick = (thresholds.two / maxDisplay) * 100;     // %

  const stars = elapsed <= thresholds.three ? 3 : elapsed <= thresholds.two ? 2 : 1;

  return (
    <View style={styles.wrapper}>
      {/* Star pace indicator */}
      <View style={styles.starsRow}>
        {[1, 2, 3].map((s) => (
          <Text key={s} style={[styles.star, { color: s <= stars ? '#fbbf24' : '#2a3550' }]}>
            ★
          </Text>
        ))}
      </View>

      {/* Progress bar with tick marks */}
      <View style={styles.container}>
        {/* Fill */}
        <View
          style={[styles.bar, { width: `${pct * 100}%`, backgroundColor: color }]}
        />
        {/* 3-star tick mark */}
        <View style={[styles.tick, { left: `${threeTick}%` }]} />
        {/* 2-star tick mark */}
        <View style={[styles.tick, { left: `${twoTick}%` }]} />
      </View>
    </View>
  );
});

StarProgress.displayName = 'StarProgress';

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 10,
  },
  container: {
    height: 6,
    backgroundColor: '#1a2235',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});

export default StarProgress;
