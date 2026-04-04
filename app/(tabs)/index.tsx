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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePlayerStore } from '../../store/playerStore';
import { WORLD_INFO, globalToWorld, LEVELS_PER_WORLD } from '../../lib/levelRegistry';
import {
  LOGO, CARD_BG, PLAY_BTN, BANNER_BG, HARDCORE_BG,
  LOGO_ASPECT, CARD_ASPECT, PLAY_BTN_ASPECT, BANNER_ASPECT, HARDCORE_ASPECT,
} from '../../constants/assets';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { progressIndex, coins, hintBalance, unlimitedHints } = usePlayerStore();
  const topPad = Platform.OS === 'web' ? 20 : insets.top;

  const nextGlobalLevel = Math.min(progressIndex + 1, 240);
  const { worldIndex, levelInWorld } = globalToWorld(nextGlobalLevel);
  const currentWorld = WORLD_INFO[Math.min(worldIndex, 7)];
  const allComplete = progressIndex >= 240;

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/game', params: { globalLevel: nextGlobalLevel.toString() } });
  };

  const BANNERS = [
    { label: 'Select World', sub: 'Browse & replay levels', route: '/worlds' },
    { label: 'Tutorial', sub: 'Learn how to play', route: '/tutorial' },
    { label: 'Endless Mode', sub: 'Adaptive difficulty, chase high scores', route: '/endless' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View style={styles.logoWrap}>
        <Image source={LOGO} style={styles.logo} />
        <Text style={styles.tagline}>Master the Elements. Conquer the Grid.</Text>
      </View>

      {/* Continue Journey card */}
      <TouchableOpacity onPress={handlePlay} activeOpacity={0.88} style={styles.cardWrap}>
        <Image source={CARD_BG} style={styles.cardBg} resizeMode="contain" />
        <View style={[StyleSheet.absoluteFill, styles.cardContent]}>
          <Text style={styles.cardDesc}>
            A strategic elemental puzzle game where{'\n'}logic, geometry, and alchemy combine.
          </Text>
          <Text style={styles.cardTitle}>
            {allComplete ? 'All Complete! 🎉' : 'Continue Journey'}
          </Text>
          <Text style={styles.cardSub}>
            {allComplete
              ? 'You have mastered all 8 worlds!'
              : `${currentWorld?.name} • Level ${levelInWorld}`}
          </Text>

          <View style={styles.badgesRow}>
            <View style={styles.coinBadge}>
              <Text style={styles.coinBadgeText}>🪙 {coins}</Text>
            </View>
            <View style={styles.hintBadge}>
              <Text style={styles.hintBadgeText}>💡 {unlimitedHints ? '∞' : hintBalance}</Text>
            </View>
          </View>

          {/* Play button */}
          <View style={styles.playBtnWrap}>
            <Image source={PLAY_BTN} style={styles.playBtnBg} resizeMode="contain" />
            <View style={[StyleSheet.absoluteFill, styles.playBtnContent]}>
              <Text style={styles.playBtnText}>▶  Play Level {levelInWorld}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Banner buttons */}
      {BANNERS.map((item) => (
        <TouchableOpacity
          key={item.route}
          onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
          activeOpacity={0.85}
          style={styles.bannerWrap}
        >
          <Image source={BANNER_BG} style={styles.bannerBg} resizeMode="contain" />
          <View style={[StyleSheet.absoluteFill, styles.bannerContent]}>
            <Text style={styles.bannerTitle}>{item.label}</Text>
            <Text style={styles.bannerSub}>{item.sub}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Hardcore button */}
      <TouchableOpacity activeOpacity={0.85} style={styles.hardcoreWrap} onPress={() => router.push('/hardcore')}>
        <Image source={HARDCORE_BG} style={styles.hardcoreBg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.halfWrap}
          activeOpacity={0.85}
          onPress={() => router.push('/catalog')}
        >
          <Image source={BANNER_BG} style={styles.bannerBg} resizeMode="contain" />
          <View style={[StyleSheet.absoluteFill, styles.bannerContent]}>
            <Text style={styles.bannerTitle}>Catalog</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.halfWrap}
          activeOpacity={0.85}
          onPress={() => router.push('/settings')}
        >
          <Image source={BANNER_BG} style={styles.bannerBg} resizeMode="contain" />
          <View style={[StyleSheet.absoluteFill, styles.bannerContent]}>
            <Text style={styles.bannerTitle}>⚙ Settings</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ height: Platform.OS === 'web' ? 20 : insets.bottom + 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { gap: 10, backgroundColor: 'transparent', paddingBottom: 64 },

  logoWrap: { alignItems: 'center', marginBottom: 4, paddingHorizontal: 16 },
  logo: { width: '70%', height: 145 },
  tagline: {
    fontSize: 12, fontWeight: '700', color: '#ff8c00',
    letterSpacing: 2.5, textAlign: 'center', marginTop: 4,
    textShadowColor: 'rgba(255,106,0,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  cardWrap: { width: '100%' },
  cardBg: { width: '100%', height: undefined, aspectRatio: CARD_ASPECT },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.75)', fontSize: 11,
    textAlign: 'center', lineHeight: 16,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  cardTitle: {
    color: '#fff', fontSize: 20, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  cardSub: {
    color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  badgesRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  coinBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)',
  },
  coinBadgeText: { color: '#fbbf24', fontSize: 13, fontWeight: '700' },
  hintBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)',
  },
  hintBadgeText: { color: '#34d399', fontSize: 13, fontWeight: '700' },

  playBtnWrap: { width: '75%', marginTop: 4 },
  playBtnBg: { width: '100%', height: undefined, aspectRatio: PLAY_BTN_ASPECT },
  playBtnContent: {
    alignItems: 'center', justifyContent: 'center', paddingTop: 8,
  },
  playBtnText: {
    color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },

  bannerWrap: { width: '100%', paddingHorizontal: 16 },
  bannerBg: { width: '100%', height: undefined, aspectRatio: BANNER_ASPECT },
  bannerContent: { alignItems: 'center', justifyContent: 'center' },
  bannerTitle: {
    color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.75)', fontSize: 10,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },

  hardcoreWrap: { width: '100%' },
  hardcoreBg: { width: '100%', height: undefined, aspectRatio: HARDCORE_ASPECT },

  bottomRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  halfWrap: { flex: 1 },
});
