import { create } from 'zustand';
import { getApiBase } from './communityStore';

export type GameOverReason = 'mistakes' | 'inactivity' | 'surrender' | 'completed' | null;

export interface HardcoreLBEntry {
  playerName: string;
  levelReached: number;
  totalTimeMs: number;
  submittedAt: string;
}

const INACTIVITY_MS = 60_000;
const MAX_LIVES = 3;
const MAX_LEVEL = 70;

// Grid-size blocks: each inner array is 0-based indices into hardcoreLevels[].
// Levels within each block are shuffled independently on every new run.
const HARDCORE_BLOCKS: number[][] = [
  [0,1,2,3,4,5,6,7],                           // 5×5  (W2)
  [8,9,10,11,12,13,14,15],                      // 6×6  (W3)
  [16,17,18,19,20,21,22,23],                    // 7×7  (W4)
  [24,25,26,27,28,29,30,31],                    // 8×8  (W5)
  [32,33,34,35,36,37,38,39],                    // 9×9  (W6)
  [40,41,42,43,44,45,46,47],                    // 10×10 (W7)
  [48,49,50,51,52,53,54,55],                    // 11×11 (W8 Tier 2+3)
  [56,57,58,59,60,61,62,63,64,65,66,67,68,69], // 11×11 Tier 3 extras
];

function shuffleBlock<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRunOrder(): number[] {
  return HARDCORE_BLOCKS.flatMap(block => shuffleBlock(block));
}

interface HardcoreState {
  runActive: boolean;
  currentLevel: number;
  mistakesLeft: number;
  totalTimeMs: number;
  levelStartTime: number;
  lastActivityTime: number;
  gameOverReason: GameOverReason;
  showGameOver: boolean;
  bestLevel: number;
  leaderboard: HardcoreLBEntry[];
  /** Per-run shuffle: hardcoreOrder[slot - 1] gives the 0-based data index for that slot */
  hardcoreOrder: number[];
  // Actions
  startRun: () => void;
  completeLevel: () => void;
  recordMistake: () => boolean;
  surrender: () => void;
  bumpActivity: () => void;
  checkInactivity: () => boolean;
  refreshLeaderboard: () => Promise<void>;
  submitScore: (playerName: string) => Promise<void>;
  dismissGameOver: () => void;
  /** Returns the 1-based data index into hardcoreLevels[] for the current run slot */
  getActualLevelIndex: () => number;
}

export const useHardcoreStore = create<HardcoreState>((set, get) => ({
  runActive: false,
  currentLevel: 1,
  mistakesLeft: MAX_LIVES,
  totalTimeMs: 0,
  levelStartTime: 0,
  lastActivityTime: 0,
  gameOverReason: null,
  showGameOver: false,
  bestLevel: 0,
  leaderboard: [],
  hardcoreOrder: buildRunOrder(),

  getActualLevelIndex: () => {
    const { currentLevel, hardcoreOrder } = get();
    return (hardcoreOrder[currentLevel - 1] ?? currentLevel - 1) + 1;
  },

  startRun: () => {
    const now = Date.now();
    set({
      runActive: true,
      currentLevel: 1,
      mistakesLeft: MAX_LIVES,
      totalTimeMs: 0,
      levelStartTime: now,
      lastActivityTime: now,
      gameOverReason: null,
      showGameOver: false,
      hardcoreOrder: buildRunOrder(), // fresh shuffle each run
    });
  },

  completeLevel: () => {
    const { currentLevel, totalTimeMs, levelStartTime, bestLevel } = get();
    const levelTime = Date.now() - levelStartTime;
    const newTotal = totalTimeMs + levelTime;
    const nextLevel = currentLevel + 1;

    if (nextLevel > MAX_LEVEL) {
      set({
        runActive: false,
        totalTimeMs: newTotal,
        gameOverReason: 'completed',
        showGameOver: true,
        bestLevel: Math.max(bestLevel, currentLevel),
      });
      return;
    }

    const now = Date.now();
    set({
      currentLevel: nextLevel,
      totalTimeMs: newTotal,
      levelStartTime: now,
      lastActivityTime: now,
      bestLevel: Math.max(bestLevel, currentLevel),
    });
  },

  recordMistake: () => {
    const { mistakesLeft, totalTimeMs, levelStartTime, currentLevel, bestLevel } = get();
    const newMistakes = mistakesLeft - 1;

    if (newMistakes <= 0) {
      const levelTime = Date.now() - levelStartTime;
      set({
        mistakesLeft: 0,
        runActive: false,
        totalTimeMs: totalTimeMs + levelTime,
        gameOverReason: 'mistakes',
        showGameOver: true,
        bestLevel: Math.max(bestLevel, currentLevel - 1),
      });
      return false;
    }

    set({ mistakesLeft: newMistakes, lastActivityTime: Date.now() });
    return true;
  },

  surrender: () => {
    const { totalTimeMs, levelStartTime, currentLevel, bestLevel } = get();
    const levelTime = Date.now() - levelStartTime;
    set({
      runActive: false,
      totalTimeMs: totalTimeMs + levelTime,
      gameOverReason: 'surrender',
      showGameOver: true,
      bestLevel: Math.max(bestLevel, currentLevel - 1),
    });
  },

  bumpActivity: () => set({ lastActivityTime: Date.now() }),

  checkInactivity: () => {
    const { lastActivityTime, runActive } = get();
    if (!runActive) return false;
    if (Date.now() - lastActivityTime > INACTIVITY_MS) {
      const { totalTimeMs, levelStartTime, currentLevel, bestLevel } = get();
      const levelTime = Date.now() - levelStartTime;
      set({
        runActive: false,
        totalTimeMs: totalTimeMs + levelTime,
        gameOverReason: 'inactivity',
        showGameOver: true,
        bestLevel: Math.max(bestLevel, currentLevel - 1),
      });
      return true;
    }
    return false;
  },

  refreshLeaderboard: async () => {
    const base = getApiBase();
    if (!base) return;
    try {
      const res = await fetch(`${base}/api/leaderboard/hardcore`);
      if (!res.ok) return;
      const data = await res.json();
      set({ leaderboard: data });
    } catch {}
  },

  submitScore: async (playerName: string) => {
    const { currentLevel, totalTimeMs, gameOverReason } = get();
    const levelReached = gameOverReason === 'completed' ? currentLevel : currentLevel - 1;
    if (levelReached < 1) return;
    const base = getApiBase();
    if (!base) return;
    try {
      await fetch(`${base}/api/leaderboard/hardcore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.trim().slice(0, 20),
          levelReached,
          totalTimeMs,
        }),
      });
      get().refreshLeaderboard();
    } catch {}
  },

  dismissGameOver: () => set({ showGameOver: false }),
}));
