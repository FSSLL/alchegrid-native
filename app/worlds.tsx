import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePlayerStore } from '../store/playerStore';
import { WORLD_INFO, isWorldUnlocked } from '../lib/levelRegistry';
import colors from '../constants/colors';

const WORLD_GRADIENTS = [
  ['#1a3a1a', '#0a2010'],
  ['#2a1a0a', '#1a0f00'],
  ['#1a1a2a', '#0a0a1a'],
  ['#2a1a2a', '#1a0a1a'],
  ['#0a1a2a', '#050a15'],
  ['#1a2a1a', '#0a150a'],
  ['#2a2010', '#1a1508'],
  ['#0a0a1a', '#050510'],
];

const WORLD_ICONS = ['🌿', '⚙️', '⚡', '🧪', '⚛️', '🔬', '🏛️', '🌌'];

export default function WorldsScreen() {
  const insets = useSafeAreaInsets();
  const { progressIndex, starsByLevel } = usePlayerStore();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const getWorldStars = (globalStart: number, globalEnd: number) => {
    let total = 0;
    for (let i = globalStart; i <= globalEnd; i++) {
      total += starsByLevel[i] ?? 0;
    }
    return total;
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select World</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {WORLD_INFO.map((world, i) => {
          const unlocked = isWorldUnlocked(world.worldNumber, progressIndex);
          const totalStars = getWorldStars(world.globalStart, world.globalEnd);
          const maxStars = 30 * 3;
          const levelsCompleted = Math.min(
            progressIndex - world.globalStart + 1,
            30
          );
          const displayCompleted = unlocked ? Math.max(0, levelsCompleted) : 0;

          return (
            <TouchableOpacity
              key={world.id}
              activeOpacity={0.75}
              disabled={!unlocked}
              onPress={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: '/world-levels',
                  params: { worldNumber: world.worldNumber.toString() },
                });
              }}
            >
              <View style={[styles.worldCard, { opacity: unlocked ? 1 : 0.5 }]}>
                <View style={styles.cardLeft}>
                  <Text style={styles.worldIcon}>{WORLD_ICONS[i]}</Text>
                  <View>
                    <Text style={styles.worldNum}>World {world.worldNumber}</Text>
                    <Text style={styles.worldName}>{world.name}</Text>
                    <Text style={styles.worldGrid}>{world.size}×{world.size} grid</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {unlocked ? (
                    <>
                      <Text style={styles.starsText}>
                        ⭐ {totalStars}/{maxStars}
                      </Text>
                      <Text style={styles.progressText}>
                        {displayCompleted}/30 levels
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.lockedText}>🔒</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171c26',
    borderRadius: 10,
  },
  backIcon: {
    color: '#eef1f5',
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#eef1f5',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  worldCard: {
    backgroundColor: '#171c26',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#242e42',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  worldIcon: {
    fontSize: 32,
  },
  worldNum: {
    fontSize: 12,
    color: '#8e9ab0',
    fontWeight: '600',
  },
  worldName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#eef1f5',
    marginTop: 2,
  },
  worldGrid: {
    fontSize: 11,
    color: '#8e9ab0',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  starsText: {
    fontSize: 13,
    color: '#fbbf24',
    fontWeight: '700',
  },
  progressText: {
    fontSize: 11,
    color: '#8e9ab0',
  },
  lockedText: {
    fontSize: 24,
  },
});
