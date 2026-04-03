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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePlayerStore } from '../store/playerStore';

const STEPS = [
  {
    icon: '🔲',
    title: 'The Grid',
    body: 'Each level has an N×N grid. Fill every cell with one of the available elements.',
  },
  {
    icon: '🚫',
    title: 'Latin Square Rule',
    body: 'No element can repeat in any row or column. Each element appears exactly once per row and column.',
  },
  {
    icon: '⬡',
    title: 'Zones',
    body: 'The grid is divided into colored zones. Each zone has a recipe — the elements inside must match the recipe exactly.',
  },
  {
    icon: '✅',
    title: 'Win Condition',
    body: 'Fill every cell, satisfy all zones, and have no row/column conflicts to complete the level.',
  },
  {
    icon: '⭐',
    title: 'Star Rating',
    body: 'Complete levels quickly to earn 3 stars. Slower completions earn 2 or 1 star.',
  },
  {
    icon: '💡',
    title: 'Hints',
    body: 'Tap the hint button then tap any cell to reveal the correct element. Hints cost 1 from your hint balance.',
  },
  {
    icon: '🌍',
    title: '8 Worlds',
    body: 'Start with Nature Lab (4×4) and unlock harder worlds up to Cosmos (11×11) with 11 elements!',
  },
];

export default function TutorialScreen() {
  const insets = useSafeAreaInsets();
  const { dismissTutorial } = usePlayerStore();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <LinearGradient colors={['#0e1117', '#111827', '#0e1117']} style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>How to Play</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepIconContainer}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => {
            dismissTutorial();
            router.replace('/');
          }}
        >
          <Text style={styles.startBtnText}>Start Playing!</Text>
        </TouchableOpacity>
        <View style={{ height: Platform.OS === 'web' ? 34 : insets.bottom + 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
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
  scroll: { padding: 16, gap: 16 },
  step: {
    backgroundColor: '#171c26',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: '#242e42',
  },
  stepIconContainer: {
    width: 48, height: 48,
    borderRadius: 12,
    backgroundColor: '#1a2030',
    alignItems: 'center', justifyContent: 'center',
  },
  stepIcon: { fontSize: 24 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#eef1f5', marginBottom: 4 },
  stepBody: { fontSize: 13, color: '#8e9ab0', lineHeight: 20 },
  startBtn: {
    backgroundColor: '#ff6a00',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
