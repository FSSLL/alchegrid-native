import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import Pressable from '../../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GRID_BACKGROUNDS } from '../../constants/assets';
import colors from '../../constants/colors';
import { useGameStore } from '../../store/gameStore';
import { useCommunityStore, requestCommunityTab } from '../../store/communityStore';
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

function TestContent() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 8 : insets.top;
  const { registerGrid, setDropHandlers } = useDrag();
  const gridViewRef = useRef<View>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const {
    level, board, hintedCells, status,
    conflicts, selectedZone, placeElement, placeSpecificElement,
    clearCell, setSelectedZone, stopTimer,
  } = useGameStore();

  const conflictSet = useMemo(
    () => new Set(conflicts.map((c) => `${c.row},${c.col}`)),
    [conflicts],
  );

  const { setSolution, markSolved, publishLevel } = useCommunityStore();

  // ── win detection ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'won' && board.length > 0) {
      stopTimer();
      const solution = board.map((row) => row.map((cell) => cell ?? ''));
      setSolution(solution);
      markSolved();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPopup(true);
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

  const cellGhostInfo = useMemo(() => {
    const map: Record<string, { element: string; opacity: number; zoneBg: string }> = {};
    if (!level) return map;
    level.zones.forEach((zone, zoneIdx) => {
      if (!zone.recipeName) return;
      const opacity = zone.cells.length === 1 ? 0.65 : 0.90;
      const zoneBg = colors.zoneTints[zoneIdx % colors.zoneTints.length];
      zone.cells.forEach(({ row, col }) => {
        map[`${row},${col}`] = { element: zone.recipeName!, opacity, zoneBg };
      });
    });
    return map;
  }, [level]);

  const { width: screenWidth } = useWindowDimensions();
  if (!level) return null;

  const { cellSize, gap: cellGap, totalGridPx: gridPx } = computeGridLayout(level.size, screenWidth);

  const handleGridLayout = () => {
    gridViewRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      registerGrid({ pageX, pageY, cellSize, gap: cellGap, gridN: level.size });
    });
  };

  const handleEdit = () => {
    setShowPopup(false);
    stopTimer();
    router.back();
  };

  const handlePublish = async () => {
    setPublishing(true);
    await publishLevel();
    setPublishing(false);
    setPublished(true);
  };

  const handleDoneAfterPublish = () => {
    setShowPopup(false);
    requestCommunityTab('explore');
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => { stopTimer(); router.back(); }}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Test Play</Text>
          <Text style={styles.sub}>
            {status === 'won' ? '✓ Solved! You can now publish.' : 'Solve to unlock Publish'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
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
                    ghostElement={el === null ? (cellGhostInfo[key]?.element ?? null) : null}
                    ghostOpacity={cellGhostInfo[key]?.opacity ?? 0.90}
                    ghostZoneBg={cellGhostInfo[key]?.zoneBg}
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
      {showPopup && (
        <View style={styles.overlay}>
          <View style={styles.popup}>
            {published ? (
              /* ── Published confirmation ── */
              <>
                <Text style={styles.popupEmoji}>🎉</Text>
                <Text style={styles.popupTitle}>Level Published!</Text>
                <Text style={styles.popupSub}>
                  Your level will be added to the community explore page shortly.
                </Text>
                <Pressable style={styles.okBtn} onPress={handleDoneAfterPublish}>
                  <Text style={styles.okBtnText}>Go to Explore</Text>
                </Pressable>
              </>
            ) : (
              /* ── Edit or Publish choice ── */
              <>
                <Text style={styles.popupEmoji}>✅</Text>
                <Text style={styles.popupTitle}>Your level is solvable!</Text>
                <Text style={styles.popupSub}>
                  Solution recorded. What would you like to do?
                </Text>
                <View style={styles.popupBtns}>
                  <Pressable style={styles.editBtn} onPress={handleEdit} disabled={publishing}>
                    <Text style={styles.editBtnText}>✏️  Edit Zones</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.publishBtn, publishing && styles.publishBtnDisabled]}
                    onPress={handlePublish}
                    disabled={publishing}
                  >
                    {publishing
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.publishBtnText}>🚀  Publish</Text>}
                  </Pressable>
                </View>
              </>
            )}
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
  headerCenter: { alignItems: 'center' },
  title: { color: '#fff', fontSize: 16, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },
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
    gap: 12,
  },
  popupEmoji: { fontSize: 48 },
  popupTitle: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  popupSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  popupBtns: { flexDirection: 'row', gap: 10, marginTop: 6 },
  editBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
  },
  editBtnText: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },
  publishBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#3b82f6', alignItems: 'center',
  },
  publishBtnDisabled: { backgroundColor: 'rgba(59,130,246,0.5)' },
  publishBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  okBtn: {
    marginTop: 4, paddingVertical: 12, paddingHorizontal: 36,
    backgroundColor: '#10b981', borderRadius: 14, alignItems: 'center',
  },
  okBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
