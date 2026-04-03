import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePlayerStore } from '../store/playerStore';
import { WORLD_INFO } from '../lib/levelRegistry';

export default function WorldLevelsScreen() {
  const insets = useSafeAreaInsets();
  const { worldNumber } = useLocalSearchParams<{ worldNumber: string }>();
  const worldNum = parseInt(worldNumber ?? '1', 10);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { progressIndex, starsByLevel } = usePlayerStore();
  const world = WORLD_INFO[worldNum - 1];
  if (!world) return null;

  const levels = Array.from({ length: 30 }, (_, i) => world.globalStart + i);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.worldTitle}>{world.name}</Text>
          <Text style={styles.worldSub}>{world.size}×{world.size} · 30 levels</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {levels.map((globalLevel) => {
          const isCompleted = progressIndex >= globalLevel;
          const isNext = globalLevel === progressIndex + 1 || (progressIndex === 0 && globalLevel === 1);
          const isLocked = globalLevel > progressIndex + 1 && !(globalLevel === 1);
          const stars = starsByLevel[globalLevel] ?? 0;
          const levelInWorld = globalLevel - world.globalStart + 1;

          return (
            <TouchableOpacity
              key={globalLevel}
              disabled={isLocked}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/game',
                  params: { globalLevel: globalLevel.toString() },
                });
              }}
              style={[
                styles.levelBtn,
                isCompleted && styles.completedBtn,
                isNext && styles.nextBtn,
                isLocked && styles.lockedBtn,
              ]}
            >
              <Text style={[styles.levelNum, isLocked && styles.lockedText]}>
                {levelInWorld}
              </Text>
              {isCompleted && (
                <Text style={styles.starRow}>
                  {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
                </Text>
              )}
              {isLocked && <Text style={{ fontSize: 12 }}>🔒</Text>}
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
  worldTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#eef1f5',
    textAlign: 'center',
  },
  worldSub: {
    fontSize: 12,
    color: '#8e9ab0',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
    justifyContent: 'flex-start',
  },
  levelBtn: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#171c26',
    borderWidth: 1,
    borderColor: '#242e42',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  completedBtn: {
    borderColor: '#10b981',
    backgroundColor: '#0d2018',
  },
  nextBtn: {
    borderColor: '#ff6a00',
    backgroundColor: '#2a1500',
  },
  lockedBtn: {
    opacity: 0.4,
  },
  levelNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#eef1f5',
  },
  lockedText: {
    color: '#8e9ab0',
  },
  starRow: {
    fontSize: 9,
  },
});
