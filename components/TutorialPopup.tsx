import React, { useState, useEffect, useRef } from 'react';
import Pressable from './Pressable';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useT } from '../hooks/useT';

const ND = Platform.OS !== 'web';

interface Props {
  show: boolean;
  onClose: (neverShowAgain: boolean) => void;
}

export function TutorialPopup({ show, onClose }: Props) {
  const t = useT();
  const [neverShow, setNeverShow] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: ND }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: ND, damping: 22, stiffness: 280 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 160, useNativeDriver: ND }),
        Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: ND, damping: 20, stiffness: 280 }),
      ]).start(() => setVisible(false));
    }
  }, [show, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => onClose(neverShow)} />
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* Close */}
          <Pressable style={styles.closeBtn} onPress={() => onClose(neverShow)}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>

          {/* Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>📖</Text>
          </View>

          <Text style={styles.title}>{t('newToAlchegrid')}</Text>
          <Text style={styles.body}>{t('tutorialPopupBody')}</Text>
          <Text style={styles.subBody}>{t('tutorialPopupSub')}</Text>

          {/* Primary button */}
          <Pressable
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => {
              onClose(true);
              router.push('/tutorial');
            }}
          >
            <Text style={styles.primaryBtnText}>{t('playTutorial')}</Text>
          </Pressable>

          {/* Secondary button */}
          <Pressable
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => onClose(neverShow)}
          >
            <Text style={styles.secondaryBtnText}>{t('notNow')}</Text>
          </Pressable>

          {/* "Don't show again" checkbox */}
          <Pressable style={styles.checkRow} onPress={() => setNeverShow(!neverShow)} activeOpacity={0.7}>
            <View style={[styles.checkbox, neverShow && styles.checkboxOn]}>
              {neverShow && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>{t('dontShowAgain')}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#131824',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    gap: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  closeIcon:    { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '700' },

  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconEmoji:    { fontSize: 26 },

  title: {
    fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center',
  },
  body: {
    fontSize: 14, color: 'rgba(255,255,255,0.72)',
    textAlign: 'center', lineHeight: 21,
  },
  subBody: {
    fontSize: 12, color: 'rgba(255,255,255,0.42)',
    textAlign: 'center',
  },

  primaryBtn: {
    width: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  secondaryBtn: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryBtnText: { color: 'rgba(255,255,255,0.75)', fontWeight: '600', fontSize: 14 },

  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2,
  },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  checkMark:  { color: '#fff', fontSize: 11, fontWeight: '800' },
  checkLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
});
