import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WORLD_INFO } from '../lib/levelRegistry';
import { ELEMENT_EMOJIS } from '../lib/elementEmojis';
import colors from '../constants/colors';

const RECIPES_BY_WORLD: Record<number, Array<{ name: string; ingredients: string[] }>> = {
  1: [
    { name: 'Mud', ingredients: ['Earth', 'Water'] },
    { name: 'Lightning', ingredients: ['Wind', 'Fire'] },
    { name: 'Dust', ingredients: ['Wind', 'Earth'] },
    { name: 'Steam', ingredients: ['Fire', 'Water'] },
    { name: 'Ice', ingredients: ['Wind', 'Water'] },
    { name: 'Lava', ingredients: ['Earth', 'Fire'] },
    { name: 'Storm', ingredients: ['Wind', 'Fire', 'Water'] },
    { name: 'Sand', ingredients: ['Wind', 'Earth', 'Fire'] },
    { name: 'Clay', ingredients: ['Earth', 'Fire', 'Water'] },
    { name: 'Life', ingredients: ['Wind', 'Earth', 'Water'] },
    { name: 'Energy', ingredients: ['Wind', 'Earth', 'Fire', 'Water'] },
  ],
  2: [
    { name: 'Plywood', ingredients: ['Wood', 'Metal'] },
    { name: 'Mirror', ingredients: ['Metal', 'Glass'] },
    { name: 'Tire', ingredients: ['Metal', 'Rubber'] },
    { name: 'Window', ingredients: ['Wood', 'Glass'] },
    { name: 'Frame', ingredients: ['Wood', 'Metal', 'Glass'] },
    { name: 'Gear', ingredients: ['Metal', 'Rubber', 'Plastic'] },
    { name: 'Core', ingredients: ['Wood', 'Metal', 'Glass', 'Rubber', 'Plastic'] },
  ],
  3: [
    { name: 'Wire', ingredients: ['Metal', 'Electricity'] },
    { name: 'Motor', ingredients: ['Metal', 'Electricity', 'Fuel'] },
    { name: 'Generator', ingredients: ['Metal', 'Rubber', 'Electricity', 'Fuel'] },
    { name: 'Engine', ingredients: ['Metal', 'Rubber', 'Plastic', 'Glass', 'Electricity', 'Fuel'] },
  ],
  4: [
    { name: 'Lava', ingredients: ['Earth', 'Fire'] },
    { name: 'Salt', ingredients: ['Acid', 'Base'] },
    { name: 'Solution', ingredients: ['Water', 'Heat', 'Gas', 'Carbon', 'Metal', 'Acid', 'Base'] },
  ],
  5: [
    { name: 'Photon', ingredients: ['Energy', 'Wave'] },
    { name: 'Entanglement', ingredients: ['Field', 'Particle', 'Spin', 'Wave'] },
    { name: 'Unified Field', ingredients: ['Charge', 'Energy', 'Field', 'Observer', 'Particle', 'Spin', 'Void', 'Wave'] },
  ],
  6: [
    { name: 'DNA', ingredients: ['Carbon', 'Cell', 'Nitrogen'] },
    { name: 'Photosynthesis', ingredients: ['Carbon', 'Light', 'Oxygen'] },
    { name: 'Primordial Soup', ingredients: ['Acid', 'Carbon', 'Cell', 'Enzyme', 'Heat', 'Light', 'Nitrogen', 'Oxygen', 'Water'] },
  ],
  7: [
    { name: 'Forge', ingredients: ['Fire', 'Metal'] },
    { name: 'Temple', ingredients: ['Labor', 'Spirit', 'Stone'] },
    { name: 'Golden Age', ingredients: ['Fire', 'Knowledge', 'Labor', 'Metal', 'Soil', 'Spirit', 'Stone', 'Time', 'Water', 'Wood'] },
  ],
  8: [
    { name: 'Star', ingredients: ['Gas', 'Gravity', 'Plasma'] },
    { name: 'Supernova', ingredients: ['Gas', 'Gravity', 'Plasma', 'Radiation'] },
    { name: 'Universe', ingredients: ['Dark Matter', 'Dust', 'Gas', 'Gravity', 'Ice', 'Light', 'Magnetism', 'Plasma', 'Radiation', 'Time', 'Void'] },
  ],
};

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const [selectedWorld, setSelectedWorld] = useState(1);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const world = WORLD_INFO[selectedWorld - 1];
  const recipes = RECIPES_BY_WORLD[selectedWorld] ?? [];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recipe Catalog</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* World selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.worldTabs}>
        {WORLD_INFO.map((w) => (
          <TouchableOpacity
            key={w.id}
            onPress={() => setSelectedWorld(w.worldNumber)}
            style={[styles.worldTab, selectedWorld === w.worldNumber && styles.worldTabActive]}
          >
            <Text style={[styles.worldTabText, selectedWorld === w.worldNumber && styles.worldTabTextActive]}>
              W{w.worldNumber}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.worldName}>{world?.name}</Text>

      {/* Elements */}
      <View style={styles.elementsRow}>
        {world?.elements.map((el) => (
          <View key={el} style={styles.elementChip}>
            <Text style={styles.elementEmoji}>{ELEMENT_EMOJIS[el.toLowerCase()] ?? '●'}</Text>
            <Text style={styles.elementName}>{el}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.recipeList}>
        {recipes.map((r) => (
          <View key={r.name} style={styles.recipeCard}>
            <Text style={styles.recipeName}>{r.name}</Text>
            <Text style={styles.recipeIngredients}>
              {r.ingredients.map((el) => `${ELEMENT_EMOJIS[el.toLowerCase()] ?? '●'} ${el}`).join(' + ')}
            </Text>
          </View>
        ))}
        <Text style={styles.moreText}>+more recipes discovered in game</Text>
        <View style={{ height: Platform.OS === 'web' ? 34 : insets.bottom + 20 }} />
      </ScrollView>
    </View>
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
  worldTabs: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  worldTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#171c26', borderRadius: 20,
    borderWidth: 1, borderColor: '#242e42',
  },
  worldTabActive: { backgroundColor: '#ff6a00', borderColor: '#ff6a00' },
  worldTabText: { color: '#8e9ab0', fontWeight: '700', fontSize: 13 },
  worldTabTextActive: { color: '#fff' },
  worldName: {
    fontSize: 16, fontWeight: '700', color: '#eef1f5',
    paddingHorizontal: 16, marginTop: 8, marginBottom: 4,
  },
  elementsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 6, marginBottom: 12,
  },
  elementChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1a2030', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#242e42',
  },
  elementEmoji: { fontSize: 14 },
  elementName: { color: '#8e9ab0', fontSize: 11, fontWeight: '600' },
  recipeList: { paddingHorizontal: 16, gap: 8 },
  recipeCard: {
    backgroundColor: '#171c26', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#242e42',
  },
  recipeName: { fontSize: 15, fontWeight: '700', color: '#eef1f5', marginBottom: 4 },
  recipeIngredients: { fontSize: 12, color: '#8e9ab0', lineHeight: 18 },
  moreText: {
    color: '#8e9ab0', fontSize: 13, fontStyle: 'italic',
    textAlign: 'center', marginTop: 12,
  },
});
