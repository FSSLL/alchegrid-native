import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import ZonePanel from '../components/ZonePanel';
import ZoneTooltip from '../components/ZoneTooltip';
import StarProgress from '../components/StarProgress';
import WinOverlay from '../components/WinOverlay';


export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { globalLevel } = useLocalSearchParams<{ globalLevel: string }>();
  const globalLevelNum = parseInt(globalLevel ?? '1', 10);

  const {
    level,
    board,
    hintedCells,
    status,
    activeElement,
    hintMode,
    conflicts,
    selectedZone,
    elapsedTime,
    stars,
    initGame,
    placeElement,
    setActiveElement,
    setSelectedZone,
    toggleHintMode,
    stopTimer,
    resetBoard,
  } = useGameStore();

  const { coins, hintBalance, unlimitedHints, completeLevel, usePaidHint, hasDailyFreeHint, useDailyFreeHint } = usePlayerStore();

  useEffect(() => {
    const levelData = getLevelData(globalLevelNum);
    if (levelData) {
      initGame(levelData);
    }
    return () => {
      stopTimer();
    };
  }, [globalLevelNum]);

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      placeElement(row, col, (earnedStars) => {
        completeLevel(globalLevelNum, earnedStars);
      });
      // Auto-select the zone this cell belongs to
      if (level) {
        const zone = level.zones.find((z) =>
          z.cells.some((c) => c.row === row && c.col === col)
        );
        setSelectedZone(zone ?? null);
      }
    },
    [placeElement, completeLevel, globalLevelNum, level, setSelectedZone]
  );

  const handleHintPress = useCallback(() => {
    const canUse = unlimitedHints || hintBalance > 0;
    const dailyFree = hasDailyFreeHint();

    if (!canUse && !dailyFree) return;

    if (dailyFree && !canUse) {
      useDailyFreeHint();
    } else if (!unlimitedHints) {
      usePaidHint();
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleHintMode();
  }, [unlimitedHints, hintBalance, hasDailyFreeHint, useDailyFreeHint, usePaidHint, toggleHintMode]);

  const handleReplay = useCallback(() => {
    resetBoard();
  }, [resetBoard]);

  const handleNext = useCallback(() => {
    const nextLevel = globalLevelNum + 1;
    if (nextLevel <= 240) {
      router.replace({ pathname: '/game', params: { globalLevel: nextLevel.toString() } });
    } else {
      router.replace('/');
    }
  }, [globalLevelNum]);

  const conflictSet = useMemo(() => new Set(conflicts.map((c) => `${c.row},${c.col}`)), [conflicts]);

  // Ghost icons: empty cells show faded recipe product icon (spec §9.2, R15/R16)
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
        <Text style={{ color: '#eef1f5' }}>Loading...</Text>
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

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => { stopTimer(); router.back(); }} style={styles.backBtn}>
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
        <Text style={styles.levelText}>Level {globalLevelNum} · {level.worldId.replace('world', 'W')}</Text>
      </View>

      {/* Star progress */}
      <View style={styles.progressRow}>
        <StarProgress elapsed={elapsedTime} thresholds={level.starThresholds} />
      </View>

      {/* Zone panel */}
      <View style={styles.zonePanel}>
        <ZonePanel
          level={level}
          board={board}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
        />
      </View>

      {/* Grid */}
      <ScrollView contentContainerStyle={styles.gridScroll} style={{ backgroundColor: 'transparent' }}>
        <View style={[styles.gridContainer, { width: totalGridSize, height: totalGridSize }]}>
          {/* PNG grid art background */}
          <Image
            source={gridBgSource}
            style={{ position: 'absolute', width: totalGridSize, height: totalGridSize }}
            resizeMode="stretch"
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
                    isSelected={selectedZone?.cells.some((cc) => cc.row === r && cc.col === c) ?? false}
                    ghostElement={el === null ? (cellGhostInfo[key]?.element ?? null) : null}
                    ghostOpacity={cellGhostInfo[key]?.opacity ?? 0.7}
                    ghostGrayscale={cellGhostInfo[key]?.grayscale ?? false}
                    onPress={handleCellPress}
                  />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Zone tooltip — appears when a cell is tapped, shows zone recipe + ingredient tiles */}
      <View style={styles.tooltipRow}>
        <ZoneTooltip
          zone={selectedZone}
          board={board}
          activeElement={activeElement}
          onSelectElement={setActiveElement}
          onClose={() => setSelectedZone(null)}
        />
      </View>

      {/* Palette */}
      <View style={[styles.palette, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 8) }]}>
        <ElementPalette
          level={level}
          board={board}
          activeElement={activeElement}
          onSelectElement={setActiveElement}
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
    backgroundColor: '#0e1117',
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
  zonePanel: {
    paddingVertical: 4,
    marginBottom: 4,
  },
  gridScroll: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    paddingVertical: 8,
  },
  gridContainer: {
    position: 'relative',
  },
  tooltipRow: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 2,
    minHeight: 56,
    justifyContent: 'center',
  },
  palette: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});
