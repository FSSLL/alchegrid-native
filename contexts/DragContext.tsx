import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ElementID } from '../lib/types';
import ElementIcon from '../components/ElementIcon';
import { audioManager } from '../lib/audioManager';
import { useAudioStore } from '../store/audioStore';

export interface GridInfo {
  pageX: number;
  pageY: number;
  cellSize: number;
  gap: number;
  gridN: number;
}

interface DragState {
  element: ElementID;
  source: 'palette' | 'cell';
  sourceRow?: number;
  sourceCol?: number;
}

interface DragContextValue {
  isDragging: boolean;
  dragSourceRow: number | null;
  dragSourceCol: number | null;
  startDrag: (
    element: ElementID,
    source: 'palette' | 'cell',
    x: number,
    y: number,
    sourceRow?: number,
    sourceCol?: number,
  ) => void;
  moveDrag: (x: number, y: number) => void;
  endDrag: (x: number, y: number) => void;
  cancelDrag: () => void;
  registerGrid: (info: GridInfo) => void;
  setDropHandlers: (
    onDrop: (el: ElementID, row: number, col: number, sourceRow?: number, sourceCol?: number) => void,
    onDropOutside: (row: number, col: number) => void,
  ) => void;
}

const DragCtx = createContext<DragContextValue | null>(null);

export function useDrag() {
  const ctx = useContext(DragCtx);
  if (!ctx) throw new Error('useDrag must be within DragProvider');
  return ctx;
}

const GHOST_SIZE = 72;

export function DragProvider({ children }: { children: ReactNode }) {
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Reanimated shared values for ghost position — no re-renders on move
  const ghostX = useSharedValue(-9999);
  const ghostY = useSharedValue(-9999);

  // Container screen offset — corrects for any padding/inset on the wrapper view
  const containerOffsetX = useSharedValue(0);
  const containerOffsetY = useSharedValue(0);
  const containerRef = useRef<View>(null);

  // Stable refs so PanResponder callbacks are never stale
  const dragStateRef = useRef<DragState | null>(null);
  const gridInfoRef = useRef<GridInfo | null>(null);
  const onDropRef = useRef<(el: ElementID, r: number, c: number, srcRow?: number, srcCol?: number) => void>(() => {});
  const onDropOutsideRef = useRef<(r: number, c: number) => void>(() => {});

  const registerGrid = useCallback((info: GridInfo) => {
    gridInfoRef.current = info;
  }, []);

  const setDropHandlers = useCallback(
    (
      onDrop: (el: ElementID, r: number, c: number, srcRow?: number, srcCol?: number) => void,
      onDropOutside: (r: number, c: number) => void,
    ) => {
      onDropRef.current = onDrop;
      onDropOutsideRef.current = onDropOutside;
    },
    [],
  );

  const startDrag = useCallback(
    (
      element: ElementID,
      source: 'palette' | 'cell',
      x: number,
      y: number,
      sourceRow?: number,
      sourceCol?: number,
    ) => {
      const state: DragState = { element, source, sourceRow, sourceCol };
      dragStateRef.current = state;
      setDragState(state);
      ghostX.value = x;
      ghostY.value = y;
      if (Platform.OS !== 'web' && useAudioStore.getState().hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    },
    [ghostX, ghostY],
  );

  const moveDrag = useCallback(
    (x: number, y: number) => {
      ghostX.value = x;
      ghostY.value = y;
    },
    [ghostX, ghostY],
  );

  const endDrag = useCallback(
    (x: number, y: number) => {
      const ds = dragStateRef.current;
      const gi = gridInfoRef.current;

      if (ds && gi) {
        const relX = x - gi.pageX;
        const relY = y - gi.pageY;
        const col = Math.floor(relX / (gi.cellSize + gi.gap));
        const row = Math.floor(relY / (gi.cellSize + gi.gap));
        const inBounds =
          relX >= 0 &&
          relY >= 0 &&
          col >= 0 &&
          col < gi.gridN &&
          row >= 0 &&
          row < gi.gridN;

        if (inBounds) {
          const srcRow = ds.source === 'cell' ? ds.sourceRow : undefined;
          const srcCol = ds.source === 'cell' ? ds.sourceCol : undefined;
          onDropRef.current(ds.element, row, col, srcRow, srcCol);
          audioManager.playDrop().catch(() => {});
          if (Platform.OS !== 'web' && useAudioStore.getState().hapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }
        } else if (
          ds.source === 'cell' &&
          ds.sourceRow !== undefined &&
          ds.sourceCol !== undefined
        ) {
          onDropOutsideRef.current(ds.sourceRow, ds.sourceCol);
        }
      }

      dragStateRef.current = null;
      setDragState(null);
      ghostX.value = -9999;
      ghostY.value = -9999;
    },
    [ghostX, ghostY],
  );

  const cancelDrag = useCallback(() => {
    dragStateRef.current = null;
    setDragState(null);
    ghostX.value = -9999;
    ghostY.value = -9999;
  }, [ghostX, ghostY]);

  const ghostAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ghostX.value - GHOST_SIZE / 2 - containerOffsetX.value },
      { translateY: ghostY.value - GHOST_SIZE / 2 - containerOffsetY.value },
    ],
  }));

  const handleContainerLayout = () => {
    containerRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      containerOffsetX.value = pageX;
      containerOffsetY.value = pageY;
    });
  };

  return (
    <DragCtx.Provider
      value={{
        isDragging: !!dragState,
        dragSourceRow: (dragState?.source === 'cell' ? dragState.sourceRow : undefined) ?? null,
        dragSourceCol: (dragState?.source === 'cell' ? dragState.sourceCol : undefined) ?? null,
        startDrag,
        moveDrag,
        endDrag,
        cancelDrag,
        registerGrid,
        setDropHandlers,
      }}
    >
      <View ref={containerRef} style={{ flex: 1 }} onLayout={handleContainerLayout}>
        {children}

        {/* Floating ghost — absolutely positioned, follows finger */}
        {dragState && (
          <View style={[StyleSheet.absoluteFill, styles.ghostOverlay]}>
            <Animated.View
              style={[
                styles.ghost,
                { width: GHOST_SIZE, height: GHOST_SIZE },
                ghostAnimStyle,
              ]}
            >
              <GhostIcon element={dragState.element} size={GHOST_SIZE} />
            </Animated.View>
          </View>
        )}
      </View>
    </DragCtx.Provider>
  );
}

function GhostIcon({ element, size }: { element: ElementID; size: number }) {
  return <ElementIcon name={element} size={size * 0.7} showLabel={false} />;
}

const styles = StyleSheet.create({
  ghostOverlay: {
    zIndex: 9998,
    pointerEvents: 'none',
  },
  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(18,22,34,0.92)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ff6a00',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.92,
    elevation: 999,
  },
});
