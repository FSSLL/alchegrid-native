import { create } from 'zustand';
import type { Level, ElementID, CellCoord, Zone } from '../lib/types';
import { getConflicts, checkWin } from '../lib/validators';

interface GameState {
  level: Level | null;
  board: (ElementID | null)[][];
  hintedCells: Record<string, ElementID>;
  status: 'idle' | 'playing' | 'won';
  activeElement: ElementID | null;
  hintMode: boolean;
  conflicts: CellCoord[];
  selectedZone: Zone | null;
  startTime: number;
  elapsedTime: number;
  timerInterval: ReturnType<typeof setInterval> | null;
  stars: number;

  initGame: (level: Level) => void;
  placeElement: (row: number, col: number, onWin?: (stars: number) => void) => void;
  placeSpecificElement: (element: ElementID, row: number, col: number, onWin?: (stars: number) => void) => void;
  clearCell: (row: number, col: number) => void;
  removeElement: (row: number, col: number) => void;
  revealHint: (row: number, col: number) => void;
  toggleHintMode: () => void;
  setActiveElement: (el: ElementID | null) => void;
  setSelectedZone: (zone: Zone | null) => void;
  tick: () => void;
  stopTimer: () => void;
  resetBoard: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  level: null,
  board: [],
  hintedCells: {},
  status: 'idle',
  activeElement: null,
  hintMode: false,
  conflicts: [],
  selectedZone: null,
  startTime: 0,
  elapsedTime: 0,
  timerInterval: null,
  stars: 0,

  initGame: (level) => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);

    const emptyBoard = Array.from({ length: level.size }, () =>
      new Array(level.size).fill(null)
    );

    const interval = setInterval(() => get().tick(), 1000);

    set({
      level,
      board: emptyBoard,
      hintedCells: {},
      status: 'playing',
      activeElement: null,
      hintMode: false,
      conflicts: [],
      selectedZone: null,
      startTime: Date.now(),
      elapsedTime: 0,
      timerInterval: interval,
      stars: 0,
    });
  },

  placeElement: (row, col, onWin) => {
    const { level, board, hintedCells, activeElement, hintMode, status } = get();
    if (!level || status !== 'playing') return;

    const hintKey = `${row},${col}`;
    if (hintedCells[hintKey]) return;

    if (hintMode) {
      get().revealHint(row, col);
      return;
    }

    if (!activeElement) return;

    const currentCell = board[row][col];

    // Toggle off: tapping same element removes it
    if (currentCell === activeElement) {
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = null;
      const conflicts = getConflicts(newBoard, level.size, level.zones);
      set({ board: newBoard, conflicts });
      return;
    }

    // Inventory enforcement (spec §1.3): count remaining slots for activeElement
    const maxPerElement = level.size;
    const counts: Record<string, number> = {};
    level.elements.forEach((el) => { counts[el] = maxPerElement; });
    board.forEach((r) => r.forEach((cell) => {
      if (cell !== null && counts[cell] !== undefined) counts[cell]--;
    }));
    // Block placement if no slots remain (replacing a different element still uses one slot)
    if (counts[activeElement] <= 0) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = activeElement;

    const conflicts = getConflicts(newBoard, level.size, level.zones);

    const won = checkWin(level, newBoard, conflicts);

    if (won) {
      const { elapsedTime, timerInterval } = get();
      if (timerInterval) clearInterval(timerInterval);

      const { three, two } = level.starThresholds;
      let stars = 1;
      if (elapsedTime <= three) stars = 3;
      else if (elapsedTime <= two) stars = 2;

      set({ board: newBoard, conflicts, status: 'won', timerInterval: null, stars });
      onWin?.(stars);
    } else {
      set({ board: newBoard, conflicts });
    }
  },

  placeSpecificElement: (element, row, col, onWin) => {
    const { level, board, hintedCells, status } = get();
    if (!level || status !== 'playing') return;
    if (hintedCells[`${row},${col}`]) return;

    // Inventory check
    const maxPerElement = level.size;
    const counts: Record<string, number> = {};
    level.elements.forEach((el) => { counts[el] = maxPerElement; });
    board.forEach((r) => r.forEach((cell) => {
      if (cell !== null && counts[cell] !== undefined) counts[cell]--;
    }));
    if ((counts[element] ?? 0) <= 0) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = element;

    const conflicts = getConflicts(newBoard, level.size, level.zones);
    const won = checkWin(level, newBoard, conflicts);

    if (won) {
      const { elapsedTime, timerInterval } = get();
      if (timerInterval) clearInterval(timerInterval);
      const { three, two } = level.starThresholds;
      let stars = 1;
      if (elapsedTime <= three) stars = 3;
      else if (elapsedTime <= two) stars = 2;
      set({ board: newBoard, conflicts, status: 'won', timerInterval: null, stars });
      onWin?.(stars);
    } else {
      set({ board: newBoard, conflicts });
    }
  },

  clearCell: (row, col) => {
    const { level, board, hintedCells, status } = get();
    if (!level || status !== 'playing') return;
    if (hintedCells[`${row},${col}`]) return;
    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = null;
    const conflicts = getConflicts(newBoard, level.size, level.zones);
    set({ board: newBoard, conflicts });
  },

  removeElement: (row, col) => {
    const { level, board, hintedCells, status } = get();
    if (!level || status !== 'playing') return;

    const hintKey = `${row},${col}`;
    if (hintedCells[hintKey]) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = null;

    const conflicts = getConflicts(newBoard, level.size, level.zones);
    set({ board: newBoard, conflicts });
  },

  revealHint: (row, col) => {
    const { level, board, hintedCells, status } = get();
    if (!level || status !== 'playing') return;

    const hintKey = `${row},${col}`;
    if (hintedCells[hintKey]) return;

    const answer = level.canonicalSolution[row][col];
    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = answer;

    const newHinted = { ...hintedCells, [hintKey]: answer };
    const conflicts = getConflicts(newBoard, level.size, level.zones);
    const won = checkWin(level, newBoard, conflicts);

    if (won) {
      const { elapsedTime, timerInterval } = get();
      if (timerInterval) clearInterval(timerInterval);
      const { three, two } = level.starThresholds;
      let stars = 1;
      if (elapsedTime <= three) stars = 3;
      else if (elapsedTime <= two) stars = 2;
      set({ board: newBoard, hintedCells: newHinted, conflicts, status: 'won', timerInterval: null, stars });
    } else {
      set({ board: newBoard, hintedCells: newHinted, conflicts, hintMode: false, activeElement: null });
    }
  },

  toggleHintMode: () => {
    set((s) => ({ hintMode: !s.hintMode, activeElement: null }));
  },

  setActiveElement: (el) => {
    set({ activeElement: el, hintMode: false });
  },

  setSelectedZone: (zone) => {
    set({ selectedZone: zone });
  },

  tick: () => {
    set((s) => ({ elapsedTime: s.elapsedTime + 1 }));
  },

  stopTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);
    set({ timerInterval: null });
  },

  resetBoard: () => {
    const { level, timerInterval } = get();
    if (!level) return;
    if (timerInterval) clearInterval(timerInterval);

    const emptyBoard = Array.from({ length: level.size }, () =>
      new Array(level.size).fill(null)
    );

    const interval = setInterval(() => get().tick(), 1000);
    set({
      board: emptyBoard,
      hintedCells: {},
      conflicts: [],
      activeElement: null,
      hintMode: false,
      startTime: Date.now(),
      elapsedTime: 0,
      timerInterval: interval,
      status: 'playing',
      stars: 0,
    });
  },
}));
