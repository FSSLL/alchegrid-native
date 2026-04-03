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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WORLD_INFO, isWorldUnlocked, getWorldStars, LEVELS_PER_WORLD, STARS_TO_UNLOCK_NEXT_WORLD } from '../lib/levelRegistry';
import { usePlayerStore } from '../store/playerStore';

const WORLD_GRADIENTS: [string, string][] = [
  ['#0e2a0e', '#153815'],
  ['#1a1a0a', '#2a2610'],
  ['#0a0a1a', '#0f1530'],
  ['#1a0e0a', '#2a1810'],
  ['#0a0a20', '#12103a'],
  ['#001a10', '#002a18'],
  ['#150a0a', '#2a1010'],
  ['#050510', '#0a0a20'],
];

const WORLD_ACCENT: string[] = [
  '#22c55e', '#d97706', '#3b82f6', '#f97316',
  '#8b5cf6', '#10b981', '#ef4444', '#6366f1',
];

const WORLD_EMOJIS = ['🌿', '⚙️', '⚡', '🧪', '⚛️', '🧬', '🏛️', '🌌'];

export default function WorldsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 20 : insets.top;
  const { progressIndex, starsByLevel } = usePlayerStore();

  return (
    <LinearGradient colors={['#0e1117', '#111827', '#0e1117']} style={styles.bg}>
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
          const accent = WORLD_ACCENT[idx];

          return (
            <TouchableOpacity
              key={world.id}
              onPress={() => {
                if (!unlocked) return;
                Haptics.selectionAsync();
                router.push({ pathname: '/world-levels', params: { worldNum: world.worldNumber.toString() } });
              }}
              activeOpacity={unlocked ? 0.82 : 1}
            >
              <LinearGradient
                colors={WORLD_GRADIENTS[idx]}
                style={[styles.worldCard, !unlocked && styles.worldCardLocked]}
              >
                <View style={[styles.accentTop, { backgroundColor: accent }]} />

                <View style={styles.worldTop}>
                  <Text style={styles.worldEmoji}>{WORLD_EMOJIS[idx]}</Text>
                  <View style={styles.worldInfo}>
                    <Text style={styles.worldName}>{world.name}</Text>
                    <Text style={styles.worldMeta}>
                      {world.size}×{world.size} Grid • {world.elements.length} Elements
                    </Text>
                  </View>
                  {!unlocked && <Text style={styles.lockIcon}>🔒</Text>}
                  {unlocked && (
                    <Text style={[styles.worldNumBadge, { color: accent, borderColor: accent }]}>
                      W{world.worldNumber}
                    </Text>
                  )}
                </View>

                <View style={styles.worldBottom}>
                  <View style={styles.starsRow}>
                    <Text style={styles.starEmoji}>⭐</Text>
                    <Text style={styles.starsCount}>{stars} / {maxStars}</Text>
                    <View style={styles.starsBarBg}>
                      <View style={[styles.starsBarFill, { width: `${(stars / maxStars) * 100}%` as any, backgroundColor: accent }]} />
                    </View>
                  </View>

                  {unlocked ? (
                    <Text style={styles.progressText}>{completed}/{LEVELS_PER_WORLD} levels complete</Text>
                  ) : (
                    <Text style={styles.lockedText}>
                      Collect {STARS_TO_UNLOCK_NEXT_WORLD} stars in {prevWorldName} to unlock
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: Platform.OS === 'web' ? 20 : insets.bottom + 24 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
  },
  backIcon: { color: '#94a3b8', fontSize: 20, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '900', color: '#fff' },
  scroll: { paddingHorizontal: 16, gap: 10 },
  worldCard: {
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#222d3d', overflow: 'hidden',
  },
  worldCardLocked: { opacity: 0.5 },
  accentTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 2.5 },
  worldTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  worldEmoji: { fontSize: 30 },
  worldInfo: { flex: 1 },
  worldName: {
    fontSize: 19, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  worldMeta: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2 },
  lockIcon: { fontSize: 20 },
  worldNumBadge: {
    fontSize: 11, fontWeight: '900', borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  worldBottom: { gap: 5 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starEmoji: { fontSize: 13 },
  starsCount: { fontSize: 13, fontWeight: '700', color: '#fbbf24', minWidth: 56 },
  starsBarBg: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  starsBarFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  lockedText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' },
});
