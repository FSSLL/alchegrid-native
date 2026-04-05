import React, {
import Pressable from '../components/Pressable';
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import GameCell from '../components/GameCell';
import GridLines from '../components/GridLines';
import ZoneBorders from '../components/ZoneBorders';
import ElementPalette from '../components/ElementPalette';
import ZoneTooltip from '../components/ZoneTooltip';
import ElementIcon from '../components/ElementIcon';
import { DragProvider, useDrag } from '../contexts/DragContext';
import { GRID_BACKGROUNDS } from '../constants/assets';
import type { Level } from '../lib/types';
import { computeGridLayout } from '../lib/gridLayout';

// ─── Tutorial practice level ──────────────────────────────────────────────────
const TUTORIAL_LEVEL: Level = {
  id: 'tutorial-practice',
  worldId: 'tutorial',
  size: 4,
  elements: ['Wind', 'Earth', 'Fire', 'Water'],
  starThresholds: { three: 120, two: 240 },
  canonicalSolution: [
    ['Fire', 'Earth', 'Wind', 'Water'],
    ['Earth', 'Fire', 'Water', 'Wind'],
    ['Wind', 'Water', 'Earth', 'Fire'],
    ['Water', 'Wind', 'Fire', 'Earth'],
  ],
  zones: [
    { id: 'tz1', recipeName: 'Lava',  ingredients: ['Earth', 'Fire'],          cells: [{ row: 1, col: 0 }, { row: 1, col: 1 }] },
    { id: 'tz2', recipeName: 'Ice',   ingredients: ['Water', 'Wind'],          cells: [{ row: 0, col: 3 }, { row: 1, col: 3 }] },
    { id: 'tz3', recipeName: 'Dust',  ingredients: ['Earth', 'Wind'],          cells: [{ row: 0, col: 1 }, { row: 0, col: 2 }] },
    { id: 'tz4', recipeName: 'Fire',  ingredients: ['Fire'],                   cells: [{ row: 0, col: 0 }] },
    { id: 'tz5', recipeName: 'Clay',  ingredients: ['Water', 'Earth', 'Fire'], cells: [{ row: 1, col: 2 }, { row: 2, col: 2 }, { row: 3, col: 2 }] },
    { id: 'tz6', recipeName: 'Ice',   ingredients: ['Wind', 'Water'],          cells: [{ row: 3, col: 0 }, { row: 3, col: 1 }] },
    { id: 'tz7', recipeName: 'Lava',  ingredients: ['Earth', 'Fire'],          cells: [{ row: 2, col: 3 }, { row: 3, col: 3 }] },
    { id: 'tz8', recipeName: 'Ice',   ingredients: ['Water', 'Wind'],          cells: [{ row: 2, col: 0 }, { row: 2, col: 1 }] },
  ],
};

// ─── Slide definitions (content as render functions to avoid hoisting issues) ──
const SLIDES: { id: string; title: string; renderContent: () => React.ReactElement }[] = [
  { id: 'welcome',     title: 'Welcome to Alchegrid!',    renderContent: () => <SlideWelcome /> },
  { id: 'elements',    title: 'Meet the Elements',        renderContent: () => <SlideElements /> },
  { id: 'combinations',title: 'Element Combinations',     renderContent: () => <SlideCombinations /> },
  { id: 'zones',       title: 'Zones & Recipes',          renderContent: () => <SlideZones /> },
  { id: 'single-cell', title: 'Single-Cell Zones',        renderContent: () => <SlideSingleCell /> },
  { id: 'tips',        title: 'Tips & Scoring',           renderContent: () => <SlideTips /> },
];

// ─── Slide content components ─────────────────────────────────────────────────
function SlideWelcome() {
  return (
    <View style={ss.slideInner}>
      <Text style={ss.slideBody}>
        Alchegrid combines{' '}
        <Text style={ss.amber}>elemental alchemy</Text>
        {' '}with grid-based logic.
      </Text>
      <Text style={[ss.slideBody, { marginTop: 6, color: 'rgba(255,255,255,0.6)' }]}>
        Fill every cell following two rules:
      </Text>
      <View style={{ gap: 10, marginTop: 12 }}>
        <View style={ss.ruleCard}>
          <Text style={ss.ruleNum}>1</Text>
          <Text style={ss.ruleText}>
            No element can repeat in any row or column — like Sudoku.
          </Text>
        </View>
        <View style={ss.ruleCard}>
          <Text style={ss.ruleNum}>2</Text>
          <Text style={ss.ruleText}>
            Each zone on the board requires a specific combination of elements.
          </Text>
        </View>
      </View>
    </View>
  );
}

function SlideElements() {
  const elements = [
    { name: 'Wind',  color: '#7dd3fc' },
    { name: 'Earth', color: '#92400e' },
    { name: 'Fire',  color: '#fb923c' },
    { name: 'Water', color: '#60a5fa' },
  ];
  return (
    <View style={ss.slideInner}>
      <Text style={ss.slideBody}>
        In <Text style={{ color: '#34d399', fontWeight: '700' }}>Nature Lab</Text>, you work with four base elements:
      </Text>
      <View style={ss.elemGrid}>
        {elements.map(({ name, color }) => (
          <View key={name} style={ss.elemCard}>
            <ElementIcon name={name} size={48} />
            <Text style={[ss.elemLabel, { color }]}>{name}</Text>
          </View>
        ))}
      </View>
      <Text style={[ss.slideBody, { color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 11 }]}>
        Drag these from the inventory onto the board.
      </Text>
    </View>
  );
}

function SlideCombinations() {
  const combos = [
    { result: 'Steam',     ingredients: ['Fire', 'Water'] },
    { result: 'Mud',       ingredients: ['Earth', 'Water'] },
    { result: 'Dust',      ingredients: ['Wind', 'Earth'] },
    { result: 'Lava',      ingredients: ['Earth', 'Fire'] },
    { result: 'Ice',       ingredients: ['Wind', 'Water'] },
    { result: 'Lightning', ingredients: ['Wind', 'Fire'] },
  ];
  return (
    <View style={ss.slideInner}>
      <Text style={ss.slideBody}>
        Elements inside a <Text style={ss.amber}>zone</Text> combine to create new elements!
      </Text>
      <View style={{ gap: 6, marginTop: 10 }}>
        {combos.map(({ result, ingredients }) => (
          <View key={result} style={ss.comboRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {ingredients.map((ing, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  {i > 0 && <Text style={ss.dimText}>+</Text>}
                  <ElementIcon name={ing} size={26} />
                </View>
              ))}
            </View>
            <Text style={ss.dimText}>=</Text>
            <ElementIcon name={result} size={26} />
            <Text style={ss.comboLabel}>{result}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SlideZones() {
  return (
    <View style={ss.slideInner}>
      <Text style={ss.slideBody}>
        The board is divided into <Text style={ss.amber}>zones</Text> — groups of cells outlined by green borders.
      </Text>
      <View style={ss.infoBox}>
        <Text style={ss.infoText}>
          Each zone has a <Text style={{ color: '#34d399', fontWeight: '700' }}>recipe</Text> — the combination it needs you to create.
        </Text>
        <Text style={[ss.infoText, { marginTop: 8 }]}>
          Tap any cell to see the zone's tooltip, showing what combination is required.
        </Text>
        <View style={ss.exampleRow}>
          <ElementIcon name="Fire"  size={30} />
          <Text style={ss.dimText}>+</Text>
          <ElementIcon name="Water" size={30} />
          <Text style={ss.dimText}>=</Text>
          <ElementIcon name="Steam" size={30} />
          <Text style={ss.comboLabel}>Steam</Text>
        </View>
      </View>
      <Text style={[ss.slideBody, { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }]}>
        Place the right elements in the zone's cells to satisfy the recipe.
      </Text>
    </View>
  );
}

function SlideSingleCell() {
  return (
    <View style={ss.slideInner}>
      <Text style={ss.slideBody}>
        Some zones contain only <Text style={ss.amber}>one cell</Text>. These require exactly one specific element.
      </Text>
      <View style={ss.infoBox}>
        <Text style={ss.infoText}>
          You can identify them by their{' '}
          <Text style={{ color: '#fff', fontWeight: '700' }}>black &amp; white ghost icon</Text>.
        </Text>
        <View style={{ flexDirection: 'row', gap: 28, justifyContent: 'center', marginTop: 14 }}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View style={ss.ghostBox}>
              <ElementIcon name="Fire" size={44} opacity={0.4} />
            </View>
            <Text style={ss.ghostLabel}>Single-cell</Text>
            <Text style={[ss.ghostLabel, { color: 'rgba(255,255,255,0.35)', fontSize: 9 }]}>(B&W ghost)</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View style={ss.ghostBox}>
              <ElementIcon name="Fire" size={44} opacity={0.7} />
            </View>
            <Text style={ss.ghostLabel}>Multi-cell</Text>
            <Text style={[ss.ghostLabel, { color: 'rgba(255,255,255,0.35)', fontSize: 9 }]}>(Colored ghost)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function SlideTips() {
  const tips = [
    { icon: '⭐', text: 'Complete levels faster for more stars (up to 3 per level).' },
    { icon: '💡', text: 'Use hints when stuck — they reveal the correct element for a cell.' },
    { icon: '🪙', text: 'Earn coins by completing levels. Spend them on extra hints.' },
    { icon: '🔵', text: 'Hinted cells have a blue border — they\'re locked in and always correct.' },
    { icon: '🔴', text: 'Red highlights mean a conflict — no duplicates allowed in any row or column.' },
  ];
  return (
    <View style={ss.slideInner}>
      <Text style={ss.slideBody}>A few more things to help you succeed:</Text>
      <View style={{ gap: 8, marginTop: 10 }}>
        {tips.map(({ icon, text }) => (
          <View key={icon} style={ss.tipRow}>
            <Text style={{ fontSize: 18 }}>{icon}</Text>
            <Text style={ss.tipText}>{text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Practice tips ────────────────────────────────────────────────────────────
type TipPosition =
  | 'above-inventory'
  | 'above-board'
  | 'below-board'
  | 'below-board-arrow-up'
  | 'over-board-topleft'
  | 'over-board'
  | 'over-board-top'
  | 'none';

type TipStep = { id: string; title: string; text: string; action: string; position: TipPosition };

const PRACTICE_TIPS: TipStep[] = [
  { id: 'drag-element', title: 'Place an Element',      text: 'Drag an element from the inventory and drop it onto a cell on the board.',             action: 'Drag an element onto a cell',        position: 'above-inventory' },
  { id: 'tap-cell',     title: 'Check a Zone',          text: 'Tap any cell to see which combination its zone requires.',                               action: 'Tap a cell on the board',            position: 'above-board' },
  { id: 'read-tooltip', title: 'Zone Tooltip',          text: 'The tooltip shows the recipe and ingredients. Tap another cell to compare.',             action: 'Tap a different cell',               position: 'below-board' },
  { id: 'single-cell',  title: 'Single-Cell Zone',      text: 'See the ghost icon at the top-left? Drag Fire from the inventory and drop it on that cell!', action: 'Drag Fire to the top-left cell',  position: 'over-board-topleft' },
  { id: 'multi-cell',   title: 'Multi-Cell Zones',      text: 'Colored ghost icons show multi-cell zones. Drag an element from inventory into one now.',   action: 'Drag an element into a multi-cell zone', position: 'over-board' },
  { id: 'conflicts',    title: 'Watch for Conflicts!',  text: 'Same element twice in a row or column? Those cells turn red! Tap anywhere to continue.', action: 'Tap anywhere to dismiss',            position: 'below-board-arrow-up' },
  { id: 'go',           title: "You're Ready!",         text: 'The timer is running — finish faster for more stars! Complete the puzzle on your own.',   action: '',                                   position: 'over-board-top' },
];

// ─── Bouncing arrow ───────────────────────────────────────────────────────────
function BouncingArrow({ direction, color = '#fbbf24' }: { direction: 'up' | 'down'; color?: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: direction === 'down' ? [0, 8] : [0, -8],
  });
  const arrow = direction === 'down' ? '↓' : '↑';
  return (
    <Animated.Text style={[ss.bouncingArrow, { color, transform: [{ translateY }] }]}>
      {arrow}
    </Animated.Text>
  );
}

// ─── Floating tip card ────────────────────────────────────────────────────────
function FloatingTipCard({ tip, tipIndex, total }: { tip: TipStep; tipIndex: number; total: number }) {
  return (
    <View style={ss.tipCard}>
      <Text style={ss.tipCardTitle}>{tip.title}</Text>
      <Text style={ss.tipCardText}>{tip.text}</Text>
      {!!tip.action && (
        <View style={ss.tipActionRow}>
          <View style={ss.tipDot} />
          <Text style={ss.tipActionText}>{tip.action}</Text>
        </View>
      )}
      <Text style={ss.tipCounter}>{tipIndex + 1} / {total}</Text>
    </View>
  );
}

// ─── Tip overlay — floats above ALL content ───────────────────────────────────
const TIP_TOP: Record<TipPosition, string> = {
  'above-board':          '4%',
  'over-board-top':       '4%',
  'over-board-topleft':   '26%',
  'over-board':           '30%',
  'below-board':          '54%',
  'below-board-arrow-up': '50%',
  'above-inventory':      '54%',
};
function TipOverlay({ tip, tipIndex, total }: { tip: TipStep; tipIndex: number; total: number }) {
  const arrowDown = ['above-board', 'over-board-top', 'above-inventory'].includes(tip.position);
  const arrowUp   = tip.position === 'below-board-arrow-up';
  return (
    <View
      style={{ position: 'absolute', top: TIP_TOP[tip.position] ?? '30%', left: 16, right: 16, zIndex: 300, alignItems: 'center', pointerEvents: 'box-none' }}
    >
      {arrowUp   && <BouncingArrow direction="up" />}
      <FloatingTipCard tip={tip} tipIndex={tipIndex} total={total} />
      {arrowDown && <BouncingArrow direction="down" />}
    </View>
  );
}

// ─── Practice board (inner content that can call useDrag) ─────────────────────
function PracticeBoardContent({ onComplete }: { onComplete: () => void }) {
  const { width: sw } = useWindowDimensions();
  const { cellSize: CELL_SIZE, gap: GRID_GAP } = computeGridLayout(4, sw);

  const {
    level, board, hintedCells, status, conflicts, selectedZone, elapsedTime, stars,
    initGame, placeSpecificElement, clearCell, setSelectedZone, removeElement, stopTimer,
  } = useGameStore();

  const { registerGrid, setDropHandlers } = useDrag();
  const gridViewRef = useRef<View>(null);

  const [tipIndex,          setTipIndex]          = useState(0);
  const [tipsComplete,      setTipsComplete]      = useState(false);
  const [tappedCells,       setTappedCells]       = useState(0);
  const [topleftPlaced,     setTopleftPlaced]     = useState(false);
  const [multizonePlaced,   setMultizonePlaced]   = useState(false);
  const [conflictDemoShown, setConflictDemoShown] = useState(false);
  const [hasPlaced,         setHasPlaced]         = useState(false);
  const [showWin,           setShowWin]           = useState(false);
  const [paletteH,          setPaletteH]          = useState(100);

  // Init the tutorial board once
  useEffect(() => {
    initGame(TUTORIAL_LEVEL);
  }, []);

  // Show win overlay when game is won
  useEffect(() => {
    if (status === 'won') setShowWin(true);
  }, [status]);

  // Wire up drop handlers
  useEffect(() => {
    setDropHandlers(
      (element, row, col) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        placeSpecificElement(element, row, col);
        trackPlacement(element, row, col);
        if (level) {
          const zone = level.zones.find((z) => z.cells.some((c) => c.row === row && c.col === col));
          setSelectedZone(zone ?? null);
        }
      },
      (row, col) => clearCell(row, col),
    );
  }, [setDropHandlers, placeSpecificElement, clearCell, level, setSelectedZone]);

  // Measure grid for drop zone
  const handleGridLayout = () => {
    gridViewRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      registerGrid({ pageX, pageY, cellSize: CELL_SIZE, gap: GRID_GAP, gridN: 4 });
    });
  };

  function trackPlacement(element: string, row: number, col: number) {
    setHasPlaced(true);
    if (row === 0 && col === 0 && element === 'Fire') setTopleftPlaced(true);
    const zone = TUTORIAL_LEVEL.zones.find((z) => z.cells.some((c) => c.row === row && c.col === col));
    if (zone && zone.cells.length > 1) setMultizonePlaced(true);
  }

  // Cell tap only shows zone tooltip — placement is drag-only
  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (level) {
        const zone = level.zones.find((z) => z.cells.some((c) => c.row === row && c.col === col));
        setSelectedZone(zone ?? null);
      }
      setTappedCells((p) => p + 1);
    },
    [level, setSelectedZone],
  );

  // Conflict demo: tip step 5 (index 5)
  useEffect(() => {
    if (tipIndex === 5 && !conflictDemoShown) {
      setConflictDemoShown(true);
      const b = useGameStore.getState().board;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (b[r][c]) removeElement(r, c);
      setTimeout(() => {
        placeSpecificElement('Fire', 0, 0);
        placeSpecificElement('Fire', 0, 1);
        setActiveElement(null);
      }, 150);
    }
  }, [tipIndex, conflictDemoShown]);

  // Auto-advance tips
  useEffect(() => {
    if (tipsComplete) return;
    const tip = PRACTICE_TIPS[tipIndex];
    if (!tip) return;
    let shouldAdvance = false;
    switch (tip.id) {
      case 'drag-element': shouldAdvance = hasPlaced;           break;
      case 'tap-cell':     shouldAdvance = tappedCells >= 1;   break;
      case 'read-tooltip': shouldAdvance = tappedCells >= 2;   break;
      case 'single-cell':  shouldAdvance = topleftPlaced;      break;
      case 'multi-cell':   shouldAdvance = multizonePlaced;    break;
    }
    if (shouldAdvance) {
      if (tipIndex < PRACTICE_TIPS.length - 1) setTipIndex((p) => p + 1);
      else setTipsComplete(true);
    }
  }, [hasPlaced, tappedCells, topleftPlaced, multizonePlaced, tipIndex, tipsComplete]);

  // "You're Ready!" auto-disappears after 4s
  useEffect(() => {
    if (PRACTICE_TIPS[tipIndex]?.id === 'go' && !tipsComplete) {
      const t = setTimeout(() => setTipsComplete(true), 4000);
      return () => clearTimeout(t);
    }
  }, [tipIndex, tipsComplete]);

  const currentTip = !tipsComplete ? PRACTICE_TIPS[tipIndex] : null;

  const handleConflictDismiss = () => {
    if (tipIndex === 5 && conflictDemoShown) {
      removeElement(0, 0);
      removeElement(0, 1);
      if (tipIndex < PRACTICE_TIPS.length - 1) setTipIndex((p) => p + 1);
      else setTipsComplete(true);
    }
  };

  const handleRetry = () => {
    initGame(TUTORIAL_LEVEL);
    setTipIndex(0); setTipsComplete(false); setTappedCells(0);
    setTopleftPlaced(false); setMultizonePlaced(false);
    setConflictDemoShown(false); setHasPlaced(false); setShowWin(false);
  };

  const conflictSet = useMemo(
    () => new Set(conflicts.map((c) => `${c.row},${c.col}`)),
    [conflicts],
  );

  const cellGhostInfo = useMemo(() => {
    const map: Record<string, { element: string; opacity: number; grayscale: boolean }> = {};
    TUTORIAL_LEVEL.zones.forEach((zone) => {
      if (!zone.recipeName) return;
      const opacity = zone.cells.length === 1 ? 0.45 : 0.70;
      const grayscale = zone.cells.length === 1;
      zone.cells.forEach(({ row, col }) => {
        map[`${row},${col}`] = { element: zone.recipeName!, opacity, grayscale };
      });
    });
    return map;
  }, []);

  const totalGridSize = 4 * CELL_SIZE + 3 * GRID_GAP;

  // Ensure the grid always renders 4×4 even before initGame fires
  const safeBoard: (string | null)[][] = board.length === 4
    ? board
    : Array.from({ length: 4 }, () => Array(4).fill(null));

  return (
    <View
      style={{ flex: 1 }}
      onTouchEnd={() => {
        setTappedCells((p) => p + 1);
        if (tipIndex === 5 && conflictDemoShown) handleConflictDismiss();
      }}
    >
      {/* ── Grid — centered, static ── */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          ref={gridViewRef}
          onLayout={handleGridLayout}
          style={{ width: totalGridSize, height: totalGridSize, position: 'relative' }}
        >
          {/* Grid background */}
          <Image
            source={GRID_BACKGROUNDS[4]}
            style={{ position: 'absolute', width: totalGridSize, height: totalGridSize }}
            resizeMode="cover"
          />
          {/* Cell separator lines */}
          <GridLines gridSize={4} cellSize={CELL_SIZE} gap={GRID_GAP} totalGridPx={totalGridSize} />
          {/* Cells */}
          {safeBoard.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r},${c}`;
              const ghost = cellGhostInfo[key];
              const inSelZone = selectedZone?.cells.some((sc) => sc.row === r && sc.col === c) ?? false;
              return (
                <View
                  key={key}
                  style={{
                    position: 'absolute',
                    left: c * (CELL_SIZE + GRID_GAP),
                    top: r * (CELL_SIZE + GRID_GAP),
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                >
                  <GameCell
                    row={r}
                    col={c}
                    element={cell}
                    cellSize={CELL_SIZE}
                    isConflict={conflictSet.has(key)}
                    isHinted={!!hintedCells[key]}
                    ghostElement={ghost?.element ?? null}
                    onPress={handleCellPress}
                  />
                </View>
              );
            }),
          )}
          <ZoneBorders
            zones={TUTORIAL_LEVEL.zones}
            size={4}
            cellSize={CELL_SIZE}
            gap={GRID_GAP}
            selectedZone={selectedZone}
          />
        </View>
      </View>

      {/* ── Palette — always at bottom, measured ── */}
      <View
        style={{ paddingHorizontal: 12, paddingBottom: 12 }}
        onLayout={(e) => setPaletteH(e.nativeEvent.layout.height)}
      >
        <ElementPalette level={level ?? TUTORIAL_LEVEL} board={safeBoard} />
      </View>

      {/* ── Zone tooltip — absolute above palette ── */}
      {selectedZone && (
        <View
          style={{ position: 'absolute', bottom: paletteH + 8, left: 12, right: 12, zIndex: 200, pointerEvents: 'box-none' }}
        >
          <ZoneTooltip zone={selectedZone} board={safeBoard} onClose={() => setSelectedZone(null)} />
        </View>
      )}

      {/* ── Tip overlay — floats above everything ── */}
      {currentTip && (
        <TipOverlay tip={currentTip} tipIndex={tipIndex} total={PRACTICE_TIPS.length} />
      )}

      {/* ── Win overlay ── */}
      {showWin && (
        <View style={ss.winOverlay}>
          <View style={ss.winCard}>
            <Text style={ss.winTitle}>Tutorial Complete!</Text>
            <Text style={ss.winSub}>Great job! You've mastered the basics.</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 16 }}>
              {[1, 2, 3].map((s) => {
                const active =
                  s === 1 ||
                  (s === 2 && elapsedTime <= 240) ||
                  (s === 3 && elapsedTime <= 120);
                return (
                  <Text key={s} style={[ss.winStar, { color: active ? '#fbbf24' : 'rgba(255,255,255,0.15)' }]}>
                    ★
                  </Text>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Pressable style={[ss.winBtn, ss.winBtnOutline]} onPress={handleRetry}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Try Again</Text>
              </Pressable>
              <Pressable style={[ss.winBtn, ss.winBtnPrimary]} onPress={onComplete}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function PracticeBoard({ onComplete }: { onComplete: () => void }) {
  return (
    <DragProvider>
      <PracticeBoardContent onComplete={onComplete} />
    </DragProvider>
  );
}

// ─── Main Tutorial screen ─────────────────────────────────────────────────────
export default function TutorialScreen() {
  const insets = useSafeAreaInsets();
  const { width: sw } = useWindowDimensions();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [step, setStep] = useState(0);
  const [showPracticeToast, setShowPracticeToast] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const TOTAL_STEPS = SLIDES.length + 1; // 6 slides + 1 practice
  const isSlide    = step < SLIDES.length;
  const isPractice = step === SLIDES.length;

  const goTo = (next: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    });
  };

  const handleLetsPractice = () => {
    if (!isPractice && step < SLIDES.length - 1) {
      setShowPracticeToast(true);
      setTimeout(() => setShowPracticeToast(false), 2500);
    } else {
      goTo(SLIDES.length);
    }
  };

  return (
    <View style={[ss.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={ss.header}>
        <Pressable
          onPress={() => {
            if (isPractice) goTo(SLIDES.length - 1);
            else if (step > 0) goTo(step - 1);
            else router.back();
          }}
          style={ss.headerBtn}
        >
          <Text style={ss.headerBtnText}>←</Text>
        </Pressable>
        <Text style={ss.headerTitle}>{isPractice ? 'Practice Level' : 'Tutorial'}</Text>
        <Pressable
          onPress={() => isPractice ? router.replace('/') : goTo(SLIDES.length)}
          style={ss.headerBtn}
        >
          <Text style={[ss.headerBtnText, { fontSize: 13, fontWeight: '600' }]}>Skip</Text>
        </Pressable>
      </View>

      {/* Slides phase */}
      {isSlide && (
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          <ScrollView contentContainerStyle={ss.slidesScroll} showsVerticalScrollIndicator={false}>
            <Text style={ss.slideTitle}>{SLIDES[step].title}</Text>
            {SLIDES[step].renderContent()}

            {/* Progress dots */}
            <View style={ss.dots}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <View
                  key={i}
                  style={[ss.dot, i === step ? ss.dotActive : ss.dotInactive]}
                />
              ))}
            </View>

            {/* Nav buttons */}
            <View style={ss.navRow}>
              {step > 0 && (
                <Pressable style={ss.navBtn} onPress={() => goTo(step - 1)}>
                  <Text style={ss.navBtnText}>← Back</Text>
                </Pressable>
              )}
              <Pressable
                style={[ss.navBtn, { flex: 2, backgroundColor: 'rgba(255,255,255,0.12)' }]}
                onPress={() => goTo(step + 1)}
              >
                <Text style={ss.navBtnText}>
                  {step === SLIDES.length - 1 ? 'Start Practice →' : 'Next →'}
                </Text>
              </Pressable>
            </View>

            {/* "Let's Practice!" shortcut */}
            <Pressable style={ss.practiceBtn} onPress={handleLetsPractice}>
              <Text style={ss.practiceBtnText}>🎮  Let's Practice!</Text>
            </Pressable>

            <View style={{ height: insets.bottom + 16 }} />
          </ScrollView>
        </Animated.View>
      )}

      {/* Practice phase */}
      {isPractice && (
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          <Text style={ss.practiceSubtitle}>
            Try solving this level using everything you've learned!
          </Text>
          <View style={{ flex: 1 }}>
            <PracticeBoard onComplete={() => router.replace('/')} />
          </View>
        </Animated.View>
      )}

      {/* Toast: finish slides first */}
      {showPracticeToast && (
        <View style={ss.toast}>
          <Text style={ss.toastText}>Finish the slides first! Practice is on the last page.</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  container:         { flex: 1, backgroundColor: 'transparent' },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  headerBtn:         { minWidth: 40, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 8 },
  headerBtnText:     { color: '#eef1f5', fontSize: 18, fontWeight: '600' },
  headerTitle:       { fontSize: 18, fontWeight: '800', color: '#eef1f5' },

  slidesScroll:      { paddingHorizontal: 20, paddingTop: 16, alignItems: 'center' },
  slideTitle:        { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16, textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  slideInner:        { width: '100%', alignItems: 'center' },
  slideBody:         { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  amber:             { color: '#fbbf24', fontWeight: '700' },

  ruleCard:          { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, width: '100%' },
  ruleNum:           { color: '#fbbf24', fontWeight: '800', fontSize: 18, marginTop: -2 },
  ruleText:          { color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1, lineHeight: 19 },

  elemGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 12, maxWidth: 260 },
  elemCard:          { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, alignItems: 'center', gap: 6, width: 115 },
  elemLabel:         { fontWeight: '700', fontSize: 13 },

  comboRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, width: '100%' },
  comboLabel:        { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', marginLeft: 4 },
  dimText:           { color: 'rgba(255,255,255,0.3)', fontSize: 13 },

  infoBox:           { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, width: '100%', gap: 0, marginTop: 8 },
  infoText:          { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 19 },
  exampleRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 8, marginTop: 10, justifyContent: 'center' },

  ghostBox:          { width: 62, height: 62, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  ghostLabel:        { color: 'rgba(255,255,255,0.55)', fontSize: 11 },

  tipRow:            { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, alignItems: 'flex-start', width: '100%' },
  tipText:           { color: 'rgba(255,255,255,0.8)', fontSize: 12, flex: 1, lineHeight: 18 },

  dots:              { flexDirection: 'row', gap: 6, marginTop: 24, marginBottom: 4 },
  dot:               { height: 8, borderRadius: 4 },
  dotActive:         { backgroundColor: '#fbbf24', width: 24 },
  dotInactive:       { backgroundColor: 'rgba(255,255,255,0.25)', width: 8 },

  navRow:            { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
  navBtn:            { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  navBtnText:        { color: '#fff', fontWeight: '700', fontSize: 14 },

  practiceBtn:       { marginTop: 12, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: 'rgba(251,191,36,0.15)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)' },
  practiceBtnText:   { color: '#fbbf24', fontWeight: '700', fontSize: 13 },

  practiceSubtitle:  { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', marginBottom: 8, paddingHorizontal: 20 },

  toast:             { position: 'absolute', bottom: 32, left: 24, right: 24, backgroundColor: '#171c28', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', padding: 14, alignItems: 'center' },
  toastText:         { color: '#fff', fontSize: 13, textAlign: 'center' },

  bouncingArrow:     { fontSize: 26, textAlign: 'center', marginVertical: 2 },

  tipCard:           { backgroundColor: 'rgba(20,25,40,0.96)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, maxWidth: 240, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  tipCardTitle:      { color: '#fbbf24', fontWeight: '800', fontSize: 12, marginBottom: 2 },
  tipCardText:       { color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 15 },
  tipActionRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  tipDot:            { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fbbf24' },
  tipActionText:     { color: 'rgba(251,191,36,0.8)', fontSize: 10, fontStyle: 'italic', fontWeight: '600' },
  tipCounter:        { color: 'rgba(255,255,255,0.25)', fontSize: 9, marginTop: 4 },

  tipAbove:          { alignItems: 'center', marginBottom: 4 },
  tipAbsoluteTop:    { position: 'absolute', top: -120, zIndex: 40, alignItems: 'center' },
  tipTopLeft:        { position: 'absolute', top: -120, left: 0, zIndex: 40, alignItems: 'flex-start' },
  tipCenter:         { position: 'absolute', top: '30%', left: '10%', zIndex: 40 },
  tipBelowDown:      { alignItems: 'center', marginTop: 4 },
  tipBelowUp:        { alignItems: 'center', marginTop: 4 },
  tipAboveInventory: { alignItems: 'center', marginBottom: 4 },

  winOverlay:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 50, alignItems: 'center', justifyContent: 'center' },
  winCard:           { backgroundColor: '#141926', borderRadius: 24, padding: 28, alignItems: 'center', width: 300, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  winTitle:          { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  winSub:            { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  winStar:           { fontSize: 36 },
  winBtn:            { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  winBtnOutline:     { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  winBtnPrimary:     { backgroundColor: '#f59e0b' },
});
