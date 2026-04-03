import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WORLD_INFO, isWorldUnlocked, getWorldStars, LEVELS_PER_WORLD, STARS_TO_UNLOCK_NEXT_WORLD } from '../lib/levelRegistry';
import { usePlayerStore } from '../store/playerStore';
import { WORLD_BUTTONS, WORLD_ASPECTS } from '../constants/assets';

const WORLD_TEXT_PADDING_TOP = [20, 35, 35, 35, 35, 35, 35, 35];

export default function WorldsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 20 : insets.top;
  const { progressIndex, starsByLevel } = usePlayerStore();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select World</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {WORLD_INFO.map((world, idx) => {
          const unlocked = isWorldUnlocked(idx, progressIndex, starsByLevel);
          const stars = getWorldStars(idx, starsByLevel);
          const maxStars = LEVELS_PER_WORLD * 3;
          const completed = Math.max(0, Math.min(LEVELS_PER_WORLD, progressIndex - world.globalStart + 1));
          const prevWorldName = idx > 0 ? WORLD_INFO[idx - 1].name : '';
          const ptop = WORLD_TEXT_PADDING_TOP[idx];

          return (
            <TouchableOpacity
              key={world.id}
              onPress={() => {
                if (!unlocked) return;
                Haptics.selectionAsync();
                router.push({ pathname: '/world-levels', params: { worldNum: world.worldNumber.toString() } });
              }}
              activeOpacity={unlocked ? 0.85 : 1}
              style={[styles.worldWrap, !unlocked && styles.worldLocked]}
            >
              <Image
                source={WORLD_BUTTONS[idx]}
                style={[styles.worldBg, { aspectRatio: WORLD_ASPECTS[idx] ?? 1.85 }]}
                resizeMode="contain"
              />
              <View style={[StyleSheet.absoluteFill, styles.worldContent, { paddingTop: ptop }]}>
                <Text style={styles.worldName}>{world.name}</Text>
                <Text style={styles.worldMeta}>
                  {unlocked
                    ? `${world.size}×${world.size} Grid • ${completed}/${LEVELS_PER_WORLD} Complete`
                    : `Collect ${STARS_TO_UNLOCK_NEXT_WORLD} stars in ${prevWorldName}`}
                </Text>
                {unlocked ? (
                  <View style={styles.starsRow}>
                    <Text style={styles.starFilled}>★</Text>
                    <Text style={styles.starsText}>{stars}/{maxStars}</Text>
                  </View>
                ) : (
                  <View style={styles.starsRow}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.lockedText}>Locked</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: Platform.OS === 'web' ? 20 : insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e1117' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
  },
  backIcon: { color: '#cbd5e1', fontSize: 20, fontWeight: '700' },
  title: {
    fontSize: 28, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  scroll: { paddingHorizontal: 16, gap: 0, paddingTop: 0 },
  worldWrap: { width: '100%' },
  worldLocked: { opacity: 0.5 },
  worldBg: { width: '100%', height: undefined },
  worldContent: {
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  worldName: {
    fontSize: 24, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
    letterSpacing: 0.5,
  },
  worldMeta: {
    fontSize: 14, color: 'rgba(255,255,255,0.88)', fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  starFilled: { fontSize: 16, color: '#fbbf24' },
  starsText: { fontSize: 15, color: '#fbbf24', fontWeight: '700' },
  lockIcon: { fontSize: 15 },
  lockedText: { fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: '700' },
});
