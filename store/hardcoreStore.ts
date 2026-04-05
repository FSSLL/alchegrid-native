import { create } from 'zustand';

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
}

function getApiBase(): string {
  try {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname.replace('.expo.', '.');
      return `${window.location.protocol}//${h}`;
    }
  } catch {}
  return '';
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
    });
  },

  completeLevel: () => {
    const { currentLevel, totalTimeMs, levelStartTime, bestLevel } = get();
    const levelTime = Date.now() - levelStartTime;
    const newTotal = totalTimeMs + levelTime;
    const nextLevel = currentLevel + 1;

    if (nextLevel > MAX_LEVEL) {
      // Perfect run — all 70 levels cleared
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
    // Level reached = last fully completed level
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
