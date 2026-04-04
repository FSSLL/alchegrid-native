import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WORLD_INFO } from '../lib/levelRegistry';
import { WORLD_RECIPES } from '../lib/levelGenerator';
import { ELEMENT_DEFINITIONS } from '../constants/elementDefinitions';
import ElementIcon from '../components/ElementIcon';

interface ActiveDef {
  name: string;
  definition: string;
}

// ── Definition Popup ──────────────────────────────────────────────────────────
function DefinitionPopup({
  active,
  onClose,
}: {
  active: ActiveDef | null;
  onClose: () => void;
}) {
  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      translateY.value = withSpring(0, { damping: 26, stiffness: 340 });
      opacity.value = withSpring(1, { damping: 26, stiffness: 340 });
    } else {
      translateY.value = withTiming(40, { duration: 180 });
      opacity.value = withTiming(0, { duration: 180 }, (done) => {
        if (done) runOnJS(setVisible)(false);
      });
    }
  }, [active]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && !active) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Dimmer */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.dimmer} />
      </TouchableWithoutFeedback>

      {/* Bottom sheet */}
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Icon */}
          <View style={styles.defIconBox}>
            <ElementIcon name={active?.name ?? ''} size={20} />
          </View>

          {/* Text block */}
          <View style={styles.defTextBlock}>
            <Text style={styles.defName}>{active?.name}</Text>
            <Text style={styles.defDesc}>{active?.definition}</Text>
          </View>

          {/* Close */}
          <TouchableOpacity onPress={onClose} style={styles.defClose} hitSlop={8}>
            <Text style={styles.defCloseIcon}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const [selectedWorld, setSelectedWorld] = useState(1);
  const [activeDefinition, setActiveDefinition] = useState<ActiveDef | null>(null);
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

  const showDefinition = useCallback((name: string) => {
    const def = ELEMENT_DEFINITIONS[name];
    if (def) setActiveDefinition({ name, definition: def });
  }, []);

  const closeDefinition = useCallback(() => setActiveDefinition(null), []);

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

      {/* Base elements */}
      <View style={styles.elementsRow}>
        {world?.elements.map((el) => (
          <TouchableOpacity key={el} onPress={() => showDefinition(el)} style={styles.elementChip} activeOpacity={0.7}>
            <ElementIcon name={el} size={20} />
            <Text style={styles.elementName}>{el}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.countLine}>
        {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
      </Text>

      <ScrollView contentContainerStyle={styles.recipeList}>
        {recipes.map((r) => (
          <View key={r.name} style={[styles.recipeCard, { borderLeftColor: ingredientColor(r.ingredients.length) }]}>
            {/* Recipe header — tap to see definition */}
            <TouchableOpacity onPress={() => showDefinition(r.name)} activeOpacity={0.7} style={styles.recipeHeader}>
              <ElementIcon name={r.name} size={32} />
              <Text style={styles.recipeName}>{r.name}</Text>
              <Text style={styles.defHint}>ⓘ</Text>
            </TouchableOpacity>

            {/* Ingredients — each ingredient name is tappable */}
            <View style={styles.ingredientRow}>
              {r.ingredients.map((el, i) => (
                <React.Fragment key={el}>
                  {i > 0 && <Text style={styles.plus}>+</Text>}
                  <TouchableOpacity
                    onPress={() => showDefinition(el)}
                    activeOpacity={0.7}
                    style={styles.ingredientChip}
                  >
                    <ElementIcon name={el} size={16} />
                    <Text style={styles.ingredientName}>{el}</Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: Platform.OS === 'web' ? 34 : insets.bottom + 20 }} />
      </ScrollView>

      <DefinitionPopup active={activeDefinition} onClose={closeDefinition} />
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
  container:   { flex: 1, backgroundColor: 'transparent' },
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
  worldTabs:    { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  worldTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#171c26', borderRadius: 20,
    borderWidth: 1, borderColor: '#242e42',
  },
  worldTabActive:     { backgroundColor: '#ff6a00', borderColor: '#ff6a00' },
  worldTabText:       { color: '#8e9ab0', fontWeight: '700', fontSize: 13 },
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
  elementName:  { color: '#8e9ab0', fontSize: 11, fontWeight: '600' },
  countLine: {
    color: '#8e9ab0', fontSize: 12, paddingHorizontal: 16,
    marginBottom: 8, fontStyle: 'italic',
  },
  recipeList:   { paddingHorizontal: 16, gap: 6 },
  recipeCard: {
    backgroundColor: '#171c26', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#242e42',
    borderLeftWidth: 3,
  },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  recipeName:   { fontSize: 15, fontWeight: '700', color: '#eef1f5', flex: 1 },
  defHint:      { color: '#3b4a63', fontSize: 14 },
  ingredientRow:{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  plus:         { color: '#4b5563', fontSize: 12, fontWeight: '700', marginHorizontal: 1 },
  ingredientChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#1e2535', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  ingredientName: { color: '#64748b', fontSize: 10, fontWeight: '600' },

  // ── Popup ──────────────────────────────────────────────────────────────────
  dimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 448,
    backgroundColor: '#0f1623',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e2d45',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  defIconBox: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,106,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  defTextBlock: { flex: 1 },
  defName: {
    fontSize: 14, fontWeight: '700',
    color: '#eef1f5', marginBottom: 3,
  },
  defDesc: {
    fontSize: 13, color: '#8e9ab0',
    lineHeight: 19,
  },
  defClose: {
    padding: 4,
    borderRadius: 99,
    backgroundColor: '#1a2436',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 26, height: 26,
  },
  defCloseIcon: { color: '#64748b', fontSize: 12, fontWeight: '700' },
});
