import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

// ── Inline slider ─────────────────────────────────────────────────────────────
function VolumeSlider({
  label,
  value,
  onChange,
  accent = '#ff6a00',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  accent?: string;
}) {
  const trackW = useRef(0);

  const clamp = (x: number) => Math.max(0, Math.min(1, x / (trackW.current || 1)));

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => onChange(clamp(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => onChange(clamp(e.nativeEvent.locationX)),
    })
  ).current;

  const filled = Math.round(value * 100);
  const muted  = value === 0;

  return (
    <View style={sl.row}>
      <Text style={sl.label}>{label}</Text>
      <View style={sl.right}>
        {/* track */}
        <View
          style={sl.track}
          onLayout={(e) => { trackW.current = e.nativeEvent.layout.width; }}
          {...pan.panHandlers}
        >
          <View style={[sl.fill, { width: `${filled}%`, backgroundColor: muted ? '#4b5563' : accent }]} />
          <View
            style={[
              sl.thumb,
              { left: `${filled}%`, borderColor: muted ? '#4b5563' : accent },
            ]}
          />
        </View>
        {/* mute label */}
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
  track:    {
    height: 8,
    backgroundColor: '#242e42',
    borderRadius: 4,
    overflow: 'visible',
  },
  fill:     {
    position: 'absolute',
    top: 0, left: 0,
    height: 8,
    borderRadius: 4,
  },
  thumb:    {
    position: 'absolute',
    top: -6,
    marginLeft: -10,
    width: 20, height: 20,
    borderRadius: 10,
    backgroundColor: '#1a2030',
    borderWidth: 2,
  },
  muteHint: { fontSize: 11, fontWeight: '600' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [code, setCode] = useState('');
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Sound & Haptics ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Haptics</Text>
          <View style={styles.card}>
            <VolumeSlider label="🎵 Music" value={musicVolume} onChange={setMusicVolume} />
            <View style={styles.separator} />
            <VolumeSlider label="🔊 SFX" value={sfxVolume} onChange={setSfxVolume} accent="#22c55e" />
            <View style={styles.separator} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>📳 Haptics</Text>
              <TouchableOpacity
                style={[styles.toggle, hapticsEnabled && styles.toggleOn]}
                onPress={() => setHapticsEnabled(!hapticsEnabled)}
                activeOpacity={0.7}
              >
                <View style={[styles.toggleThumb, hapticsEnabled && styles.toggleThumbOn]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Account ───────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>🪙 Coins</Text>
              <Text style={styles.rowValue}>{coins}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>💡 Hint Balance</Text>
              <Text style={styles.rowValue}>{unlimitedHints ? '∞ (Unlimited)' : hintBalance}</Text>
            </View>
          </View>
        </View>

        {/* ── Redeem Code ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Redeem Code</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              placeholder="Enter code..."
              placeholderTextColor="#8e9ab0"
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeemCode}>
              <Text style={styles.redeemBtnText}>Redeem</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Dev Tools ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠 Dev Tools</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.redeemBtn, { backgroundColor: '#16a34a' }]}
              onPress={() => {
                unlockAll();
                Alert.alert('Unlocked!', 'All 240 levels unlocked · 3 stars each · 9999 coins · 99 hints');
              }}
            >
              <Text style={styles.redeemBtnText}>🔓 Unlock All Levels</Text>
            </TouchableOpacity>
            <TouchableOpacity
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
            </TouchableOpacity>
          </View>
        </View>

        {/* ── About ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
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

        <View style={{ height: Platform.OS === 'web' ? 34 : insets.bottom + 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 12, fontWeight: '700',
    color: '#8e9ab0',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  card: {
    backgroundColor: '#171c26',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242e42',
    gap: 14,
  },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel:  { color: '#eef1f5', fontSize: 15, fontWeight: '600' },
  rowValue:  { color: '#8e9ab0', fontSize: 15, fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#242e42' },
  codeInput: {
    backgroundColor: '#1a2030',
    borderRadius: 10,
    padding: 12,
    color: '#eef1f5',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#242e42',
  },
  redeemBtn:     {
    backgroundColor: '#ff6a00',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  redeemBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  aboutText:     { color: '#8e9ab0', fontSize: 14, lineHeight: 22 },

  // Toggle switch
  toggle: {
    width: 48, height: 28,
    borderRadius: 14,
    backgroundColor: '#242e42',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn:      { backgroundColor: '#ff6a00' },
  toggleThumb: {
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: '#8e9ab0',
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
});
