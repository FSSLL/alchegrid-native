import React, { useRef, useState } from 'react';
import Pressable from '../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePlayerStore } from '../store/playerStore';
import { useAudioStore } from '../store/audioStore';
import { useT } from '../hooks/useT';

// ── Inline slider ─────────────────────────────────────────────────────────────
function VolumeSlider({
  label,
  value,
  onChange,
  accent = '#ff6a00',
  onInteractStart,
  onInteractEnd,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  accent?: string;
  onInteractStart?: () => void;
  onInteractEnd?: () => void;
}) {
  const trackW = useRef(0);
  const trackPageX = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onStartRef = useRef(onInteractStart);
  onStartRef.current = onInteractStart;
  const onEndRef = useRef(onInteractEnd);
  onEndRef.current = onInteractEnd;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        onStartRef.current?.();
        trackPageX.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
        const v = Math.max(0, Math.min(1, e.nativeEvent.locationX / (trackW.current || 1)));
        onChangeRef.current(v);
      },
      onPanResponderMove: (_e, gs) => {
        const v = Math.max(0, Math.min(1, (gs.moveX - trackPageX.current) / (trackW.current || 1)));
        onChangeRef.current(v);
      },
      onPanResponderRelease: () => { onEndRef.current?.(); },
      onPanResponderTerminate: () => { onEndRef.current?.(); },
    })
  ).current;

  const filled = Math.round(value * 100);
  const muted  = value === 0;
  const fillColor = muted ? '#4b5563' : accent;

  return (
    <View style={sl.row}>
      <Text style={sl.label}>{label}</Text>
      <View style={sl.right}>
        <View
          style={sl.hitArea}
          onLayout={(e) => { trackW.current = e.nativeEvent.layout.width; }}
          {...pan.panHandlers}
        >
          <View style={sl.track}>
            <View style={[sl.fill, { width: `${filled}%`, backgroundColor: fillColor }]} />
          </View>
          <View
            style={[
              sl.thumb,
              { left: `${filled}%`, borderColor: fillColor, backgroundColor: muted ? '#2a3244' : '#1a2030' },
            ]}
          />
        </View>
        <Text style={[sl.muteHint, { color: muted ? '#6b7280' : '#8e9ab0' }]}>
          {muted ? 'muted' : `${filled}%`}
        </Text>
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label:    { color: '#eef1f5', fontSize: 14, fontWeight: '600', width: 52 },
  right:    { flex: 1, gap: 4 },
  hitArea:  { height: 44, justifyContent: 'center' },
  track:    { height: 6, backgroundColor: '#242e42', borderRadius: 3, overflow: 'hidden' },
  fill:     { position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 3 },
  thumb:    {
    position: 'absolute', top: (44 - 22) / 2, marginLeft: -11,
    width: 22, height: 22, borderRadius: 11, borderWidth: 2.5,
  },
  muteHint: { fontSize: 11, fontWeight: '600' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [code, setCode] = useState('');
  const [sliderActive, setSliderActive] = useState(false);
  const t = useT();
  const {
    coins, hintBalance, unlimitedHints,
    activateUnlimitedHints, addHint, addCoins, unlockAll, resetProgress,
  } = usePlayerStore();
  const {
    musicVolume, sfxVolume, hapticsEnabled,
    setMusicVolume, setSfxVolume, setHapticsEnabled,
  } = useAudioStore();

  const handleRedeemCode = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed === 'MASTERFAISAL') {
      activateUnlimitedHints();
      Alert.alert('Code Activated!', 'Unlimited hints activated!');
      setCode('');
    } else if (trimmed === 'HINTS10') {
      addHint(10);
      Alert.alert('Code Activated!', '+10 hints added!');
      setCode('');
    } else if (trimmed === 'COINS100') {
      addCoins(100);
      Alert.alert('Code Activated!', '+100 coins added!');
      setCode('');
    } else {
      Alert.alert('Invalid Code', 'This code is not valid or has already been used.');
    }
  };

  return (
    <LinearGradient colors={['#0e1117', '#111827', '#0e1117']} style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>{t('back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('settings')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={!sliderActive}>

        {/* ── Sound & Haptics ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('soundHaptics')}</Text>
          <View style={styles.card}>
            <VolumeSlider label="🎵 Music" value={musicVolume} onChange={setMusicVolume}
              onInteractStart={() => setSliderActive(true)} onInteractEnd={() => setSliderActive(false)} />
            <View style={styles.separator} />
            <VolumeSlider label="🔊 SFX" value={sfxVolume} onChange={setSfxVolume} accent="#22c55e"
              onInteractStart={() => setSliderActive(true)} onInteractEnd={() => setSliderActive(false)} />
            <View style={styles.separator} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>📳 Haptics</Text>
              <Pressable
                style={[styles.toggle, hapticsEnabled && styles.toggleOn]}
                onPress={() => setHapticsEnabled(!hapticsEnabled)}
                activeOpacity={0.7}
              >
                <View style={[styles.toggleThumb, hapticsEnabled && styles.toggleThumbOn]} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Account ───────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account')}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>🪙 {t('coins')}</Text>
              <Text style={styles.rowValue}>{coins}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>💡 {t('hints')}</Text>
              <Text style={styles.rowValue}>{unlimitedHints ? '∞' : hintBalance}</Text>
            </View>
          </View>
        </View>

        {/* ── Redeem Code ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('redeemCode')}</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              placeholder="Enter code..."
              placeholderTextColor="#8e9ab0"
              autoCapitalize="characters"
            />
            <Pressable style={styles.redeemBtn} onPress={handleRedeemCode}>
              <Text style={styles.redeemBtnText}>{t('redeem')}</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Dev Tools ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠 Dev Tools</Text>
          <View style={styles.card}>
            {/* Unlock All Levels — hidden for release, kept for future testing
            <Pressable
              style={[styles.redeemBtn, { backgroundColor: '#16a34a' }]}
              onPress={() => {
                unlockAll();
                Alert.alert('Unlocked!', 'All 240 levels unlocked · 3 stars each · 9999 coins · 99 hints');
              }}
            >
              <Text style={styles.redeemBtnText}>🔓 Unlock All Levels</Text>
            </Pressable>
            */}
            <Pressable
              style={[styles.redeemBtn, { backgroundColor: '#dc2626' }]}
              onPress={() =>
                Alert.alert('Reset Progress', 'This will reset all stars, coins, and level progress.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                      resetProgress();
                      Alert.alert('Reset', 'Progress has been reset to the beginning.');
                    },
                  },
                ])
              }
            >
              <Text style={styles.redeemBtnText}>🔄 Reset All Progress</Text>
            </Pressable>
          </View>
        </View>

        {/* ── About ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about')}</Text>
          <View style={styles.card}>
            <Text style={styles.aboutText}>
              Alchegrid is a strategic elemental Latin-square puzzle game.
              {'\n\n'}
              8 worlds · 240 levels · Infinite possibilities
              {'\n\n'}
              Version 1.0
            </Text>
          </View>
        </View>

        {/* ── Contact Us ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contactUs')}</Text>
          <View style={styles.card}>
            <Text style={styles.contactIntro}>{t('loveToHear')}</Text>
            <View style={styles.separator} />
            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>📧</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{t('email')}</Text>
                <Text style={styles.contactValue}>alchegridapp@gmail.com</Text>
              </View>
            </View>
            <View style={styles.separator} />
            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>📞</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{t('phone')}</Text>
                <Text style={styles.contactValue}>+971 54 466 5566</Text>
              </View>
            </View>
            <View style={styles.separator} />
            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>💬</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{t('whatsapp')}</Text>
                <Text style={styles.contactValue}>+971 54 466 5566</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: Platform.OS === 'web' ? 34 : insets.bottom + 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#171c26', borderRadius: 10,
  },
  backIcon:     { color: '#eef1f5', fontSize: 18, fontWeight: '700' },
  title:        { fontSize: 20, fontWeight: '700', color: '#eef1f5' },
  scroll:       { padding: 16, gap: 20 },
  section:      { gap: 8 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#8e9ab0',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  card: {
    backgroundColor: '#171c26', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#242e42', gap: 14,
  },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel:  { color: '#eef1f5', fontSize: 15, fontWeight: '600' },
  rowValue:  { color: '#8e9ab0', fontSize: 15, fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#242e42' },
  codeInput: {
    backgroundColor: '#1a2030', borderRadius: 10, padding: 12,
    color: '#eef1f5', fontSize: 15, borderWidth: 1, borderColor: '#242e42',
  },
  redeemBtn:     { backgroundColor: '#ff6a00', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  redeemBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  aboutText:     { color: '#8e9ab0', fontSize: 14, lineHeight: 22 },
  contactIntro:  { color: '#eef1f5', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  contactRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon:   { fontSize: 22 },
  contactInfo:   { flex: 1 },
  contactLabel:  { color: '#8e9ab0', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  contactValue:  { color: '#eef1f5', fontSize: 14, fontWeight: '600', marginTop: 2 },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: '#242e42', justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleOn:      { backgroundColor: '#ff6a00' },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#8e9ab0', alignSelf: 'flex-start',
  },
  toggleThumbOn: { backgroundColor: '#fff', alignSelf: 'flex-end' },
});
