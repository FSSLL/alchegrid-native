import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Image,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GRID_BACKGROUNDS } from '../../../constants/assets';
import { useGameStore } from '../../../store/gameStore';
import { useCommunityStore, communityLevelToGameLevel } from '../../../store/communityStore';
import { computeGridLayout } from '../../../lib/gridLayout';
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

function PlayContent() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 8 : insets.top;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { registerGrid, setDropHandlers } = useDrag();
  const gridViewRef = useRef<View>(null);
  const [mistakes, setMistakes] = useState(0);
  const prevBoardRef = useRef('');

  const {
    level, board, hintedCells, status, activeElement, hintMode,
    conflicts, selectedZone, initGame, placeElement, placeSpecificElement,
    clearCell, setActiveElement, setSelectedZone, stopTimer, toggleHintMode,
  } = useGameStore();

  const { getLevelById, markLevelSolved, incrementPlays } = useCommunityStore();

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
      markLevelSolved(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      (element, row, col) => {
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
    if (hintedCells[key]) return;
    placeElement(row, col);
    setSelectedZone(cellZoneLookup[key] ?? null);
  }, [placeElement, hintedCells, cellZoneLookup, setSelectedZone]);

  useEffect(() => {
    if (!gridViewRef.current) return;
    gridViewRef.current.measure((_x, _y, w, h, px, py) => {
      registerGrid({ x: px, y: py, width: w, height: h });
    });
  });

  const { width: screenWidth } = useWindowDimensions();
  if (!level) return null;

  const { cellSize, gap: cellGap, totalGridPx: gridPx } = computeGridLayout(level.size, screenWidth);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { stopTimer(); router.replace('/community'); }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.levelName} numberOfLines={1}>{level.id}</Text>
          <Text style={styles.levelMeta}>
            {level.size}×{level.size}
            {mistakes > 0 ? `  ·  ⚠ ${mistakes} mistake${mistakes > 1 ? 's' : ''}` : ''}
            {status === 'won' ? '  ·  ✓ Solved!' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.hintBtn, hintMode && styles.hintBtnActive]}
          onPress={toggleHintMode}
        >
          <Text style={styles.hintIcon}>💡</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={styles.gridSection}>
        <View style={[styles.gridWrap, { width: gridPx, height: gridPx }]} ref={gridViewRef}>
          {GRID_BACKGROUNDS[level.size] && (
            <Image
              source={GRID_BACKGROUNDS[level.size]}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )}
          <GridLines gridSize={level.size} cellSize={cellSize} gap={cellGap} totalGridPx={gridPx} />
          <ZoneBorders zones={level.zones} size={level.size} cellSize={cellSize} gap={cellGap} selectedZone={selectedZone} />
          {/* Overlay BEFORE cells so cells sit on top and always receive touches */}
          <ZoneHighlightOverlay zone={selectedZone} cellSize={cellSize} gap={cellGap} />
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
                  isHinted={!!hintedCells[`${row},${col}`]}
                  isConflict={conflicts.some((c) => c.row === row && c.col === col)}
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

      {selectedZone && (
        <ZoneTooltip zone={selectedZone} board={board} onClose={() => setSelectedZone(null)} />
      )}

      <ElementPalette level={level} board={board} activeElement={activeElement} onSelect={setActiveElement} />
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
  gridWrap: { position: 'relative' },
  cell: { position: 'absolute' },
});
