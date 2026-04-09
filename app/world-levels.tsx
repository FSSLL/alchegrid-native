import React, { useState, useEffect } from 'react';
import Pressable from '../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WORLD_INFO, LEVELS_PER_WORLD, getWorldStars } from '../lib/levelRegistry';
import { usePlayerStore } from '../store/playerStore';
import WorldIntroCard from '../components/WorldIntroCard';
import { useT } from '../hooks/useT';

const WORLD_ACCENT: string[] = [
  '#22c55e', '#d97706', '#3b82f6', '#f97316',
  '#8b5cf6', '#10b981', '#ef4444', '#6366f1',
];

export default function WorldLevelsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 20 : insets.top;
  const { width: screenWidth } = useWindowDimensions();
  const { worldNum } = useLocalSearchParams<{ worldNum: string }>();
  const worldIndex = Math.max(0, Math.min(7, parseInt(worldNum ?? '1', 10) - 1));
  const world = WORLD_INFO[worldIndex];
  const { progressIndex, starsByLevel, seenWorlds, markWorldSeen } = usePlayerStore();
  const accent = WORLD_ACCENT[worldIndex];
  const t = useT();

  const isFirstVisit = !seenWorlds.includes(worldIndex);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (isFirstVisit) setShowIntro(true);
  }, [worldIndex]);

  const handleCloseIntro = () => {
    setShowIntro(false);
    markWorldSeen(worldIndex);
  };

  const COLS = 5;
  const CELL_GAP = 8;
  const GRID_H_PAD = 24; // 12 each side
  const cellWidth = (screenWidth - GRID_H_PAD - (COLS - 1) * CELL_GAP) / COLS;

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
    <View style={[styles.bg, { backgroundColor: 'transparent' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>{t('back')}</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{world.name}</Text>
          <Text style={styles.subtitle}>{t('elementsLabel', { n: world.elements.length, w: world.size, h: world.size })}</Text>
        </View>
        <Pressable onPress={() => setShowIntro(true)} style={styles.infoBtn}>
          <Text style={styles.infoIcon}>ⓘ</Text>
        </Pressable>
      </View>

      {/* Stars bar */}
      <View style={styles.starsBar}>
        <View style={[styles.starsBadge, { borderColor: accent }]}>
          <Text style={[styles.starsBadgeText, { color: accent }]}>
            {t('starsProgress', { n: totalStars, max: maxStars })}
          </Text>
        </View>
        <View style={styles.starsBarBg}>
          <View style={[styles.starsBarFill, { width: `${(totalStars / maxStars) * 100}%` as any, backgroundColor: accent }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {levels.map(({ levelInWorld, globalLevel, stars, isCompleted, isCurrent, isLocked }) => (
          <Pressable
            key={globalLevel}
            onPress={() => handleLevelPress(globalLevel, isLocked)}
            activeOpacity={isLocked ? 1 : 0.7}
            style={[styles.levelCell, { width: cellWidth }]}
          >
            <View style={[
              styles.levelBtn,
              isCompleted && styles.levelBtnCompleted,
              isCurrent && [styles.levelBtnCurrent, { borderColor: accent }],
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
                    <Text key={s} style={[styles.starIcon, { opacity: s <= stars ? 1 : 0.3 }]}>★</Text>
                  ))}
                </View>
              )}
              {isCurrent && (
                <View style={[styles.currentDot, { backgroundColor: accent }]} />
              )}
              {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
            </View>
          </Pressable>
        ))}
        <View style={{ height: Platform.OS === 'web' ? 20 : insets.bottom + 24, width: '100%' }} />
      </ScrollView>

      {showIntro && (
        <WorldIntroCard
          world={world}
          prevWorldName={worldIndex > 0 ? WORLD_INFO[worldIndex - 1]?.name : undefined}
          isFirstVisit={isFirstVisit}
          onClose={handleCloseIntro}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
    justifyContent: 'space-between',
  },
  headerRTL: { flexDirection: 'row-reverse' },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
  },
  backIcon: { color: '#94a3b8', fontSize: 20, fontWeight: '700' },
  headerCenter: { alignItems: 'center', flex: 1 },
  title: { fontSize: 20, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 12, color: '#8e9ab0', marginTop: 2 },
  infoBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
  },
  infoIcon: { color: '#94a3b8', fontSize: 18 },
  starsBar: { paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  starsBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  starsBadgeText: { fontSize: 13, fontWeight: '700' },
  starsBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' },
  starsBarFill: { height: '100%', borderRadius: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  levelCell: {},

  /* ── Level button base — opaque enough to read against the BG image ── */
  levelBtn: {
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 26, 42, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(80, 100, 140, 0.5)',
    gap: 2,
  },
  levelBtnCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.65)',
  },
  levelBtnCurrent: {
    backgroundColor: 'rgba(30, 32, 50, 0.92)',
    borderWidth: 2.5,
  },
  levelBtnLocked: {
    backgroundColor: 'rgba(12, 16, 26, 0.75)',
    borderColor: 'rgba(50, 65, 90, 0.4)',
    opacity: 0.65,
  },

  levelNum: { fontSize: 16, fontWeight: '900', color: '#eef1f5' },
  levelNumCompleted: { color: '#34d399', fontSize: 14 },
  levelNumLocked: { color: '#5a6880' },
  starsRow: { flexDirection: 'row', gap: 1 },
  starIcon: { fontSize: 9, color: '#fbbf24' },
  currentDot: { width: 6, height: 6, borderRadius: 3 },
  lockIcon: { fontSize: 12 },
});
