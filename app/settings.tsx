import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePlayerStore } from '../store/playerStore';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [code, setCode] = useState('');
  const { coins, hintBalance, unlimitedHints, activateUnlimitedHints, addHint, addCoins } = usePlayerStore();

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
        {/* Account section */}
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

        {/* Gift codes */}
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

        {/* About */}
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
  container: { flex: 1, backgroundColor: 'transparent' },
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
  backIcon: { color: '#eef1f5', fontSize: 18, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#eef1f5' },
  scroll: { padding: 16, gap: 20 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8e9ab0',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#171c26',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242e42',
    gap: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: '#eef1f5', fontSize: 15, fontWeight: '600' },
  rowValue: { color: '#8e9ab0', fontSize: 15, fontWeight: '600' },
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
  redeemBtn: {
    backgroundColor: '#ff6a00',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  redeemBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  aboutText: { color: '#8e9ab0', fontSize: 14, lineHeight: 22 },
});
