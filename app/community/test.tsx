import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import Pressable from '../../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GRID_BACKGROUNDS } from '../../constants/assets';
import { useGameStore } from '../../store/gameStore';
import { useCommunityStore } from '../../store/communityStore';
import { computeGridLayout } from '../../lib/gridLayout';
import GameCell from '../../components/GameCell';
import ZoneBorders from '../../components/ZoneBorders';
import ZoneHighlightOverlay from '../../components/ZoneHighlightOverlay';
import GridLines from '../../components/GridLines';
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

  const conflictSet = useMemo(
    () => new Set(conflicts.map((c) => `${c.row},${c.col}`)),
    [conflicts],
  );

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

  const cellZoneLookup = useMemo(() => {
    const map: Record<string, NonNullable<typeof level>['zones'][number]> = {};
    if (!level) return map;
    level.zones.forEach((zone) => {
      zone.cells.forEach(({ row, col }) => { map[`${row},${col}`] = zone; });
    });
    return map;
  }, [level]);

  const handleCellPress = useCallback((row: number, col: number) => {
    placeElement(row, col);
    setSelectedZone(cellZoneLookup[`${row},${col}`] ?? null);
  }, [placeElement, cellZoneLookup, setSelectedZone]);

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
        <Pressable
          style={styles.backBtn}
          onPress={() => { stopTimer(); router.replace('/community?tab=build'); }}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
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
        <View style={[styles.gridWrap, { width: gridPx, height: gridPx }]} ref={gridViewRef} onLayout={handleGridLayout}>
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
                    isHinted={false}
                    ghostElement={null}
                    ghostOpacity={0.7}
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
});
