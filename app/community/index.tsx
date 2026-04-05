import React, { useState } from 'react';
import Pressable from '../../components/Pressable';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommunityExplore from '../../components/CommunityExplore';
import CommunityBuilder from '../../components/CommunityBuilder';

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 16 : insets.top;
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'explore' | 'build'>(
    tabParam === 'build' ? 'build' : 'explore',
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>Community</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab toggle */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'explore' && styles.tabActive]}
          onPress={() => setTab('explore')}
        >
          <Text style={[styles.tabText, tab === 'explore' && styles.tabTextActive]}>
            🧭 Explore Levels
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'build' && styles.tabActive]}
          onPress={() => setTab('build')}
        >
          <Text style={[styles.tabText, tab === 'build' && styles.tabTextActive]}>
            🔨 Make Level
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {tab === 'explore' ? <CommunityExplore /> : <CommunityBuilder />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(8,11,18,0.97)' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
  },
  backIcon: { color: '#cbd5e1', fontSize: 20, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },

  tabs: {
    flexDirection: 'row', marginHorizontal: 16, borderRadius: 14, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: 'rgba(96,165,250,0.2)' },
  tabText: { fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
  tabTextActive: { color: '#60a5fa', fontWeight: '800' },

  content: { flex: 1 },
});
