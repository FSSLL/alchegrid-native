import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WORLD_INFO } from '../lib/levelRegistry';
import { WORLD_RECIPES } from '../lib/levelGenerator';
import { ELEMENT_EMOJIS } from '../lib/elementEmojis';
import { ELEMENT_PNGS } from '../constants/assets';

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const [selectedWorld, setSelectedWorld] = useState(1);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const world = WORLD_INFO[selectedWorld - 1];

  const recipes = useMemo(() => {
    const map = WORLD_RECIPES[selectedWorld];
    if (!map) return [];
    return Object.entries(map)
      .map(([key, name]) => ({
        name,
        ingredients: key.split('+').sort(),
      }))
      .sort((a, b) => a.ingredients.length - b.ingredients.length || a.name.localeCompare(b.name));
  }, [selectedWorld]);

  return (
    <LinearGradient colors={['#0e1117', '#111827', '#0e1117']} style={[styles.container, { paddingTop: topPad }]}>
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
        {world?.elements.map((el) => {
          const png = ELEMENT_PNGS[el.toLowerCase()];
          return (
            <View key={el} style={styles.elementChip}>
              {png
                ? <Image source={png} style={styles.elementIcon} resizeMode="contain" />
                : <Text style={styles.elementEmoji}>{ELEMENT_EMOJIS[el.toLowerCase()] ?? '●'}</Text>
              }
              <Text style={styles.elementName}>{el}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.countLine}>
        {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
      </Text>

      <ScrollView contentContainerStyle={styles.recipeList}>
        {recipes.map((r) => {
          const recipePng = ELEMENT_PNGS[r.name.toLowerCase()];
          return (
            <View key={r.name} style={[styles.recipeCard, { borderLeftColor: ingredientColor(r.ingredients.length) }]}>
              <View style={styles.recipeHeader}>
                {recipePng && (
                  <Image source={recipePng} style={styles.recipeIcon} resizeMode="contain" />
                )}
                <Text style={styles.recipeName}>{r.name}</Text>
              </View>
              <View style={styles.ingredientRow}>
                {r.ingredients.map((el, i) => {
                  const elPng = ELEMENT_PNGS[el.toLowerCase()];
                  return (
                    <React.Fragment key={el}>
                      {i > 0 && <Text style={styles.plus}>+</Text>}
                      <View style={styles.ingredientChip}>
                        {elPng
                          ? <Image source={elPng} style={styles.ingredientIcon} resizeMode="contain" />
                          : <Text style={styles.ingredientEmoji}>{ELEMENT_EMOJIS[el.toLowerCase()] ?? '●'}</Text>
                        }
                        <Text style={styles.ingredientName}>{el}</Text>
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          );
        })}
        <View style={{ height: Platform.OS === 'web' ? 34 : insets.bottom + 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function ingredientColor(count: number): string {
  if (count === 2) return '#60a5fa';
  if (count === 3) return '#34d399';
  if (count === 4) return '#a78bfa';
  if (count === 5) return '#fb923c';
  return '#f87171';
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
    paddingHorizontal: 16, gap: 6, marginBottom: 8,
  },
  elementChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1a2030', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#242e42',
  },
  elementIcon: { width: 20, height: 20 },
  elementEmoji: { fontSize: 14 },
  elementName: { color: '#8e9ab0', fontSize: 11, fontWeight: '600' },
  countLine: {
    color: '#8e9ab0', fontSize: 12, paddingHorizontal: 16,
    marginBottom: 8, fontStyle: 'italic',
  },
  recipeList: { paddingHorizontal: 16, gap: 6 },
  recipeCard: {
    backgroundColor: '#171c26', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#242e42',
    borderLeftWidth: 3,
  },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  recipeIcon: { width: 32, height: 32 },
  recipeName: { fontSize: 15, fontWeight: '700', color: '#eef1f5', flex: 1 },
  ingredientRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  plus: { color: '#4b5563', fontSize: 12, fontWeight: '700', marginHorizontal: 1 },
  ingredientChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#1e2535', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  ingredientIcon: { width: 16, height: 16 },
  ingredientEmoji: { fontSize: 12 },
  ingredientName: { color: '#64748b', fontSize: 10, fontWeight: '600' },
});
