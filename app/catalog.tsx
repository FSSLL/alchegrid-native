import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ImageBackground,
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
import { ELEMENT_DEFINITIONS } from '../constants/elementDefinitions';
import { RECIPE_CATALOG, WORLD_CATALOG, type WorldCatalogInfo } from '../constants/recipeCatalog';
import ElementIcon from '../components/ElementIcon';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ActiveDef { name: string; definition: string }

// ── Definition Popup ──────────────────────────────────────────────────────────
const DefinitionPopup = React.memo(function DefinitionPopup({
  active,
  onClose,
}: { active: ActiveDef | null; onClose: () => void }) {
  const translateY = useSharedValue(60);
  const opacity    = useSharedValue(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      translateY.value = withSpring(0, { damping: 26, stiffness: 340 });
      opacity.value    = withSpring(1, { damping: 26, stiffness: 340 });
    } else {
      translateY.value = withTiming(40, { duration: 180 });
      opacity.value    = withTiming(0, { duration: 180 }, (done) => {
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
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.dimmer} />
      </TouchableWithoutFeedback>
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.defIconBox}>
            <ElementIcon name={active?.name ?? ''} size={20} />
          </View>
          <View style={styles.defTextBlock}>
            <Text style={styles.defName}>{active?.name}</Text>
            <Text style={styles.defDesc}>{active?.definition}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.defClose} hitSlop={8}>
            <Text style={styles.defCloseIcon}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
});

// ── Recipe group section label ────────────────────────────────────────────────
function GroupLabel({ count }: { count: number }) {
  return (
    <Text style={styles.groupLabel}>
      {count}-ELEMENT COMBINATIONS
    </Text>
  );
}

// ── Single recipe row ─────────────────────────────────────────────────────────
function RecipeRow({
  name,
  ingredients,
  onTap,
}: { name: string; ingredients: string[]; onTap: (n: string) => void }) {
  return (
    <View style={styles.recipeRow}>
      {/* Left: icon + name */}
      <TouchableOpacity
        onPress={() => onTap(name)}
        style={styles.recipeLeft}
        activeOpacity={0.7}
      >
        <ElementIcon name={name} size={24} />
        <Text style={styles.recipeRowName} numberOfLines={1}>{name}</Text>
      </TouchableOpacity>

      {/* Equals */}
      <Text style={styles.equals}>=</Text>

      {/* Right: ingredient pills */}
      <View style={styles.recipeRight}>
        {ingredients.map((ing, i) => (
          <React.Fragment key={ing + i}>
            {i > 0 && <Text style={styles.plus}>+</Text>}
            <TouchableOpacity
              onPress={() => onTap(ing)}
              style={styles.ingPill}
              activeOpacity={0.7}
            >
              <ElementIcon name={ing} size={16} />
              <Text style={styles.ingName} numberOfLines={1}>{ing}</Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ── Expanded world body ───────────────────────────────────────────────────────
function WorldBody({
  info,
  onTap,
}: { info: WorldCatalogInfo; onTap: (n: string) => void }) {
  const recipes = useMemo(() => {
    const filtered = RECIPE_CATALOG.filter((r) => r.world === info.world);
    const groups: Record<number, typeof filtered> = {};
    for (const r of filtered) {
      const k = r.ingredients.length;
      (groups[k] ??= []).push(r);
    }
    return Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b)
      .map((k) => ({ count: k, recipes: groups[k] }));
  }, [info.world]);

  return (
    <View style={[styles.worldBody, { borderTopColor: info.border }]}>
      {/* Element badges */}
      <Text style={[styles.tapLabel, { color: info.badgeText }]}>Tap to learn</Text>
      <View style={styles.badgeRow}>
        {info.elements.map((el) => (
          <TouchableOpacity
            key={el}
            onPress={() => onTap(el)}
            activeOpacity={0.7}
            style={[styles.badge, { backgroundColor: info.badgeBg, borderColor: info.border }]}
          >
            <ElementIcon name={el} size={14} />
            <Text style={[styles.badgeText, { color: info.badgeText }]}>{el}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grouped recipes */}
      {recipes.map(({ count, recipes: rows }) => (
        <View key={count}>
          <GroupLabel count={count} />
          {rows.map((r) => (
            <RecipeRow key={r.name} name={r.name} ingredients={r.ingredients} onTap={onTap} />
          ))}
        </View>
      ))}
    </View>
  );
}

// ── World card background images (worlds 1-6) ────────────────────────────────
const WORLD_CARD_IMAGES: Record<number, ReturnType<typeof require>> = {
  1: require('../assets/images/world_1_card.jpg'),
  2: require('../assets/images/world_2_card.jpg'),
  3: require('../assets/images/world_3_card.jpg'),
  4: require('../assets/images/world_4_card.jpg'),
  5: require('../assets/images/world_5_card.jpg'),
  6: require('../assets/images/world_6_card.jpg'),
};

// ── World accordion card ──────────────────────────────────────────────────────
function WorldCard({
  info,
  isOpen,
  onToggle,
  onTap,
}: {
  info: WorldCatalogInfo;
  isOpen: boolean;
  onToggle: () => void;
  onTap: (n: string) => void;
}) {
  const recipeCount = useMemo(
    () => RECIPE_CATALOG.filter((r) => r.world === info.world).length,
    [info.world],
  );

  const cardImage = WORLD_CARD_IMAGES[info.world] ?? null;

  const header = cardImage ? (
    <ImageBackground
      source={cardImage}
      resizeMode="cover"
      style={styles.worldHeader}
    >
      <View style={styles.cardOverlay} />
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={styles.worldHeaderInner}>
        <LinearGradient colors={info.numberBg as [string, string]} style={styles.numBox}>
          <Text style={[styles.numText, { color: info.accent }]}>{info.world}</Text>
        </LinearGradient>
        <View style={styles.worldMeta}>
          <Text style={styles.worldName}>{info.name}</Text>
          <Text style={[styles.worldMetaLine, styles.worldMetaLineOnImg]}>
            {info.grid} grid · {recipeCount} combos
          </Text>
        </View>
        <Text style={[styles.chevron, { color: info.accent }]}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
    </ImageBackground>
  ) : (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={styles.worldHeader}>
      <LinearGradient colors={info.numberBg as [string, string]} style={styles.numBox}>
        <Text style={[styles.numText, { color: info.accent }]}>{info.world}</Text>
      </LinearGradient>
      <View style={styles.worldMeta}>
        <Text style={styles.worldName}>{info.name}</Text>
        <Text style={styles.worldMetaLine}>{info.grid} grid · {recipeCount} combos</Text>
      </View>
      <Text style={[styles.chevron, { color: info.accent }]}>{isOpen ? '▲' : '▼'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.worldCard, { borderColor: info.border }]}>
      {header}
      {isOpen && <WorldBody info={info} onTap={onTap} />}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const [openWorld, setOpenWorld] = useState(1);
  const [activeDef, setActiveDef] = useState<ActiveDef | null>(null);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const showDef = useCallback((name: string) => {
    const def = ELEMENT_DEFINITIONS[name];
    if (def) setActiveDef({ name, definition: def });
  }, []);

  const closeDef = useCallback(() => setActiveDef(null), []);

  const toggle = useCallback((w: number) => {
    setOpenWorld((prev) => (prev === w ? 0 : w));
  }, []);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recipe Catalog</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Accordion list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {WORLD_CATALOG.map((info) => (
          <WorldCard
            key={info.world}
            info={info}
            isOpen={openWorld === info.world}
            onToggle={() => toggle(info.world)}
            onTap={showDef}
          />
        ))}
      </ScrollView>

      <DefinitionPopup active={activeDef} onClose={closeDef} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0b0f1a' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#141d2e',
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#131c2e', borderRadius: 10,
  },
  backIcon:      { color: '#eef1f5', fontSize: 18, fontWeight: '700' },
  title:         { fontSize: 20, fontWeight: '700', color: '#eef1f5' },
  scroll:        { flex: 1 },
  scrollContent: { padding: 12, gap: 8 },

  // World card
  worldCard: {
    borderRadius: 14, borderWidth: 1,
    backgroundColor: '#0f1623',
    overflow: 'hidden',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,12,22,0.62)',
    borderRadius: 14,
  },
  worldMetaLineOnImg: { color: 'rgba(255,255,255,0.55)' },
  worldHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, gap: 12,
  },
  worldHeaderInner: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  numBox: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  numText:       { fontSize: 20, fontWeight: '800' },
  worldMeta:     { flex: 1 },
  worldName:     { fontSize: 14, fontWeight: '700', color: '#eef1f5', marginBottom: 2 },
  worldMetaLine: { fontSize: 11, color: '#64748b' },
  chevron:       { fontSize: 11, fontWeight: '700', flexShrink: 0 },

  // World body
  worldBody:     { borderTopWidth: 1, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 8 },
  tapLabel:      { fontSize: 10, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  badgeRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  badgeText:     { fontSize: 11, fontWeight: '700' },

  // Group label
  groupLabel: {
    fontSize: 9, fontWeight: '700', color: '#374151',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginTop: 12, marginBottom: 4, marginLeft: 2,
  },

  // Recipe row
  recipeRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#131d2d',
    gap: 6,
  },
  recipeLeft: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, minWidth: 110, maxWidth: 130,
  },
  recipeRowName: {
    fontSize: 13, fontWeight: '700', color: '#c9d4e8',
    flexShrink: 1,
  },
  equals:        { fontSize: 11, color: '#374151', marginTop: 5, flexShrink: 0 },
  recipeRight: {
    flex: 1, flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center', gap: 4,
  },
  ingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#131d2d', borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 3,
  },
  ingName:       { fontSize: 10, color: '#4b6080', fontWeight: '600', maxWidth: 64 },
  plus:          { fontSize: 10, color: '#263145', fontWeight: '700' },

  // Popup
  dimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 28,
    alignItems: 'center',
  },
  sheet: {
    width: '100%', maxWidth: 448,
    backgroundColor: '#0f1623',
    borderRadius: 16, borderWidth: 1, borderColor: '#1e2d45',
    padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55, shadowRadius: 22, elevation: 22,
  },
  defIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,106,0,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  defTextBlock:  { flex: 1 },
  defName:       { fontSize: 14, fontWeight: '700', color: '#eef1f5', marginBottom: 4 },
  defDesc:       { fontSize: 13, color: '#8e9ab0', lineHeight: 19 },
  defClose: {
    width: 26, height: 26, borderRadius: 99,
    backgroundColor: '#1a2436',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  defCloseIcon:  { color: '#64748b', fontSize: 12, fontWeight: '700' },
});
