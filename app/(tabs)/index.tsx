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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePlayerStore } from '../../store/playerStore';
import { WORLD_INFO, globalToWorld, LEVELS_PER_WORLD, getWorldStars } from '../../lib/levelRegistry';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { progressIndex, coins, hintBalance, unlimitedHints, starsByLevel } = usePlayerStore();
  const topPad = Platform.OS === 'web' ? 20 : insets.top;

  const nextGlobalLevel = Math.min(progressIndex + 1, 240);
  const { worldIndex, levelInWorld } = globalToWorld(nextGlobalLevel);
  const currentWorld = WORLD_INFO[Math.min(worldIndex, 7)];
  const allComplete = progressIndex >= 240;

  const totalStars = Object.values(starsByLevel).reduce((a, b) => a + b, 0);

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/game', params: { globalLevel: nextGlobalLevel.toString() } });
  };

  const BANNER_ITEMS = [
    { label: 'Select World', sub: 'Browse & replay levels', route: '/worlds' },
    { label: 'Tutorial', sub: 'Learn how to play', route: '/tutorial' },
    { label: 'Recipe Catalog', sub: 'Discover all combinations', route: '/catalog' },
    { label: 'Settings', sub: 'Codes, preferences & more', route: '/settings' },
  ];

  return (
    <LinearGradient colors={['#0e1117', '#111827', '#0e1117']} style={styles.bg}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>ALCHEGRID</Text>
          <Text style={styles.tagline}>Master the Elements. Conquer the Grid.</Text>
        </View>

        {/* Coins + hints row */}
        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🪙 {coins}</Text>
          </View>
          <View style={[styles.badge, styles.hintBadge]}>
            <Text style={styles.hintBadgeText}>💡 {unlimitedHints ? '∞' : hintBalance}</Text>
          </View>
          <View style={[styles.badge, { flex: 1, justifyContent: 'center' }]}>
            <Text style={styles.starsBadgeText}>⭐ {totalStars} stars collected</Text>
          </View>
        </View>

        {/* Continue Journey card */}
        <TouchableOpacity onPress={handlePlay} activeOpacity={0.88}>
          <LinearGradient
            colors={['#1a1200', '#261900', '#1a1200']}
            style={styles.journeyCard}
          >
            <LinearGradient
              colors={['#ff6a00', '#e05500']}
              style={styles.journeyCardBorder}
            />
            <Text style={styles.journeySubLabel}>A strategic elemental puzzle game where logic, geometry, and alchemy combine.</Text>
            <Text style={styles.journeyTitle}>{allComplete ? 'All Complete! 🎉' : 'Continue Journey'}</Text>
            <Text style={styles.journeyLevel}>
              {allComplete
                ? 'You have mastered all 8 worlds!'
                : `${currentWorld?.name} • Level ${levelInWorld}`}
            </Text>

            <View style={styles.elementsRow}>
              {currentWorld?.elements.slice(0, 5).map((el) => (
                <View key={el} style={styles.elementChip}>
                  <Text style={styles.elementText}>{el}</Text>
                </View>
              ))}
              {(currentWorld?.elements.length ?? 0) > 5 && (
                <View style={styles.elementChip}>
                  <Text style={styles.elementText}>+{(currentWorld?.elements.length ?? 0) - 5}</Text>
                </View>
              )}
            </View>

            <LinearGradient
              colors={['#ff6a00', '#ff8c00']}
              style={styles.playBtn}
            >
              <Text style={styles.playBtnText}>▶  Play Level {levelInWorld}</Text>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>

        {/* Banner buttons */}
        {BANNER_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
            activeOpacity={0.82}
          >
            <LinearGradient
              colors={['#171c26', '#1e2535']}
              style={styles.bannerBtn}
            >
              <View style={styles.bannerBtnInner}>
                <Text style={styles.bannerTitle}>{item.label}</Text>
                <Text style={styles.bannerSub}>{item.sub}</Text>
              </View>
              <Text style={styles.bannerArrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        <View style={{ height: Platform.OS === 'web' ? 20 : insets.bottom + 24 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 10 },
  logoArea: { alignItems: 'center', marginBottom: 6 },
  logoText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ff6a00',
    letterSpacing: 8,
    textShadowColor: 'rgba(255,106,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 12,
    color: '#ff8c30',
    letterSpacing: 1,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  badgesRow: { flexDirection: 'row', gap: 8 },
  badge: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  badgeText: { color: '#fbbf24', fontSize: 13, fontWeight: '700' },
  hintBadge: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderColor: 'rgba(52,211,153,0.25)',
  },
  hintBadgeText: { color: '#34d399', fontSize: 13, fontWeight: '700' },
  starsBadgeText: { color: '#eef1f5', fontSize: 12, fontWeight: '600' },
  journeyCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#ff6a00',
    overflow: 'hidden',
    shadowColor: '#ff6a00',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    gap: 8,
  },
  journeyCardBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 2,
    borderRadius: 0,
  },
  journeySubLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 16,
  },
  journeyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  journeyLevel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  elementsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  elementChip: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  elementText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600' },
  playBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#ff6a00',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  playBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  bannerBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#222d3d',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerBtnInner: { flex: 1 },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#eef1f5',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  bannerArrow: { fontSize: 22, color: '#8e9ab0', fontWeight: '300' },
});
