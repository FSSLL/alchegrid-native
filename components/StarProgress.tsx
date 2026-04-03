import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

interface StarProgressProps {
  elapsed: number;
  thresholds: { three: number; two: number };
}

const StarProgress = memo(({ elapsed, thresholds }: StarProgressProps) => {
  const max = thresholds.two * 1.2;
  const pct = Math.min(elapsed / max, 1);

  let color = '#10b981'; // 3-star pace
  if (elapsed > thresholds.three) color = '#f59e0b';
  if (elapsed > thresholds.two) color = '#ef4444';

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
});

StarProgress.displayName = 'StarProgress';

const styles = StyleSheet.create({
  container: {
    height: 6,
    backgroundColor: '#242e42',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
});

export default StarProgress;
