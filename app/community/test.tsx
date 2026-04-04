import React, { useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GRID_BACKGROUNDS } from '../../constants/assets';
import { useGameStore } from '../../store/gameStore';
import { useCommunityStore } from '../../store/communityStore';
import GameCell from '../../components/GameCell';
import ZoneBorders from '../../components/ZoneBorders';
import ElementPalette from '../../components/ElementPalette';
import ZoneTooltip from '../../components/ZoneTooltip';
import { DragProvider, useDrag } from '../../contexts/DragContext';

export default function CommunityTestScreen() {
  return (
    <DragProvider>
      <TestContent />
    </DragProvider>
  );
}

const CELL_SIZES: Record<number, number> = {
  4: 72, 5: 52, 6: 44, 7: 38, 8: 32, 9: 28, 10: 25, 11: 22,
};
const CELL_GAPS: Record<number, number> = {
  4: 6, 5: 4, 6: 3, 7: 3, 8: 2, 9: 2, 10: 2, 11: 2,
};

function TestContent() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 8 : insets.top;
  const { registerGrid, setDropHandlers } = useDrag();
  const gridViewRef = useRef<View>(null);

  const {
    level, board, hintedCells, status, activeElement,
    conflicts, selectedZone, placeElement, placeSpecificElement,
    clearCell, setActiveElement, setSelectedZone, stopTimer,
  } = useGameStore();

  const { setSolution, markSolved } = useCommunityStore();

  // ── win detection: save solution ──────────────────────────────────────────
  useEffect(() => {
    if (status === 'won' && board.length > 0) {
      stopTimer();
      const solution = board.map((row) => row.map((cell) => cell ?? ''));
      setSolution(solution);
      markSolved();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [status]);

  // ── drag handlers ─────────────────────────────────────────────────────────
  useEffect(() => {
    setDropHandlers(
      (element, row, col) => {
        placeSpecificElement(element, row, col);
        if (level) {
          const zone = level.zones.find((z) => z.cells.some((c) => c.row === row && c.col === col));
          setSelectedZone(zone ?? null);
        }
      },
      (row, col) => clearCell(row, col),
    );
  }, [setDropHandlers, placeSpecificElement, clearCell, level, setSelectedZone]);

  const handleCellPress = useCallback((row: number, col: number) => {
    placeElement(row, col);
    if (level) {
      const zone = level.zones.find((z) => z.cells.some((c) => c.row === row && c.col === col));
      setSelectedZone(zone ?? null);
    }
  }, [placeElement, level, setSelectedZone]);

  useEffect(() => {
    if (!gridViewRef.current) return;
    gridViewRef.current.measure((_x, _y, w, h, px, py) => {
      registerGrid({ x: px, y: py, width: w, height: h });
    });
  });

  if (!level) return null;

  const cellSize = CELL_SIZES[level.size] ?? 28;
  const cellGap = CELL_GAPS[level.size] ?? 2;
  const gridPx = level.size * cellSize + (level.size - 1) * cellGap;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => { stopTimer(); router.replace('/community?tab=build'); }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Test Play</Text>
          <Text style={styles.sub}>
            {status === 'won' ? '✓ Solved! Tap ← to go back.' : 'Solve to unlock Publish'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Win banner */}
      {status === 'won' && (
        <View style={styles.winBanner}>
          <Text style={styles.winText}>✓ Solution recorded! You can now publish.</Text>
        </View>
      )}

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
          <ZoneBorders zones={level.zones} size={level.size} cellSize={cellSize} gap={cellGap} selectedZone={selectedZone} />
          {level.zones.map((zone) =>
            zone.cells.map(({ row, col }) => (
              <View
                key={`${row}-${col}`}
                style={[styles.cell, {
                  top: row * (cellSize + cellGap),
                  left: col * (cellSize + cellGap),
                  width: cellSize,
                  height: cellSize,
                }]}
              >
                <GameCell
                  element={board[row]?.[col] ?? null}
                  isHinted={false}
                  isConflict={conflicts.some((c) => c.row === row && c.col === col)}
                  isInSelectedZone={selectedZone?.cells.some((c) => c.row === row && c.col === col) ?? false}
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
        <ZoneTooltip zone={selectedZone} level={level} board={board} onClose={() => setSelectedZone(null)} />
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
  headerCenter: { alignItems: 'center' },
  title: { color: '#fff', fontSize: 16, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },
  winBanner: {
    backgroundColor: 'rgba(16,185,129,0.2)', paddingVertical: 8, paddingHorizontal: 16,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(16,185,129,0.4)',
    alignItems: 'center',
  },
  winText: { color: '#34d399', fontSize: 13, fontWeight: '700' },
  gridSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridWrap: { position: 'relative' },
  cell: { position: 'absolute' },
});
