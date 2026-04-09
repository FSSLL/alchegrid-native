import React from 'react';
import Pressable from '../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WORLD_INFO, isWorldUnlocked, getWorldStars, LEVELS_PER_WORLD, STARS_TO_UNLOCK_NEXT_WORLD } from '../lib/levelRegistry';
import { usePlayerStore } from '../store/playerStore';
import { WORLD_BUTTONS, WORLD_ASPECTS } from '../constants/assets';
import { useT, useIsRTL } from '../hooks/useT';

const WORLD_TEXT_PADDING_TOP = [20, 35, 35, 35, 35, 35, 35, 35];

export default function WorldsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 20 : insets.top;
  const { progressIndex, starsByLevel } = usePlayerStore();
  const t = useT();
  const isRTL = useIsRTL();

  return (
    <View style={styles.container}>
      <View style={[styles.header, isRTL && styles.headerRTL, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>{t('back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('selectWorld')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {WORLD_INFO.map((world, idx) => {
          const isComingSoon = idx >= 4;
          const unlocked = !isComingSoon && isWorldUnlocked(idx, progressIndex, starsByLevel);
          const stars = getWorldStars(idx, starsByLevel);
          const maxStars = LEVELS_PER_WORLD * 3;
          const completed = Math.max(0, Math.min(LEVELS_PER_WORLD, progressIndex - world.globalStart + 1));
          const prevWorldName = idx > 0 ? WORLD_INFO[idx - 1].name : '';
          const ptop = WORLD_TEXT_PADDING_TOP[idx];

          return (
            <Pressable
              key={world.id}
              onPress={() => {
                if (isComingSoon || !unlocked) return;
                Haptics.selectionAsync();
                router.push({ pathname: '/world-levels', params: { worldNum: world.worldNumber.toString() } });
              }}
              activeOpacity={isComingSoon ? 1 : (unlocked ? 0.85 : 1)}
              style={[styles.worldWrap, !unlocked && !isComingSoon && styles.worldLocked]}
            >
              <Image
                source={WORLD_BUTTONS[idx]}
                style={[styles.worldBg, { aspectRatio: WORLD_ASPECTS[idx] ?? 1.85 }]}
                resizeMode="contain"
              />
              <View style={[StyleSheet.absoluteFill, styles.worldContent, { paddingTop: ptop }]}>
                <Text style={styles.worldName}>{world.name}</Text>
                {isComingSoon ? (
                  <Text style={styles.worldMeta}>{t('gridSize', { w: world.size, h: world.size })}</Text>
                ) : (
                  <Text style={styles.worldMeta}>
                    {unlocked
                      ? t('gridComplete', { w: world.size, h: world.size, n: completed, total: LEVELS_PER_WORLD })
                      : t('collectStars', { n: STARS_TO_UNLOCK_NEXT_WORLD, world: prevWorldName })}
                  </Text>
                )}
                {isComingSoon ? (
                  <View style={styles.starsRow}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.comingSoonText}>{t('comingSoon')}</Text>
                  </View>
                ) : unlocked ? (
                  <View style={styles.starsRow}>
                    <Text style={styles.starFilled}>★</Text>
                    <Text style={styles.starsText}>{stars}/{maxStars}</Text>
                  </View>
                ) : (
                  <View style={styles.starsRow}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.lockedText}>{t('locked')}</Text>
                  </View>
                )}
              </View>

              {isComingSoon && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <View style={styles.comingSoonOverlay} />
                </View>
              )}
            </Pressable>
          );
        })}
        <View style={{ height: Platform.OS === 'web' ? 20 : insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    justifyContent: 'space-between',
  },
  headerRTL: { flexDirection: 'row-reverse' },
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
  comingSoonText: {
    fontSize: 14, fontWeight: '800', color: '#ff8c00',
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    letterSpacing: 1,
  },
  comingSoonOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
