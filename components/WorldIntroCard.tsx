import React, { useRef, useEffect } from 'react';
import Pressable from './Pressable';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import type { WorldInfo } from '../lib/types';
import ElementIcon from './ElementIcon';
import { useT } from '../hooks/useT';

interface Props {
  world: WorldInfo;
  prevWorldName?: string;
  isFirstVisit: boolean;
  onClose: () => void;
}

export default function WorldIntroCard({ world, prevWorldName, isFirstVisit, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const isWorld1  = world.worldNumber === 1;
  const t = useT();

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  const isUnlockState = isFirstVisit && !isWorld1 && !!prevWorldName;

  return (
    <Modal transparent animationType="none" visible onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header band */}
          <View style={styles.headerBand}>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
            <View style={styles.headerRow}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>{isUnlockState ? '✨' : '🌐'}</Text>
              </View>
              <View>
                {isUnlockState ? (
                  <Text style={styles.tagline}>{t('worldUnlocked')}</Text>
                ) : (
                  <Text style={[styles.tagline, { color: '#8e9ab0' }]}>{t('aboutThisWorld')}</Text>
                )}
                <Text style={styles.worldName}>{world.name}</Text>
              </View>
            </View>
            {isUnlockState ? (
              <Text style={styles.desc}>
                {t('masteredWorld', { world: prevWorldName ?? '' })}
              </Text>
            ) : (
              <Text style={styles.desc}>
                {t('eachWorldDesc')}
              </Text>
            )}
          </View>

          {/* Elements list */}
          <View style={styles.elementsSection}>
            <Text style={styles.elementsLabel}>
              {t('elementsLabel', { n: world.elements.length, w: world.size, h: world.size })}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.elementsRow}
            >
              {world.elements.map((el) => (
                <View key={el} style={styles.elementChip}>
                  <ElementIcon name={el} size={24} showLabel={false} />
                  <Text style={styles.elementChipText}>{el}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* CTA */}
          <Pressable style={styles.ctaBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.ctaBtnText}>
              {isUnlockState ? t('letsExplore') : t('gotIt')}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#171c26',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerBand: {
    backgroundColor: 'rgba(255,106,0,0.06)',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 14, right: 14,
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, marginTop: 4 },
  iconBox: {
    width: 40, height: 40, borderRadius: 16,
    backgroundColor: 'rgba(255,106,0,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 20 },
  tagline: { fontSize: 11, fontWeight: '700', color: '#ff6a00', textTransform: 'uppercase', letterSpacing: 0.8 },
  worldName: { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 1 },
  desc: { fontSize: 13, color: '#8e9ab0', lineHeight: 20 },
  descBold: { color: '#c8d3e0', fontWeight: '700' },
  elementsSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  elementsLabel: {
    fontSize: 11, fontWeight: '700', color: '#5a6680',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  elementsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  elementChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
  },
  elementChipText: { fontSize: 12, fontWeight: '600', color: '#c8d3e0' },
  ctaBtn: {
    margin: 20, marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#ff6a00',
    alignItems: 'center',
  },
  ctaBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },
});
