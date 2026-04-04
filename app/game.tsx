import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { GRID_BACKGROUNDS } from '../constants/assets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { getLevelData } from '../lib/levelRegistry';
import GameCell from '../components/GameCell';
import ZoneBorders from '../components/ZoneBorders';
import ElementPalette from '../components/ElementPalette';
import ZoneTooltip from '../components/ZoneTooltip';
import StarProgress from '../components/StarProgress';
import WinOverlay from '../components/WinOverlay';
import { DragProvider, useDrag } from '../contexts/DragContext';

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

  const {
    level,
    board,
    hintedCells,
    status,
    hintMode,
    conflicts,
    selectedZone,
    elapsedTime,
    stars,
    initGame,
    placeSpecificElement,
    clearCell,
    setSelectedZone,
    toggleHintMode,
    stopTimer,
    resetBoard,
  } = useGameStore();

  const { coins, hintBalance, unlimitedHints, completeLevel, usePaidHint, hasDailyFreeHint, useDailyFreeHint } = usePlayerStore();
  const { registerGrid, setDropHandlers } = useDrag();

  // Ref for measuring absolute grid position for drop detection
  const gridViewRef = useRef<View>(null);

  useEffect(() => {
    const levelData = getLevelData(globalLevelNum);
    if (levelData) initGame(levelData);
    return () => { stopTimer(); };
  }, [globalLevelNum]);

  // Wire drop handlers into DragContext
  useEffect(() => {
    setDropHandlers(
      (element, row, col) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        placeSpecificElement(element, row, col, (earnedStars) => {
          completeLevel(globalLevelNum, earnedStars);
        });
        // Auto-select zone of the dropped cell
        if (level) {
          const zone = level.zones.find((z) =>
            z.cells.some((c) => c.row === row && c.col === col),
          );
          setSelectedZone(zone ?? null);
        }
      },
      (row, col) => {
        // dropped outside grid from a cell → erase that cell
        clearCell(row, col);
      },
    );
  }, [setDropHandlers, placeSpecificElement, clearCell, completeLevel, globalLevelNum, level, setSelectedZone]);

  // Cell tap only opens zone tooltip — placement is drag-only
  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (!level) return;
      const zone = level.zones.find((z) =>
        z.cells.some((c) => c.row === row && c.col === col),
      );
      setSelectedZone(zone ?? null);
    },
    [level, setSelectedZone],
  );

  const handleHintPress = useCallback(() => {
    const canUse = unlimitedHints || hintBalance > 0;
    const dailyFree = hasDailyFreeHint();
    if (!canUse && !dailyFree) return;
    if (dailyFree && !canUse) { useDailyFreeHint(); }
    else if (!unlimitedHints) { usePaidHint(); }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleHintMode();
  }, [unlimitedHints, hintBalance, hasDailyFreeHint, useDailyFreeHint, usePaidHint, toggleHintMode]);

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

  if (!level) {
    return (
      <View style={[styles.loading, { backgroundColor: '#0f1117' }]}>
        <Text style={{ color: '#eef1f5' }}>Loading…</Text>
      </View>
    );
  }

  const gridSize = level.size;
  const cellSize =
    gridSize <= 4 ? 80 :
    gridSize <= 5 ? 52 :
    gridSize <= 6 ? 44 :
    gridSize <= 7 ? 38 :
    gridSize <= 8 ? 34 :
    gridSize <= 9 ? 30 :
    gridSize <= 10 ? 27 : 24;

  const gap = gridSize <= 4 ? 10 : 4;
  const totalGridSize = gridSize * cellSize + (gridSize - 1) * gap;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const coinsEarned = stars * 10;
  const gridBgSource = GRID_BACKGROUNDS[gridSize] ?? GRID_BACKGROUNDS[4];

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
        <TouchableOpacity
          onPress={() => { stopTimer(); router.back(); }}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.pill}>
          <Text style={styles.coinText}>🪙 {coins}</Text>
        </View>

        <TouchableOpacity
          style={[styles.hintBtn, hintMode && styles.hintBtnActive]}
          onPress={handleHintPress}
        >
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hintCount}>{unlimitedHints ? '∞' : hintBalance}</Text>
        </TouchableOpacity>

        <View style={styles.pill}>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={resetBoard}>
          <Text style={styles.resetIcon}>↺</Text>
        </TouchableOpacity>
      </View>

      {/* Level label */}
      <View style={styles.levelLabel}>
        <Text style={styles.levelText}>
          Level {globalLevelNum} · {level.worldId.replace('world', 'W')}
        </Text>
      </View>

      {/* Star progress */}
      <View style={styles.progressRow}>
        <StarProgress elapsed={elapsedTime} thresholds={level.starThresholds} />
      </View>

      {/* Grid — static, no scroll */}
      <View style={styles.gridArea}>
        {/* Zone tooltip — absolute at bottom of grid area, above palette */}
        {selectedZone && (
          <View style={styles.tooltipOverlay}>
            <ZoneTooltip
              zone={selectedZone}
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
          <ZoneBorders
            zones={level.zones}
            size={gridSize}
            cellSize={cellSize}
            gap={gap}
            selectedZone={selectedZone}
          />
          {board.map((row, r) =>
            row.map((el, c) => {
              const key = `${r},${c}`;
              return (
                <View
                  key={key}
                  style={{
                    position: 'absolute',
                    left: c * (cellSize + gap),
                    top: r * (cellSize + gap),
                  }}
                >
                  <GameCell
                    row={r}
                    col={c}
                    element={el}
                    cellSize={cellSize}
                    isConflict={conflictSet.has(key)}
                    isHinted={!!hintedCells[key]}
                    isSelected={
                      selectedZone?.cells.some((cc) => cc.row === r && cc.col === c) ?? false
                    }
                    ghostElement={el === null ? (cellGhostInfo[key]?.element ?? null) : null}
                    ghostOpacity={cellGhostInfo[key]?.opacity ?? 0.7}
                    ghostGrayscale={cellGhostInfo[key]?.grayscale ?? false}
                    onPress={handleCellPress}
                  />
                </View>
              );
            }),
          )}
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
          level={level}
          board={board}
        />
      </View>

      {/* Win overlay */}
      {status === 'won' && (
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
