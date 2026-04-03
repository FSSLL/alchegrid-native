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
  Image,
  Text,
  PanResponder,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import type { ElementID } from '../lib/types';
import { ELEMENT_PNGS } from '../constants/assets';
import { ELEMENT_EMOJIS } from '../lib/elementEmojis';

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
    onDrop: (el: ElementID, row: number, col: number) => void,
    onDropOutside: (row: number, col: number) => void,
  ) => void;
}

const DragCtx = createContext<DragContextValue | null>(null);

export function useDrag() {
  const ctx = useContext(DragCtx);
  if (!ctx) throw new Error('useDrag must be within DragProvider');
  return ctx;
}

const GHOST_SIZE = 56;

export function DragProvider({ children }: { children: ReactNode }) {
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Reanimated shared values for ghost position — no re-renders on move
  const ghostX = useSharedValue(-9999);
  const ghostY = useSharedValue(-9999);

  // Stable refs so PanResponder callbacks are never stale
  const dragStateRef = useRef<DragState | null>(null);
  const gridInfoRef = useRef<GridInfo | null>(null);
  const onDropRef = useRef<(el: ElementID, r: number, c: number) => void>(() => {});
  const onDropOutsideRef = useRef<(r: number, c: number) => void>(() => {});

  const registerGrid = useCallback((info: GridInfo) => {
    gridInfoRef.current = info;
  }, []);

  const setDropHandlers = useCallback(
    (
      onDrop: (el: ElementID, r: number, c: number) => void,
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
          onDropRef.current(ds.element, row, col);
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
      { translateX: ghostX.value - GHOST_SIZE / 2 },
      { translateY: ghostY.value - GHOST_SIZE / 2 },
    ],
  }));

  return (
    <DragCtx.Provider
      value={{
        isDragging: !!dragState,
        startDrag,
        moveDrag,
        endDrag,
        cancelDrag,
        registerGrid,
        setDropHandlers,
      }}
    >
      <View style={{ flex: 1 }}>
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
  const png =
    ELEMENT_PNGS[element.toLowerCase()] ?? ELEMENT_PNGS[element] ?? null;
  const emoji = ELEMENT_EMOJIS[element.toLowerCase()] ?? element[0];
  if (png) {
    return (
      <Image
        source={png}
        style={{ width: size * 0.7, height: size * 0.7 }}
        resizeMode="contain"
      />
    );
  }
  return <Text style={{ fontSize: size * 0.44 }}>{emoji}</Text>;
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
