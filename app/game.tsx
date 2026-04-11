import React, { useEffect, useCallback, useMemo, useRef, memo } from 'react';
import Pressable from '../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  Animated,
  ActivityIndicator,
  InteractionManager,
  useWindowDimensions,
} from 'react-native';

import { GRID_BACKGROUNDS } from '../constants/assets';
import colors from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { getLevelData, globalToWorld } from '../lib/levelRegistry';
import { computeGridLayout } from '../lib/gridLayout';
import type { ElementID } from '../lib/types';
import GameCell from '../components/GameCell';
import ZoneBorders from '../components/ZoneBorders';
import ZoneHighlightOverlay from '../components/ZoneHighlightOverlay';
import GridLines from '../components/GridLines';
import ElementPalette from '../components/ElementPalette';
import ZoneTooltip from '../components/ZoneTooltip';
import StarProgress from '../components/StarProgress';
import WinOverlay from '../components/WinOverlay';
import { DragProvider, useDrag } from '../contexts/DragContext';

// ─── Memoized cell grid — does NOT receive selectedZone, so zone changes ──────
// ─── never trigger re-renders of this subtree (N² cells stay frozen). ─────────
interface BoardCellsProps {
  board: (ElementID | null)[][];
  cellSize: number;
  gap: number;
  conflictSet: Set<string>;
  hintedCells: Record<string, ElementID>;
  givenKeys: Set<string>;
  cellGhostInfo: Record<string, { element: string; opacity: number; zoneBg: string }>;
  onPress: (row: number, col: number) => void;
}

const BoardCells = memo(({ board, cellSize, gap, conflictSet, hintedCells, givenKeys, cellGhostInfo, onPress }: BoardCellsProps) => (
  <>
    {board.map((rowArr, r) =>
      rowArr.map((el, c) => {
        const key = `${r},${c}`;
        return (
          <View
            key={key}
            style={{
              position: 'absolute',
              left: c * (cellSize + gap),
              top: r * (cellSize + gap),
              width: cellSize,
              height: cellSize,
            }}
          >
            <GameCell
              row={r}
              col={c}
              element={el}
              cellSize={cellSize}
              isConflict={conflictSet.has(key)}
              isHinted={!!hintedCells[key]}
              isGiven={givenKeys.has(key)}
              ghostElement={el === null ? (cellGhostInfo[key]?.element ?? null) : null}
              ghostOpacity={cellGhostInfo[key]?.opacity ?? 0.65}
              ghostZoneBg={cellGhostInfo[key]?.zoneBg}
              onPress={onPress}
            />
          </View>
        );
      })
    )}
  </>
));
BoardCells.displayName = 'BoardCells';

// ─── Outer shell: provides DragProvider ──────────────────────────────────────
export default function GameScreen() {
  return (
    <DragProvider>
      <GameContent />
    </DragProvider>
  );
}

// ─── Inner content: can call useDrag() ───────────────────────────────────────
function GameContent() {
  const insets = useSafeAreaInsets();
  const { globalLevel } = useLocalSearchParams<{ globalLevel: string }>();
  const globalLevelNum = parseInt(globalLevel ?? '1', 10);
  const { levelInWorld, worldIndex } = globalToWorld(globalLevelNum);

  const {
    level,
    board,
    hintedCells,
    givenKeys,
    status,
    hintMode,
    conflicts,
    selectedZone,
    elapsedTime,
    stars,
    initGame,
    placeSpecificElement,
    clearCell,
    revealHint,
    setSelectedZone,
    toggleHintMode,
    stopTimer,
    resetBoard,
  } = useGameStore();

  const { coins, hintBalance, unlimitedHints, completeLevel, usePaidHint, hasDailyFreeHint, useDailyFreeHint } = usePlayerStore();
  const { registerGrid, setDropHandlers } = useDrag();

  // Ref for measuring absolute grid position for drop detection
  const gridViewRef = useRef<View>(null);
  const hintPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    if (hintMode) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(hintPulse, { toValue: 1.14, duration: 480, useNativeDriver: true }),
          Animated.timing(hintPulse, { toValue: 1, duration: 480, useNativeDriver: true }),
        ]),
      );
      anim.start();
    } else {
      hintPulse.stopAnimation();
      anim = Animated.timing(hintPulse, { toValue: 1, duration: 150, useNativeDriver: true });
      anim.start();
    }
    return () => { anim.stop(); hintPulse.stopAnimation(); };
  }, [hintMode]);

  useEffect(() => {
    const levelData = getLevelData(globalLevelNum);
    if (!levelData) return;
    const task = InteractionManager.runAfterInteractions(() => {
      initGame(levelData);
    });
    return () => {
      task.cancel();
      stopTimer();
    };
  }, [globalLevelNum]);

  // Always-correct level data — synchronously derived from the route param so it
  // is never stale, even on the first render before initGame's useEffect fires.
  const currentLevelData = useMemo(() => getLevelData(globalLevelNum), [globalLevelNum]);

  // O(1) cell-to-zone lookup built from sync level data — always correct for this
  // route even when the store's `level` still holds the previous level's object.
  const cellZoneLookup = useMemo(() => {
    const map: Record<string, NonNullable<ReturnType<typeof getLevelData>>['zones'][number]> = {};
    if (!currentLevelData) return map;
    currentLevelData.zones.forEach((zone) => {
      zone.cells.forEach(({ row, col }) => {
        map[`${row},${col}`] = zone;
      });
    });
    return map;
  }, [currentLevelData]);

  // Wire drop handlers into DragContext.
  // cellZoneLookup is in the dep array so the handler always uses the map for
  // the current level — it changes only when globalLevelNum changes, so the
  // extra re-registration is cheap and correct.
  useEffect(() => {
    setDropHandlers(
      (element, row, col, srcRow, srcCol) => {
        // Move semantics: clear source cell first so inventory count is correct
        const isMove = srcRow !== undefined && srcCol !== undefined;
        const isSameCell = isMove && srcRow === row && srcCol === col;
        if (isSameCell) return; // dropped on same cell — no-op
        if (isMove) clearCell(srcRow!, srcCol!);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        placeSpecificElement(element, row, col, (earnedStars) => {
          completeLevel(globalLevelNum, earnedStars);
        });
        // Auto-select the zone of the dropped cell
        const zone = cellZoneLookup[`${row},${col}`] ?? null;
        setSelectedZone(zone);
      },
      (row, col) => {
        // dropped outside grid from a cell → erase that cell
        clearCell(row, col);
      },
    );
  }, [setDropHandlers, placeSpecificElement, clearCell, completeLevel, globalLevelNum, setSelectedZone, cellZoneLookup]);

  // Cell tap: hint reveal in hint mode; otherwise open zone tooltip
  const handleCellPress = useCallback(
    (row: number, col: number) => {
      const key = `${row},${col}`;
      if (hintMode) {
        if (hintedCells[key]) {
          // Already filled by a hint — cancel mode, no charge
          toggleHintMode();
          return;
        }
        // Check + consume credit now (at reveal time)
        const canUse = unlimitedHints || hintBalance > 0;
        const dailyFree = hasDailyFreeHint();
        if (!canUse && !dailyFree) { toggleHintMode(); return; }
        if (dailyFree && !canUse) { useDailyFreeHint(); }
        if (!unlimitedHints) { usePaidHint(); }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        revealHint(row, col);
        return;
      }
      const zone = cellZoneLookup[key] ?? null;
      setSelectedZone(zone);
    },
    [hintMode, hintedCells, toggleHintMode, unlimitedHints, hintBalance, hasDailyFreeHint, useDailyFreeHint, usePaidHint, revealHint, cellZoneLookup, setSelectedZone],
  );

  const handleHintPress = useCallback(() => {
    if (hintMode) { toggleHintMode(); return; }
    const canUse = unlimitedHints || hintBalance > 0;
    if (!canUse && !hasDailyFreeHint()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleHintMode();
  }, [hintMode, unlimitedHints, hintBalance, hasDailyFreeHint, toggleHintMode]);

  const handleReplay = useCallback(() => { resetBoard(); }, [resetBoard]);

  const handleNext = useCallback(() => {
    const nextLevel = globalLevelNum + 1;
    if (nextLevel <= 240) {
      router.replace({ pathname: '/game', params: { globalLevel: nextLevel.toString() } });
    } else {
      router.replace('/');
    }
  }, [globalLevelNum]);

  const conflictSet = useMemo(
    () => new Set(conflicts.map((c) => `${c.row},${c.col}`)),
    [conflicts],
  );

  // Use currentLevelData (sync, always correct for this route) for all layout
  // computations so the grid can pre-render during the navigation animation —
  // BEFORE initGame fires and fills the store's `level`.
  const { width: screenWidth } = useWindowDimensions();
  const gridSize = currentLevelData?.size ?? 4;
  const { cellSize, gap, totalGridPx: totalGridSize } = computeGridLayout(gridSize, screenWidth);
  const gridBgSource = GRID_BACKGROUNDS[gridSize] ?? GRID_BACKGROUNDS[4];

  // Pre-populate an empty board of the right size so cells mount immediately
  // (empty, no images yet). Once initGame fires, board fills and cells just
  // update their props — no re-mount, no second freeze.
  const displayBoard = useMemo<(ElementID | null)[][]>(() => {
    const n = gridSize;
    if (board.length === n) return board;
    return Array.from({ length: n }, () => Array<ElementID | null>(n).fill(null));
  }, [board, gridSize]);

  // Ghost hints — use currentLevelData so they appear even before initGame.
  const cellGhostInfo = useMemo(() => {
    const map: Record<string, { element: string; opacity: number; zoneBg: string }> = {};
    const src = level?.id === currentLevelData?.id ? level : currentLevelData;
    if (!src) return map;
    const bgTints: string[] = colors.zoneBgTints ?? [];
    src.zones.forEach((zone, zoneIdx) => {
      if (!zone.recipeName) return;
      const opacity = 0.65;
      const zoneBg = bgTints.length > 0
        ? bgTints[zoneIdx % bgTints.length]
        : 'rgba(255,255,255,0.10)';
      zone.cells.forEach(({ row, col }) => {
        map[`${row},${col}`] = { element: zone.recipeName!, opacity, zoneBg };
      });
    });
    return map;
  }, [level, currentLevelData]);

  // Guard: the store's selectedZone may still reference a zone from the previous
  // level on the first render (before initGame clears it). Only expose it once the
  // store's level actually matches the current route.
  const displaySelectedZone = level?.id === currentLevelData?.id ? selectedZone : null;

  // Use currentLevelData as the authoritative source for zones/elements so the
  // full grid structure renders immediately, before initGame fires.
  const displayLevel = currentLevelData ?? level;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const coinsEarned = stars;

  if (!displayLevel) {
    return (
      <View style={[styles.loading, { backgroundColor: '#0f1117' }]}>
        <ActivityIndicator size="large" color="#a78bfa" />
      </View>
    );
  }

  // Measure grid after layout so DragContext knows drop zone coordinates
  const handleGridLayout = () => {
    gridViewRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      registerGrid({ pageX, pageY, cellSize, gap, gridN: gridSize });
    });
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => { stopTimer(); router.back(); }}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <View style={styles.pill}>
          <Text style={styles.coinText}>🪙 {coins}</Text>
        </View>

        <Animated.View style={{ transform: [{ scale: hintPulse }] }}>
          <Pressable
            style={[styles.hintBtn, hintMode && styles.hintBtnActive]}
            onPress={handleHintPress}
          >
            <Text style={styles.hintIcon}>💡</Text>
            <Text style={styles.hintCount}>{unlimitedHints ? '∞' : hintBalance}</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.pill}>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>

        <Pressable style={styles.resetBtn} onPress={resetBoard}>
          <Text style={styles.resetIcon}>↺</Text>
        </Pressable>
      </View>

      {/* Hint mode tooltip banner */}
      {hintMode && (
        <View style={styles.hintBanner}>
          <Text style={styles.hintBannerText}>💡 Tap a cell to fill it with the right element</Text>
        </View>
      )}

      {/* Level label */}
      <View style={styles.levelLabel}>
        <Text style={styles.levelText}>
          Level {levelInWorld} · W{worldIndex + 1}
        </Text>
      </View>

      {/* Star progress */}
      <View style={styles.progressRow}>
        <StarProgress elapsed={elapsedTime} thresholds={displayLevel.starThresholds} />
      </View>

      {/* Grid — static, no scroll */}
      <View style={styles.gridArea}>
        {/* Zone tooltip — absolute at bottom of grid area, above palette */}
        {displaySelectedZone && (
          <View style={styles.tooltipOverlay}>
            <ZoneTooltip
              zone={displaySelectedZone}
              board={board}
              onClose={() => setSelectedZone(null)}
            />
          </View>
        )}
        <View
          ref={gridViewRef}
          style={[styles.gridContainer, { width: totalGridSize, height: totalGridSize }]}
          onLayout={handleGridLayout}
        >
          <Image
            source={gridBgSource}
            style={{ position: 'absolute', width: totalGridSize, height: totalGridSize }}
            resizeMode="cover"
          />
          <GridLines gridSize={gridSize} cellSize={cellSize} gap={gap} totalGridPx={totalGridSize} />
          <ZoneBorders
            zones={displayLevel.zones}
            size={gridSize}
            cellSize={cellSize}
            gap={gap}
            selectedZone={displaySelectedZone}
          />
          {/* Overlay BEFORE cells so cells are on top and always receive touches */}
          <ZoneHighlightOverlay zone={displaySelectedZone} cellSize={cellSize} gap={gap} />
          <BoardCells
            board={displayBoard}
            cellSize={cellSize}
            gap={gap}
            conflictSet={conflictSet}
            hintedCells={hintedCells}
            givenKeys={givenKeys}
            cellGhostInfo={cellGhostInfo}
            onPress={handleCellPress}
          />
        </View>
      </View>

      {/* Element palette */}
      <View
        style={[
          styles.palette,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 8) },
        ]}
      >
        <ElementPalette
          level={displayLevel}
          board={displayBoard}
        />
      </View>

      {/* Win overlay — only render when this screen's level matches the store */}
      {status === 'won' && level?.id === currentLevelData?.id && (
        <WinOverlay
          stars={stars}
          elapsed={elapsedTime}
          coinsEarned={coinsEarned}
          onNext={handleNext}
          onReplay={handleReplay}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171c26',
    borderRadius: 10,
  },
  backIcon: {
    color: '#eef1f5',
    fontSize: 18,
    fontWeight: '700',
  },
  pill: {
    backgroundColor: '#171c26',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#242e42',
  },
  coinText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },
  timerText: {
    color: '#8e9ab0',
    fontSize: 13,
    fontWeight: '600',
  },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171c26',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#242e42',
    gap: 4,
  },
  hintBtnActive: {
    borderColor: '#3aa7ff',
    backgroundColor: '#1a2a40',
  },
  hintBanner: {
    alignItems: 'center',
    paddingVertical: 5,
    backgroundColor: 'rgba(58,167,255,0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58,167,255,0.25)',
  },
  hintBannerText: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  hintIcon: {
    fontSize: 14,
  },
  hintCount: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
  },
  resetBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171c26',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242e42',
    marginLeft: 'auto',
  },
  resetIcon: {
    color: '#8e9ab0',
    fontSize: 18,
    fontWeight: '700',
  },
  levelLabel: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  levelText: {
    color: '#8e9ab0',
    fontSize: 13,
    fontWeight: '600',
  },
  progressRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  gridArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  gridContainer: {
    position: 'relative',
  },
  tooltipOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 8,
    zIndex: 200,
    pointerEvents: 'box-none',
  },
  palette: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});
