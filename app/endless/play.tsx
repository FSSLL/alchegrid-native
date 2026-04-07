import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import Pressable from '../../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GRID_BACKGROUNDS } from '../../constants/assets';
import { useGameStore } from '../../store/gameStore';
import { useEndlessStore } from '../../store/endlessStore';
import { usePlayerStore } from '../../store/playerStore';
import { generateEndlessLevel } from '../../lib/generateEndlessLevel';
import { computeGridLayout } from '../../lib/gridLayout';
import GameCell from '../../components/GameCell';
import ZoneBorders from '../../components/ZoneBorders';
import ZoneHighlightOverlay from '../../components/ZoneHighlightOverlay';
import GridLines from '../../components/GridLines';
import ElementPalette from '../../components/ElementPalette';
import ZoneTooltip from '../../components/ZoneTooltip';
import { DragProvider, useDrag } from '../../contexts/DragContext';

export default function EndlessGameScreen() {
  return (
    <DragProvider>
      <EndlessGameContent />
    </DragProvider>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function EndlessGameContent() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 8 : insets.top;
  const { registerGrid, setDropHandlers } = useDrag();
  const gridViewRef = useRef<View>(null);

  // ── game store ──────────────────────────────────────────────────────────
  const {
    level, board, hintedCells, status, hintMode, toggleHintMode,
    conflicts, selectedZone, initGame, placeElement, placeSpecificElement,
    clearCell, revealHint, setSelectedZone, stopTimer,
  } = useGameStore();

  const conflictSet = useMemo(
    () => new Set(conflicts.map((c) => `${c.row},${c.col}`)),
    [conflicts],
  );

  // ── ghost elements (zone recipe hints shown in empty cells) ──────────────
  const cellGhostInfo = useMemo(() => {
    const map: Record<string, { element: string; opacity: number; grayscale: boolean }> = {};
    if (!level) return map;
    level.zones.forEach((zone) => {
      if (!zone.recipeName) return;
      const opacity = zone.cells.length === 1 ? 0.65 : 0.90;
      const grayscale = zone.cells.length === 1;
      zone.cells.forEach(({ row, col }) => {
        map[`${row},${col}`] = { element: zone.recipeName!, opacity, grayscale };
      });
    });
    return map;
  }, [level]);

  const { hintBalance, unlimitedHints, usePaidHint, hasDailyFreeHint, useDailyFreeHint } = usePlayerStore();

  const handleHintPress = useCallback(() => {
    if (hintMode) { toggleHintMode(); return; }
    const canUse = unlimitedHints || hintBalance > 0;
    if (!canUse && !hasDailyFreeHint()) return;
    toggleHintMode();
  }, [hintMode, unlimitedHints, hintBalance, hasDailyFreeHint, toggleHintMode]);

  // ── endless store ────────────────────────────────────────────────────────
  const {
    runActive, levelsCompleted, totalScore, levelMistakes,
    levelStartTime, completeLevel, recordMistake,
    surrender, checkInactivity, bumpActivity,
  } = useEndlessStore();

  const levelLoadedRef = useRef(-1);
  const prevBoardRef = useRef('');

  // ── elapsed time display ────────────────────────────────────────────────
  const [elapsedDisplay, setElapsedDisplay] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      const { totalTimeMs } = useEndlessStore.getState();
      const levelElapsed = Date.now() - levelStartTime;
      setElapsedDisplay(Math.floor((totalTimeMs + levelElapsed) / 1000));
    }, 200);
    return () => clearInterval(id);
  }, [levelStartTime]);

  // ── score flash ──────────────────────────────────────────────────────────
  const [lastLevelScore, setLastLevelScore] = useState<number | null>(null);
  const scoreFadeAnim = useRef(new Animated.Value(0)).current;

  const flashScore = (pts: number) => {
    setLastLevelScore(pts);
    scoreFadeAnim.setValue(1);
    Animated.sequence([
      Animated.delay(1600),
      Animated.timing(scoreFadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setLastLevelScore(null));
  };

  // ── mistake flash ────────────────────────────────────────────────────────
  const [flashMistake, setFlashMistake] = useState(false);

  // ── guard: redirect if run not active ───────────────────────────────────
  useEffect(() => {
    if (!runActive) {
      stopTimer();
      router.replace('/endless');
    }
  }, [runActive]);

  // ── load level when levelsCompleted changes ──────────────────────────────
  useEffect(() => {
    if (!runActive) return;
    if (levelLoadedRef.current !== levelsCompleted) {
      const { currentDifficulty: diff, skillTracker: st } = useEndlessStore.getState();
      const level = generateEndlessLevel(st.currentGridSize, diff, levelsCompleted);
      initGame(level);
      levelLoadedRef.current = levelsCompleted;
      prevBoardRef.current = '';
    }
  }, [runActive, levelsCompleted]);

  // ── inactivity check ─────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      checkInactivity();
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // ── mistake detection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!level || status !== 'playing') return;
    const boardStr = JSON.stringify(board);
    const prevStr = prevBoardRef.current;
    if (!prevStr || boardStr === prevStr) {
      prevBoardRef.current = boardStr;
      return;
    }

    let placedRow = -1, placedCol = -1;
    outer: for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const prevBoard = JSON.parse(prevStr);
        if (board[r][c] !== null && prevBoard[r][c] !== board[r][c]) {
          placedRow = r; placedCol = c;
          break outer;
        }
      }
    }

    if (placedRow !== -1) {
      const isConflict = conflicts.some((cc) => cc.row === placedRow && cc.col === placedCol);
      if (isConflict) {
        recordMistake();
        setFlashMistake(true);
        setTimeout(() => setFlashMistake(false), 400);
      }
    }

    prevBoardRef.current = boardStr;
  }, [board, conflicts]);

  // ── win detection ────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'won' && runActive) {
      stopTimer();
      setTimeout(() => {
        const pts = completeLevel();
        flashScore(pts);
      }, 800);
    }
  }, [status]);

  // ── drag handlers ────────────────────────────────────────────────────────
  useEffect(() => {
    setDropHandlers(
      (element, row, col, srcRow, srcCol) => {
        const isMove = srcRow !== undefined && srcCol !== undefined;
        const isSameCell = isMove && srcRow === row && srcCol === col;
        if (isSameCell) return;
        if (isMove) clearCell(srcRow!, srcCol!);
        bumpActivity();
        placeSpecificElement(element, row, col);
        if (level) {
          const zone = level.zones.find((z) => z.cells.some((c) => c.row === row && c.col === col));
          setSelectedZone(zone ?? null);
        }
      },
      (row, col) => clearCell(row, col),
    );
  }, [setDropHandlers, placeSpecificElement, clearCell, level, setSelectedZone, bumpActivity]);

  const cellZoneLookup = useMemo(() => {
    const map: Record<string, NonNullable<typeof level>['zones'][number]> = {};
    if (!level) return map;
    level.zones.forEach((zone) => {
      zone.cells.forEach(({ row, col }) => { map[`${row},${col}`] = zone; });
    });
    return map;
  }, [level]);

  const handleCellPress = useCallback((row: number, col: number) => {
    const key = `${row},${col}`;
    bumpActivity();
    if (hintMode) {
      if (hintedCells[key]) {
        // Already filled by a hint — cancel mode, no charge
        toggleHintMode();
        return;
      }
      // Consume credit now (at reveal time)
      const canUse = unlimitedHints || hintBalance > 0;
      const dailyFree = hasDailyFreeHint();
      if (!canUse && !dailyFree) { toggleHintMode(); return; }
      if (dailyFree && !canUse) { useDailyFreeHint(); }
      if (!unlimitedHints) { usePaidHint(); }
      revealHint(row, col);
      setSelectedZone(cellZoneLookup[key] ?? null);
      return;
    }
    if (hintedCells[key]) return;
    placeElement(row, col);
    setSelectedZone(cellZoneLookup[key] ?? null);
  }, [hintMode, hintedCells, toggleHintMode, unlimitedHints, hintBalance, hasDailyFreeHint, useDailyFreeHint, usePaidHint, revealHint, placeElement, cellZoneLookup, setSelectedZone, bumpActivity]);

  const handleSurrender = () => {
    stopTimer();
    surrender();
  };

  const { width: screenWidth } = useWindowDimensions();
  if (!level) return null;

  const { cellSize, gap: cellGap, totalGridPx: gridPx } = computeGridLayout(level.size, screenWidth);

  const handleGridLayout = () => {
    gridViewRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      registerGrid({ pageX, pageY, cellSize, gap: cellGap, gridN: level.size });
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable style={styles.backBtn} onPress={handleSurrender}>
          <Text style={styles.backIcon}>🏳</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.levelLabel}>Level {levelsCompleted + 1} · {level.size}×{level.size}</Text>
          <Text style={styles.diffLabel}>
            {totalScore.toLocaleString()} pts{levelMistakes > 0 ? ` · ⚠${levelMistakes}` : ''}
          </Text>
        </View>
        <Pressable
          style={[styles.hintBtn, hintMode && styles.hintBtnActive]}
          onPress={handleHintPress}
        >
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hintCount}>{unlimitedHints ? '∞' : hintBalance}</Text>
        </Pressable>

        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatTime(elapsedDisplay)}</Text>
        </View>
      </View>

      {/* Hint mode tooltip banner */}
      {hintMode && (
        <View style={styles.hintBanner}>
          <Text style={styles.hintBannerText}>💡 Tap a cell to fill it with the right element</Text>
        </View>
      )}

      {/* Mistake flash */}
      {flashMistake && (
        <View style={styles.mistakeFlash} pointerEvents="none">
          <Text style={styles.mistakeText}>⚠ Conflict! –5 pts</Text>
        </View>
      )}

      {/* Score flash overlay */}
      {lastLevelScore !== null && (
        <Animated.View style={[styles.scoreFlash, { opacity: scoreFadeAnim }]} pointerEvents="none">
          <Text style={styles.scoreFlashText}>+{lastLevelScore} pts</Text>
        </Animated.View>
      )}

      {/* Grid */}
      <View style={styles.gridSection}>
        <View style={[styles.gridWrap, { width: gridPx, height: gridPx }]} ref={gridViewRef} onLayout={handleGridLayout}>
          <Image
            source={GRID_BACKGROUNDS[level.size]}
            style={{ position: 'absolute', width: gridPx, height: gridPx }}
            resizeMode="cover"
          />
          <GridLines gridSize={level.size} cellSize={cellSize} gap={cellGap} totalGridPx={gridPx} />
          <ZoneBorders zones={level.zones} size={level.size} cellSize={cellSize} gap={cellGap} selectedZone={selectedZone} />
          <ZoneHighlightOverlay zone={selectedZone} cellSize={cellSize} gap={cellGap} />
          {board.map((rowArr, r) =>
            rowArr.map((el, c) => {
              const key = `${r},${c}`;
              const ghost = cellGhostInfo[key];
              return (
                <View
                  key={key}
                  style={{
                    position: 'absolute',
                    top: r * (cellSize + cellGap),
                    left: c * (cellSize + cellGap),
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
                    ghostElement={el === null ? (ghost?.element ?? null) : null}
                    ghostOpacity={ghost?.opacity ?? 0.90}
                    onPress={() => handleCellPress(r, c)}
                  />
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Zone tooltip */}
      {selectedZone && (
        <ZoneTooltip zone={selectedZone} board={board} onClose={() => setSelectedZone(null)} />
      )}

      {/* Palette */}
      <ElementPalette level={level} board={board} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 6,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
  },
  backIcon: { fontSize: 20 },
  headerCenter: { alignItems: 'center' },
  levelLabel: { color: '#fff', fontSize: 14, fontWeight: '800' },
  diffLabel: { color: '#fbbf24', fontSize: 12, fontWeight: '700' },
  timerBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  timerText: { color: '#fff', fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },

  hintBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  hintBtnActive: { borderColor: '#3aa7ff', backgroundColor: 'rgba(58,167,255,0.18)' },
  hintIcon: { fontSize: 14 },
  hintCount: { color: '#34d399', fontSize: 13, fontWeight: '700' },
  hintBanner: {
    alignItems: 'center', paddingVertical: 5,
    backgroundColor: 'rgba(58,167,255,0.12)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(58,167,255,0.25)',
  },
  hintBannerText: { color: '#7dd3fc', fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },

  mistakeFlash: {
    position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center', zIndex: 99,
  },
  mistakeText: {
    backgroundColor: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 14, fontWeight: '800',
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
  },

  scoreFlash: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 98, pointerEvents: 'none',
  },
  scoreFlashText: {
    color: '#fbbf24', fontSize: 56, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12,
  },

  gridSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridWrap: { position: 'relative' },
});
