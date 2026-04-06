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
import { useHardcoreStore } from '../../store/hardcoreStore';
import { usePlayerStore } from '../../store/playerStore';
import { getHardcoreLevel } from '../../lib/generateHardcoreLevel';
import { computeGridLayout } from '../../lib/gridLayout';
import GameCell from '../../components/GameCell';
import ZoneBorders from '../../components/ZoneBorders';
import ZoneHighlightOverlay from '../../components/ZoneHighlightOverlay';
import GridLines from '../../components/GridLines';
import ElementPalette from '../../components/ElementPalette';
import ZoneTooltip from '../../components/ZoneTooltip';
import { DragProvider, useDrag } from '../../contexts/DragContext';

export default function HardcoreGameScreen() {
  return (
    <DragProvider>
      <HardcoreGameContent />
    </DragProvider>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const MAX_LIVES = 3;

function HardcoreGameContent() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 8 : insets.top;
  const { registerGrid, setDropHandlers } = useDrag();
  const gridViewRef = useRef<View>(null);

  // ── game store ──────────────────────────────────────────────────────────
  const {
    level, board, status, activeElement,
    conflicts, selectedZone, hintedCells, hintMode, toggleHintMode,
    initGame, placeElement, placeSpecificElement,
    clearCell, revealHint, setActiveElement, setSelectedZone, stopTimer,
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
      const opacity = zone.cells.length === 1 ? 0.45 : 0.70;
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

  // ── hardcore store ──────────────────────────────────────────────────────
  const {
    runActive, currentLevel, mistakesLeft, totalTimeMs, levelStartTime,
    completeLevel, recordMistake, surrender, checkInactivity, bumpActivity,
  } = useHardcoreStore();

  const levelLoadedRef = useRef(-1);
  const prevBoardRef = useRef('');

  // ── elapsed time display ────────────────────────────────────────────────
  const [elapsedDisplay, setElapsedDisplay] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      const snap = useHardcoreStore.getState();
      const elapsed = Date.now() - snap.levelStartTime;
      setElapsedDisplay(Math.floor((snap.totalTimeMs + elapsed) / 1000));
    }, 200);
    return () => clearInterval(id);
  }, [levelStartTime]);

  // ── mistake flash ────────────────────────────────────────────────────────
  const [mistakeMsg, setMistakeMsg] = useState<string | null>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  const triggerFlash = (msg: string) => {
    setMistakeMsg(msg);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.delay(320),
      Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setMistakeMsg(null));
  };

  // ── guard: redirect if run not active ───────────────────────────────────
  useEffect(() => {
    if (!runActive) {
      stopTimer();
      router.replace('/hardcore');
    }
  }, [runActive]);

  // ── load level when currentLevel changes ─────────────────────────────────
  useEffect(() => {
    if (!runActive) return;
    if (levelLoadedRef.current !== currentLevel) {
      const levelData = getHardcoreLevel(currentLevel);
      if (levelData) {
        initGame(levelData);
        levelLoadedRef.current = currentLevel;
        prevBoardRef.current = '';
      }
    }
  }, [runActive, currentLevel]);

  // ── inactivity check ─────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => { checkInactivity(); }, 5000);
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
        const alive = recordMistake();
        if (alive) {
          const { mistakesLeft: ml } = useHardcoreStore.getState();
          triggerFlash(`Conflict! ${ml} ${ml === 1 ? 'life' : 'lives'} left`);
        } else {
          triggerFlash("Game Over! No lives left.");
        }
      }
    }

    prevBoardRef.current = boardStr;
  }, [board, conflicts]);

  // ── win detection ────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'won' && runActive) {
      stopTimer();
      setTimeout(() => {
        completeLevel();
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
      {/* Mistake flash overlay */}
      {mistakeMsg && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.flashOverlay, { opacity: flashAnim }]} pointerEvents="none" />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable style={styles.backBtn} onPress={handleSurrender}>
          <Text style={styles.backIcon}>🏳</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.levelLabel}>Level {currentLevel} / 70 · {level.size}×{level.size}</Text>
          <View style={styles.livesRow}>
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Text key={i} style={[styles.heart, i < mistakesLeft ? styles.heartAlive : styles.heartDead]}>
                {i < mistakesLeft ? '❤️' : '🖤'}
              </Text>
            ))}
          </View>
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

      {/* Mistake toast */}
      {mistakeMsg && (
        <View style={styles.toastWrap}>
          <Text style={styles.toastText}>{mistakeMsg}</Text>
        </View>
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
                    ghostOpacity={ghost?.opacity ?? 0.7}
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
      <ElementPalette level={level} board={board} activeElement={activeElement} onSelect={setActiveElement} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },

  flashOverlay: { backgroundColor: 'rgba(239,68,68,0.25)', zIndex: 95 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 6, zIndex: 10,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
  },
  backIcon: { fontSize: 20 },
  headerCenter: { alignItems: 'center', gap: 2 },
  levelLabel: { color: '#fff', fontSize: 13, fontWeight: '800' },
  livesRow: { flexDirection: 'row', gap: 2 },
  heart: { fontSize: 18 },
  heartAlive: {},
  heartDead: { opacity: 0.4 },
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

  toastWrap: {
    position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center', zIndex: 99,
  },
  toastText: {
    backgroundColor: 'rgba(239,68,68,0.92)', color: '#fff', fontSize: 14, fontWeight: '800',
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
  },

  gridSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridWrap: { position: 'relative' },
});
