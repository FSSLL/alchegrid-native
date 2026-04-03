import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePlayerStore } from '../../store/playerStore';
import { WORLD_INFO } from '../../lib/levelRegistry';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { progressIndex, coins, hintBalance, unlimitedHints, starsByLevel } = usePlayerStore();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const currentGlobalLevel = Math.min(progressIndex + 1, 240);
  const worldIndex = Math.floor((currentGlobalLevel - 1) / 30);
  const currentWorld = WORLD_INFO[Math.min(worldIndex, 7)];
  const levelInWorld = ((currentGlobalLevel - 1) % 30) + 1;

  const totalStars = Object.values(starsByLevel).reduce((a, b) => a + b, 0);

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/game',
      params: { globalLevel: currentGlobalLevel.toString() },
    });
  };

  const handleSelectWorld = () => {
    Haptics.selectionAsync();
    router.push('/worlds');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.appTitle}>ALCHEGRID</Text>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.coinText}>🪙 {coins}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.hintText}>💡 {unlimitedHints ? '∞' : hintBalance}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.tagline}>Elemental Latin-Square Puzzle</Text>

      {/* Continue journey card */}
      <View style={styles.continueCard}>
        <View style={styles.continueHeader}>
          <Text style={styles.continueLabel}>Continue Journey</Text>
          <Text style={styles.worldBadge}>{currentWorld?.name}</Text>
        </View>
        <Text style={styles.levelInfo}>
          Level {levelInWorld} of 30 · World {currentWorld?.worldNumber ?? 1}
        </Text>
        <Text style={styles.gridInfo}>{currentWorld?.size ?? 4}×{currentWorld?.size ?? 4} grid</Text>

        <View style={styles.elementsRow}>
          {currentWorld?.elements.slice(0, 4).map((el) => (
            <View key={el} style={styles.elementChip}>
              <Text style={styles.elementText}>{el}</Text>
            </View>
          ))}
          {(currentWorld?.elements.length ?? 0) > 4 && (
            <View style={styles.elementChip}>
              <Text style={styles.elementText}>+{(currentWorld?.elements.length ?? 0) - 4}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.playBtn} onPress={handlePlay}>
          <Text style={styles.playBtnText}>▶  Play</Text>
        </TouchableOpacity>
      </View>

      {/* Total progress */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Progress</Text>
        <View style={styles.progressStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progressIndex}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalStars}</Text>
            <Text style={styles.statLabel}>Stars</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{240 - progressIndex}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      </View>

      {/* Menu grid */}
      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuCard} onPress={handleSelectWorld}>
          <Text style={styles.menuIcon}>🌍</Text>
          <Text style={styles.menuLabel}>Select World</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/catalog')}
        >
          <Text style={styles.menuIcon}>📖</Text>
          <Text style={styles.menuLabel}>Recipe Catalog</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/tutorial')}
        >
          <Text style={styles.menuIcon}>🎓</Text>
          <Text style={styles.menuLabel}>Tutorial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Platform.OS === 'web' ? 34 : insets.bottom + 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ff6a00',
    letterSpacing: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    backgroundColor: '#171c26',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#242e42',
  },
  coinText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },
  hintText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
  },
  tagline: {
    color: '#8e9ab0',
    fontSize: 13,
    marginBottom: 20,
  },
  continueCard: {
    backgroundColor: '#171c26',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#ff6a00',
    marginBottom: 12,
    shadowColor: '#ff6a00',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  continueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  continueLabel: {
    fontSize: 12,
    color: '#8e9ab0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  worldBadge: {
    fontSize: 12,
    color: '#ff6a00',
    fontWeight: '700',
    backgroundColor: '#2a1a00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelInfo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#eef1f5',
    marginBottom: 4,
  },
  gridInfo: {
    fontSize: 13,
    color: '#8e9ab0',
    marginBottom: 12,
  },
  elementsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  elementChip: {
    backgroundColor: '#1a2030',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#242e42',
  },
  elementText: {
    color: '#8e9ab0',
    fontSize: 11,
    fontWeight: '600',
  },
  playBtn: {
    backgroundColor: '#ff6a00',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  playBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressCard: {
    backgroundColor: '#171c26',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242e42',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8e9ab0',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#eef1f5',
  },
  statLabel: {
    fontSize: 11,
    color: '#8e9ab0',
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#242e42',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  menuCard: {
    backgroundColor: '#171c26',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#242e42',
    width: '47%',
    aspectRatio: 1.4,
  },
  menuIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#eef1f5',
    textAlign: 'center',
  },
});
