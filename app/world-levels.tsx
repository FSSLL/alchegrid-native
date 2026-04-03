import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WORLD_INFO, LEVELS_PER_WORLD, getWorldStars } from '../lib/levelRegistry';
import { usePlayerStore } from '../store/playerStore';

const WORLD_ACCENT: string[] = [
  '#22c55e', '#d97706', '#3b82f6', '#f97316',
  '#8b5cf6', '#10b981', '#ef4444', '#6366f1',
];

export default function WorldLevelsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 20 : insets.top;
  const { worldNum } = useLocalSearchParams<{ worldNum: string }>();
  const worldIndex = Math.max(0, Math.min(7, parseInt(worldNum ?? '1', 10) - 1));
  const world = WORLD_INFO[worldIndex];
  const { progressIndex, starsByLevel } = usePlayerStore();
  const accent = WORLD_ACCENT[worldIndex];

  const totalStars = getWorldStars(worldIndex, starsByLevel);
  const maxStars = LEVELS_PER_WORLD * 3;

  const levels = Array.from({ length: LEVELS_PER_WORLD }, (_, i) => {
    const levelInWorld = i + 1;
    const globalLevel = world.globalStart + i;
    const stars = starsByLevel[globalLevel] ?? 0;
    const isCompleted = progressIndex >= globalLevel;
    const isCurrent = progressIndex + 1 === globalLevel;
    const isLocked = !isCompleted && !isCurrent;
    return { levelInWorld, globalLevel, stars, isCompleted, isCurrent, isLocked };
  });

  const handleLevelPress = (globalLevel: number, isLocked: boolean) => {
    if (isLocked) return;
    Haptics.selectionAsync();
    router.push({ pathname: '/game', params: { globalLevel: globalLevel.toString() } });
  };

  return (
    <LinearGradient colors={['#0e1117', '#111827', '#0e1117']} style={styles.bg}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{world.name}</Text>
          <Text style={styles.subtitle}>{world.size}×{world.size} Grid • {world.elements.length} Elements</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stars bar */}
      <View style={styles.starsBar}>
        <View style={[styles.starsBadge, { borderColor: accent }]}>
          <Text style={[styles.starsBadgeText, { color: accent }]}>
            ⭐ {totalStars} / {maxStars} Stars
          </Text>
        </View>
        <View style={styles.starsBarBg}>
          <View style={[styles.starsBarFill, { width: `${(totalStars / maxStars) * 100}%` as any, backgroundColor: accent }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {levels.map(({ levelInWorld, globalLevel, stars, isCompleted, isCurrent, isLocked }) => (
          <TouchableOpacity
            key={globalLevel}
            onPress={() => handleLevelPress(globalLevel, isLocked)}
            activeOpacity={isLocked ? 1 : 0.75}
            style={styles.levelCell}
          >
            <View style={[
              styles.levelBtn,
              isCompleted && styles.levelBtnCompleted,
              isCurrent && { borderColor: accent, borderWidth: 2.5 },
              isLocked && styles.levelBtnLocked,
            ]}>
              <Text style={[
                styles.levelNum,
                isCompleted && styles.levelNumCompleted,
                isCurrent && { color: accent },
                isLocked && styles.levelNumLocked,
              ]}>
                {levelInWorld}
              </Text>
              {isCompleted && (
                <View style={styles.starsRow}>
                  {[1, 2, 3].map((s) => (
                    <Text key={s} style={[styles.starIcon, { opacity: s <= stars ? 1 : 0.25 }]}>★</Text>
                  ))}
                </View>
              )}
              {isCurrent && (
                <View style={[styles.currentDot, { backgroundColor: accent }]} />
              )}
              {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: Platform.OS === 'web' ? 20 : insets.bottom + 24, width: '100%' }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
  },
  backIcon: { color: '#94a3b8', fontSize: 20, fontWeight: '700' },
  headerCenter: { alignItems: 'center', flex: 1 },
  title: { fontSize: 20, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 12, color: '#8e9ab0', marginTop: 2 },
  starsBar: { paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  starsBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  starsBadgeText: { fontSize: 13, fontWeight: '700' },
  starsBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  starsBarFill: { height: '100%', borderRadius: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  levelCell: { width: '18%' },
  levelBtn: {
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171c26',
    borderWidth: 1.5,
    borderColor: '#222d3d',
    gap: 2,
  },
  levelBtnCompleted: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.4)',
  },
  levelBtnLocked: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: '#1a2030',
    opacity: 0.5,
  },
  levelNum: { fontSize: 16, fontWeight: '900', color: '#eef1f5' },
  levelNumCompleted: { color: '#34d399', fontSize: 14 },
  levelNumLocked: { color: '#4a5568' },
  starsRow: { flexDirection: 'row', gap: 1 },
  starIcon: { fontSize: 9, color: '#fbbf24' },
  currentDot: { width: 6, height: 6, borderRadius: 3 },
  lockIcon: { fontSize: 12 },
});
