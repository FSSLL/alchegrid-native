import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Image, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GRID_BACKGROUNDS } from '../../constants/assets';
import { useGameStore } from '../../store/gameStore';
import { useHardcoreStore } from '../../store/hardcoreStore';
import { getHardcoreLevel } from '../../lib/generateHardcoreLevel';
import GameCell from '../../components/GameCell';
import ZoneBorders from '../../components/ZoneBorders';
import ElementPalette from '../../components/ElementPalette';
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

const CELL_SIZES: Record<number, number> = { 4: 80, 5: 52, 6: 44, 7: 38 };
const CELL_GAPS: Record<number, number> = { 4: 10, 5: 4, 6: 4, 7: 4 };
const MAX_LIVES = 3;

function HardcoreGameContent() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 8 : insets.top;
  const { registerGrid, setDropHandlers } = useDrag();
  const gridViewRef = useRef<View>(null);

  // ── game store ──────────────────────────────────────────────────────────
  const {
    level, board, status, activeElement,
    conflicts, initGame, placeElement, placeSpecificElement,
    clearCell, setActiveElement, setSelectedZone, stopTimer,
  } = useGameStore();

  // ── hardcore store ──────────────────────────────────────────────────────
  const {
    runActive, currentLevel, mistakesLeft, totalTimeMs, levelStartTime,
    completeLevel, recordMistake, surrender, checkInactivity,
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

    // Find newly placed cell
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      (element, row, col) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        placeSpecificElement(element, row, col);
        setSelectedZone(null);
      },
      (row, col) => clearCell(row, col),
    );
  }, [setDropHandlers, placeSpecificElement, clearCell, setSelectedZone]);

  const handleCellPress = useCallback((row: number, col: number) => {
    placeElement(row, col);
    setSelectedZone(null);
  }, [placeElement, setSelectedZone]);

  const handleSurrender = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    stopTimer();
    surrender();
  };

  useEffect(() => {
    if (!gridViewRef.current) return;
    gridViewRef.current.measure((_x, _y, width, height, pageX, pageY) => {
      registerGrid({ x: pageX, y: pageY, width, height });
    });
  });

  if (!level) return null;

  const cellSize = CELL_SIZES[level.size] ?? 38;
  const cellGap = CELL_GAPS[level.size] ?? 4;
  const gridPx = level.size * cellSize + (level.size - 1) * cellGap;

  return (
    <View style={styles.container}>
      {/* Mistake flash overlay */}
      {mistakeMsg && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.flashOverlay, { opacity: flashAnim }]} pointerEvents="none" />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleSurrender}>
          <Text style={styles.backIcon}>🏳</Text>
        </TouchableOpacity>

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

        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatTime(elapsedDisplay)}</Text>
        </View>
      </View>

      {/* Mistake toast */}
      {mistakeMsg && (
        <View style={styles.toastWrap}>
          <Text style={styles.toastText}>{mistakeMsg}</Text>
        </View>
      )}

      {/* Grid */}
      <View style={styles.gridSection}>
        <View style={[styles.gridWrap, { width: gridPx, height: gridPx }]} ref={gridViewRef}>
          <Image
            source={GRID_BACKGROUNDS[level.size]}
            style={StyleSheet.absoluteFill}
            resizeMode="stretch"
          />
          <ZoneBorders level={level} cellSize={cellSize} gap={cellGap} />
          {level.zones.map((zone) =>
            zone.cells.map(({ row, col }) => (
              <View
                key={`${row}-${col}`}
                style={[styles.cell, {
                  top: row * (cellSize + cellGap),
                  left: col * (cellSize + cellGap),
                  width: cellSize, height: cellSize,
                }]}
              >
                <GameCell
                  element={board[row]?.[col] ?? null}
                  isHinted={false}
                  isConflict={conflicts.some((c) => c.row === row && c.col === col)}
                  isInSelectedZone={false}
                  cellSize={cellSize}
                  onPress={() => handleCellPress(row, col)}
                  row={row}
                  col={col}
                />
              </View>
            )),
          )}
        </View>
      </View>

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

  toastWrap: {
    position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center', zIndex: 99,
  },
  toastText: {
    backgroundColor: 'rgba(239,68,68,0.92)', color: '#fff', fontSize: 14, fontWeight: '800',
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
  },

  gridSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridWrap: { position: 'relative' },
  cell: { position: 'absolute' },
});
