import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Pressable from '../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { useT } from '../hooks/useT';

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
            <ElementIcon name={active?.name ?? ''} size={36} />
          </View>
          <View style={styles.defTextBlock}>
            <Text style={styles.defName}>{active?.name}</Text>
            <Text style={styles.defDesc}>{active?.definition}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.defClose} hitSlop={8}>
            <Text style={styles.defCloseIcon}>✕</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
});

// ── Recipe group section label ────────────────────────────────────────────────
function GroupLabel({ count }: { count: number }) {
  const t = useT();
  return (
    <Text style={styles.groupLabel}>
      {t('nElementCombos', { n: count })}
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
      <Pressable
        onPress={() => onTap(name)}
        style={styles.recipeLeft}
        activeOpacity={0.7}
      >
        <ElementIcon name={name} size={24} />
        <Text style={styles.recipeRowName} numberOfLines={1}>{name}</Text>
      </Pressable>

      {/* Equals */}
      <Text style={styles.equals}>=</Text>

      {/* Right: ingredient pills */}
      <View style={styles.recipeRight}>
        {ingredients.map((ing, i) => (
          <React.Fragment key={ing + i}>
            {i > 0 && <Text style={styles.plus}>+</Text>}
            <Pressable
              onPress={() => onTap(ing)}
              style={styles.ingPill}
              activeOpacity={0.7}
            >
              <ElementIcon name={ing} size={16} />
              <Text style={styles.ingName} numberOfLines={1}>{ing}</Text>
            </Pressable>
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
  const t = useT();
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
      <Text style={[styles.tapLabel, { color: info.badgeText }]}>{t('tapToLearn')}</Text>
      <View style={styles.badgeRow}>
        {info.elements.map((el) => (
          <Pressable
            key={el}
            onPress={() => onTap(el)}
            activeOpacity={0.7}
            style={[styles.badge, { backgroundColor: info.badgeBg, borderColor: info.border }]}
          >
            <ElementIcon name={el} size={14} />
            <Text style={[styles.badgeText, { color: info.badgeText }]}>{el}</Text>
          </Pressable>
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

// ── World card background images (worlds 1-8) ────────────────────────────────
const WORLD_CARD_IMAGES: Record<number, ReturnType<typeof require>> = {
  1: require('../assets/images/world_1_card.jpg'),
  2: require('../assets/images/world_2_card.jpg'),
  3: require('../assets/images/world_3_card.jpg'),
  4: require('../assets/images/world_4_card.jpg'),
  5: require('../assets/images/world_5_card.jpg'),
  6: require('../assets/images/world_6_card.jpg'),
  7: require('../assets/images/world_7_card.jpg'),
  8: require('../assets/images/world_8_card.jpg'),
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
  const t = useT();
  const isComingSoon = info.world >= 5;
  const recipeCount = useMemo(
    () => RECIPE_CATALOG.filter((r) => r.world === info.world).length,
    [info.world],
  );

  const cardImage = WORLD_CARD_IMAGES[info.world] ?? null;

  const header = cardImage ? (
    <Pressable
      onPress={isComingSoon ? undefined : onToggle}
      activeOpacity={isComingSoon ? 1 : 0.88}
      style={styles.worldHeaderImg}
    >
      <ImageBackground
        source={cardImage}
        resizeMode="stretch"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(6,9,18,0.92)']}
        style={styles.imgGradient}
      />
      <View style={styles.worldHeaderImgContent}>
        <View style={styles.numBoxWrapper}>
          <LinearGradient colors={info.numberBg as [string, string]} style={styles.numBox}>
            <Text style={[styles.numText, { color: info.accent }]}>{info.world}</Text>
          </LinearGradient>
        </View>
        <View style={styles.worldMetaOnImg}>
          <Text style={styles.worldName}>{info.name}</Text>
          <Text style={[styles.worldMetaLine, styles.worldMetaLineOnImg]}>
            {t('gridCombos', { grid: info.grid, n: recipeCount })}
          </Text>
        </View>
        <View style={styles.chevronPill}>
          {isComingSoon ? (
            <Text style={styles.comingSoonChevron}>🔒</Text>
          ) : (
            <Text style={[styles.chevron, { color: info.accent }]}>{isOpen ? '▲' : '▼'}</Text>
          )}
        </View>
      </View>
      {/* Coming soon overlay */}
      {isComingSoon && (
        <View style={[StyleSheet.absoluteFill, styles.comingSoonOverlay]} pointerEvents="none">
          <Text style={styles.comingSoonLabel}>{t('comingSoon')}</Text>
        </View>
      )}
    </Pressable>
  ) : (
    <Pressable
      onPress={isComingSoon ? undefined : onToggle}
      activeOpacity={isComingSoon ? 1 : 0.8}
      style={styles.worldHeader}
    >
      <LinearGradient colors={info.numberBg as [string, string]} style={styles.numBox}>
        <Text style={[styles.numText, { color: info.accent }]}>{info.world}</Text>
      </LinearGradient>
      <View style={styles.worldMeta}>
        <Text style={styles.worldName}>{info.name}</Text>
        <Text style={styles.worldMetaLine}>{t('gridCombos', { grid: info.grid, n: recipeCount })}</Text>
      </View>
      {isComingSoon ? (
        <Text style={styles.comingSoonInline}>🔒 {t('comingSoon')}</Text>
      ) : (
        <Text style={[styles.chevron, { color: info.accent }]}>{isOpen ? '▲' : '▼'}</Text>
      )}
    </Pressable>
  );

  return (
    <View style={[styles.worldCard, { borderColor: info.border }]}>
      {header}
      {isOpen && !isComingSoon && <WorldBody info={info} onTap={onTap} />}
    </View>
  );
}

// ── Info Tooltip ─────────────────────────────────────────────────────────────
const InfoTooltip = React.memo(function InfoTooltip({
  visible,
  onDismiss,
}: { visible: boolean; onDismiss: () => void }) {
  const t = useT();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-6);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      opacity.value    = withSpring(1, { damping: 22, stiffness: 320 });
      translateY.value = withSpring(0, { damping: 22, stiffness: 320 });
    } else {
      opacity.value    = withTiming(0, { duration: 140 });
      translateY.value = withTiming(-6, { duration: 140 }, (done) => {
        if (done) runOnJS(setRendered)(false);
      });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!rendered && !visible) return null;

  return (
    <>
      {/* Full-screen dismiss layer — catches taps outside tooltip */}
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>
      {/* Tooltip — tapping it also dismisses */}
      <Animated.View style={[styles.infoTooltip, animStyle]}>
        <TouchableWithoutFeedback onPress={onDismiss}>
          <View>
            <View style={styles.infoTooltipCaret} />
            <Text style={styles.infoTooltipText}>
              {t('catalogTooltip')}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const [openWorld, setOpenWorld] = useState(1);
  const [activeDef, setActiveDef] = useState<ActiveDef | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
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
        {/* Left group: back + info */}
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Pressable
            onPress={() => setInfoVisible((v) => !v)}
            style={styles.infoBtn}
            hitSlop={8}
          >
            <Text style={styles.infoBtnText}>i</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>{t('recipeCatalog')}</Text>
        <View style={{ width: 72 }} />
      </View>

      {/* Info tooltip (positioned below header) */}
      <InfoTooltip visible={infoVisible} onDismiss={() => setInfoVisible(false)} />

      {/* Accordion list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setInfoVisible(false)}
        onMomentumScrollBegin={() => setInfoVisible(false)}
        scrollEventThrottle={16}
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
  root:          { flex: 1, backgroundColor: 'transparent' },
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
  headerLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  infoBtn: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: '#f5a623',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#f5a623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 4,
  },
  infoBtnText: {
    color: '#1a1000',
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  infoTooltip: {
    position: 'absolute',
    top: 82,
    left: 16,
    right: 16,
    backgroundColor: '#f5a623',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  infoTooltipCaret: {
    position: 'absolute',
    top: -7,
    left: 46,
    width: 14,
    height: 14,
    backgroundColor: '#f5a623',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  infoTooltipText: {
    color: '#1a1000',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  title:         { fontSize: 20, fontWeight: '700', color: '#eef1f5' },
  scroll:        { flex: 1 },
  scrollContent: { padding: 12, gap: 8 },

  // World card
  worldCard: {
    borderRadius: 14, borderWidth: 1,
    backgroundColor: '#0f1623',
    overflow: 'hidden',
  },
  worldMetaLineOnImg: { color: 'rgba(255,255,255,0.65)' },
  worldHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, gap: 12,
  },
  // Image-backed world card header
  worldHeaderImg: {
    height: 120,
    overflow: 'hidden',
  },
  imgGradient: {
    ...StyleSheet.absoluteFillObject,
    // gradient is applied via colors prop (transparent → dark)
  },
  worldHeaderImgContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 12, paddingTop: 28,
    gap: 12,
  },
  numBoxWrapper: {
    opacity: 0.72,
    flexShrink: 0,
  },
  worldMetaOnImg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  chevronPill: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 4,
    flexShrink: 0,
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

  comingSoonOverlay: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonLabel: {
    color: '#ff8c00',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  comingSoonChevron: {
    fontSize: 14,
  },
  comingSoonInline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ff8c00',
    letterSpacing: 0.5,
  },
});
