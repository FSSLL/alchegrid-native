import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import Pressable from '../../../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GRID_BACKGROUNDS } from '../../../constants/assets';
import { useGameStore } from '../../../store/gameStore';
import { useCommunityStore, communityLevelToGameLevel, formatSolveTime } from '../../../store/communityStore';
import GameCell from '../../../components/GameCell';
import ZoneBorders from '../../../components/ZoneBorders';
import ZoneHighlightOverlay from '../../../components/ZoneHighlightOverlay';
import GridLines from '../../../components/GridLines';
import ElementPalette from '../../../components/ElementPalette';
import ZoneTooltip from '../../../components/ZoneTooltip';
import { DragProvider, useDrag } from '../../../contexts/DragContext';

export default function CommunityPlayScreen() {
  return (
    <DragProvider>
      <PlayContent />
    </DragProvider>
  );
}

const CELL_SIZES: Record<number, number> = {
  4: 72, 5: 52, 6: 44, 7: 38, 8: 32, 9: 28, 10: 25, 11: 22,
};
const CELL_GAPS: Record<number, number> = {
  4: 6, 5: 4, 6: 3, 7: 3, 8: 2, 9: 2, 10: 2, 11: 2,
};

function cellLayoutForSize(size: number, screenWidth: number): { cellSize: number; cellGap: number; gridPx: number } {
  const baseCellSize = CELL_SIZES[size] ?? 40;
  const baseCellGap  = CELL_GAPS[size]  ?? 3;
  const maxCellFromWidth = Math.floor((screenWidth - 48 - (size - 1) * baseCellGap) / size);
  const cellSize = Math.min(baseCellSize, maxCellFromWidth);
  const cellGap  = baseCellGap;
  const gridPx   = size * cellSize + (size - 1) * cellGap;
  return { cellSize, cellGap, gridPx };
}

function PlayContent() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 8 : insets.top;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { registerGrid, setDropHandlers } = useDrag();
  const gridViewRef = useRef<View>(null);
  const [mistakes, setMistakes] = useState(0);
  const prevBoardRef = useRef('');
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [solveTime, setSolveTime] = useState(0);

  const {
    level, board, hintedCells, status, hintMode,
    conflicts, selectedZone, initGame, placeSpecificElement,
    clearCell, setSelectedZone, stopTimer, toggleHintMode, elapsedTime,
  } = useGameStore();

  const conflictSet = useMemo(
    () => new Set(conflicts.map((c) => `${c.row},${c.col}`)),
    [conflicts],
  );

  const { getLevelById, markLevelSolved, incrementPlays } = useCommunityStore();

  // Look up the community level for its name
  const communityLevel = id ? getLevelById(id) : null;
  const levelDisplayName = communityLevel?.name ?? level?.id ?? '';

  // ── load level ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { router.replace('/community'); return; }
    const cl = getLevelById(id);
    if (!cl) { router.replace('/community'); return; }
    if (!level || level.id !== cl.id) {
      initGame(communityLevelToGameLevel(cl));
      incrementPlays(id);
    }
  }, [id]);

  // ── win detection ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'won' && id) {
      stopTimer();
      const t = elapsedTime;
      setSolveTime(t);
      markLevelSolved(id, t);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowWinPopup(true);
    }
  }, [status]);

  // ── mistake detection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!level || status !== 'playing') return;
    const boardStr = JSON.stringify(board);
    const prevStr = prevBoardRef.current;
    if (!prevStr || boardStr === prevStr) { prevBoardRef.current = boardStr; return; }
    let pr = -1, pc = -1;
    outer: for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const prev = JSON.parse(prevStr);
        if (board[r][c] !== null && prev[r][c] !== board[r][c]) { pr = r; pc = c; break outer; }
      }
    }
    if (pr !== -1 && conflicts.some((cc) => cc.row === pr && cc.col === pc)) {
      setMistakes((m) => m + 1);
    }
    prevBoardRef.current = boardStr;
  }, [board, conflicts]);

  // ── drag handlers ─────────────────────────────────────────────────────────
  useEffect(() => {
    setDropHandlers(
      (element, row, col, srcRow, srcCol) => {
        const isMove = srcRow !== undefined && srcCol !== undefined;
        const isSameCell = isMove && srcRow === row && srcCol === col;
        if (isSameCell) return;
        if (isMove) clearCell(srcRow!, srcCol!);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        placeSpecificElement(element, row, col);
        if (level) {
          const zone = level.zones.find((z) => z.cells.some((c) => c.row === row && c.col === col));
          setSelectedZone(zone ?? null);
        }
      },
      (row, col) => clearCell(row, col),
    );
  }, [setDropHandlers, placeSpecificElement, clearCell, level, setSelectedZone]);

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
    setSelectedZone(cellZoneLookup[key] ?? null);
  }, [cellZoneLookup, setSelectedZone]);



  const { width: screenWidth } = useWindowDimensions();
  if (!level) return null;

  const { cellSize, cellGap, gridPx } = cellLayoutForSize(level.size, screenWidth);

  const handleGridLayout = () => {
    gridViewRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      registerGrid({ pageX, pageY, cellSize, gap: cellGap, gridN: level.size });
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable style={styles.backBtn} onPress={() => { stopTimer(); router.back(); }}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.levelName} numberOfLines={1}>{levelDisplayName}</Text>
          <Text style={styles.levelMeta}>
            {level.size}×{level.size}
            {mistakes > 0 ? `  ·  ⚠ ${mistakes} mistake${mistakes > 1 ? 's' : ''}` : ''}
            {status === 'won' ? '  ·  ✓ Solved!' : ''}
          </Text>
        </View>
        <Pressable
          style={[styles.hintBtn, hintMode && styles.hintBtnActive]}
          onPress={toggleHintMode}
        >
          <Text style={styles.hintIcon}>💡</Text>
        </Pressable>
      </View>

      {/* Grid */}
      <View style={styles.gridSection}>
        <View style={[styles.gridWrap, { width: gridPx, height: gridPx }]} ref={gridViewRef} onLayout={handleGridLayout}>
          {GRID_BACKGROUNDS[level.size] && (
            <Image
              source={GRID_BACKGROUNDS[level.size]}
              style={{ position: 'absolute', width: gridPx, height: gridPx }}
              resizeMode="cover"
            />
          )}
          <GridLines gridSize={level.size} cellSize={cellSize} gap={cellGap} totalGridPx={gridPx} />
          <ZoneBorders zones={level.zones} size={level.size} cellSize={cellSize} gap={cellGap} selectedZone={selectedZone} />
          <ZoneHighlightOverlay zone={selectedZone} cellSize={cellSize} gap={cellGap} />
          {board.map((rowArr, r) =>
            rowArr.map((el, c) => {
              const key = `${r},${c}`;
              return (
                <View
                  key={key}
                  style={{
                    position: 'absolute',
                    top: r * (cellSize + cellGap),
                    left: c * (cellSize + cellGap),
                    width: cellSize, height: cellSize,
                  }}
                >
                  <GameCell
                    row={r}
                    col={c}
                    element={el}
                    cellSize={cellSize}
                    isConflict={conflictSet.has(key)}
                    isHinted={!!hintedCells[key]}
                    ghostElement={null}
                    ghostOpacity={0.90}
                    onPress={() => handleCellPress(r, c)}
                  />
                </View>
              );
            })
          )}
        </View>
      </View>

      {selectedZone && (
        <ZoneTooltip zone={selectedZone} board={board} onClose={() => setSelectedZone(null)} />
      )}

      <ElementPalette level={level} board={board} />

      {/* Win popup */}
      {showWinPopup && (
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.popupEmoji}>🎉</Text>
            <Text style={styles.popupTitle}>Congratulations!</Text>
            <Text style={styles.popupLevelName} numberOfLines={2}>{levelDisplayName}</Text>
            <Text style={styles.popupTime}>Solved in {formatSolveTime(solveTime)}</Text>
            <Pressable
              style={styles.okBtn}
              onPress={() => {
                setShowWinPopup(false);
                router.back();
              }}
            >
              <Text style={styles.okBtnText}>Back to Explore</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
  },
  backIcon: { color: '#cbd5e1', fontSize: 20, fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  levelName: { color: '#fff', fontSize: 13, fontWeight: '800' },
  levelMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },
  hintBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
  },
  hintBtnActive: { backgroundColor: 'rgba(250,204,21,0.3)' },
  hintIcon: { fontSize: 20 },
  gridSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridWrap: { position: 'relative', overflow: 'hidden' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  popup: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 32,
    alignItems: 'center',
    width: 300,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  popupEmoji: { fontSize: 52 },
  popupTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  popupLevelName: {
    color: '#93c5fd', fontSize: 15, fontWeight: '700', textAlign: 'center', maxWidth: 240,
  },
  popupTime: {
    color: '#34d399', fontSize: 18, fontWeight: '800', marginTop: 4,
  },
  okBtn: {
    marginTop: 12, paddingVertical: 13, paddingHorizontal: 40,
    backgroundColor: '#3b82f6', borderRadius: 14, alignItems: 'center',
  },
  okBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
