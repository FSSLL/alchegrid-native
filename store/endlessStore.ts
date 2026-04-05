import { create } from 'zustand';

// ── Constants from spec ───────────────────────────────────────────────────────
const GRID_POINTS: Record<number, number> = { 4: 1, 5: 2, 6: 3, 7: 5 };
const TARGET_TIMES: Record<number, number> = { 4: 60, 5: 90, 6: 150, 7: 240 };
const INACTIVITY_MS = 60_000;

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SkillTracker {
  recentSolveTimes: number[];
  recentMistakes: number[];
  currentGridSize: number;
  levelsAtCurrentGrid: number;
}

export interface LeaderboardEntry {
  playerName: string;
  totalScore: number;
  levelsCompleted: number;
  totalMistakes: number;
  totalTimeMs: number;
  highestGrid: number;
}

interface EndlessState {
  runActive: boolean;
  levelsCompleted: number;
  totalScore: number;
  totalMistakes: number;
  levelMistakes: number;
  totalTimeMs: number;
  levelStartTime: number;
  lastActivityTime: number;
  gameOverReason: 'timer' | 'surrender' | null;
  showGameOver: boolean;
  skillTracker: SkillTracker;
  currentDifficulty: number;
  bestScore: number;
  leaderboard: LeaderboardEntry[];
  // Actions
  startRun: () => void;
  completeLevel: () => number;
  recordMistake: () => void;
  surrender: () => void;
  bumpActivity: () => void;
  checkInactivity: () => boolean;
  refreshLeaderboard: () => Promise<void>;
  submitScore: (playerName: string) => Promise<void>;
  dismissGameOver: () => void;
}

// ── Score helpers ─────────────────────────────────────────────────────────────
function calculateLevelScore(
  gridSize: number,
  levelTimeMs: number,
  mistakes: number,
): number {
  const base = (GRID_POINTS[gridSize] ?? 1) * 100;
  const targetSecs = TARGET_TIMES[gridSize] ?? 60;
  const solveSecs = Math.max(1, levelTimeMs / 1000);
  const speedMult = Math.max(0.5, Math.min(3.0, targetSecs / solveSecs));
  const penalty = mistakes * 5;
  return Math.max(0, Math.round(base * speedMult - penalty));
}

function computeSkill(tracker: SkillTracker): number {
  const { recentSolveTimes, recentMistakes, currentGridSize } = tracker;
  if (recentSolveTimes.length === 0) return 0;
  const targetSecs = TARGET_TIMES[currentGridSize] ?? 60;
  const avgMs = recentSolveTimes.reduce((a, b) => a + b, 0) / recentSolveTimes.length;
  const speedScore = Math.max(0, Math.min(1, targetSecs / (avgMs / 1000) - 0.5));
  const avgMistakes = recentMistakes.reduce((a, b) => a + b, 0) / recentMistakes.length;
  const accuracyScore = Math.max(0, Math.min(1, 1 - avgMistakes / 5));
  return speedScore * 0.6 + accuracyScore * 0.4;
}

function shouldUpgradeGrid(tracker: SkillTracker): boolean {
  const { currentGridSize, levelsAtCurrentGrid, recentSolveTimes } = tracker;
  if (currentGridSize >= 7) return false;
  if (levelsAtCurrentGrid >= 15) return true;
  if (recentSolveTimes.length < 3) return false;
  const skill = computeSkill(tracker);
  if (skill > 0.6) return true;
  if (levelsAtCurrentGrid >= 8 && skill > 0.3) return true;
  return false;
}

// ── API URL helper (web only) ─────────────────────────────────────────────────
// The API server is routed at path /api on the main Replit domain (*.riker.replit.dev).
// Expo web runs on *.expo.riker.replit.dev — strip the `.expo` infix to get the main domain.
function getApiBase(): string {
  try {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname.replace('.expo.', '.');
      return `${window.location.protocol}//${h}`;
    }
  } catch {}
  return '';
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useEndlessStore = create<EndlessState>((set, get) => ({
  runActive: false,
  levelsCompleted: 0,
  totalScore: 0,
  totalMistakes: 0,
  levelMistakes: 0,
  totalTimeMs: 0,
  levelStartTime: 0,
  lastActivityTime: 0,
  gameOverReason: null,
  showGameOver: false,
  skillTracker: {
    recentSolveTimes: [],
    recentMistakes: [],
    currentGridSize: 4,
    levelsAtCurrentGrid: 0,
  },
  currentDifficulty: 0,
  bestScore: 0,
  leaderboard: [],

  startRun: () => {
    const now = Date.now();
    set({
      runActive: true,
      levelsCompleted: 0,
      totalScore: 0,
      totalMistakes: 0,
      levelMistakes: 0,
      totalTimeMs: 0,
      levelStartTime: now,
      lastActivityTime: now,
      gameOverReason: null,
      showGameOver: false,
      skillTracker: {
        recentSolveTimes: [],
        recentMistakes: [],
        currentGridSize: 4,
        levelsAtCurrentGrid: 0,
      },
      currentDifficulty: 0,
    });
  },

  completeLevel: () => {
    const {
      levelStartTime,
      levelMistakes,
      levelsCompleted,
      totalScore,
      totalTimeMs,
      totalMistakes,
      skillTracker,
      bestScore,
    } = get();

    const levelTimeMs = Date.now() - levelStartTime;
    const gridSize = skillTracker.currentGridSize;
    const levelScore = calculateLevelScore(gridSize, levelTimeMs, levelMistakes);
    const newTotalScore = totalScore + levelScore;

    // Update skill tracker (keeps last 5 levels)
    const newSolveTimes = [...skillTracker.recentSolveTimes, levelTimeMs].slice(-5);
    const newMistakes = [...skillTracker.recentMistakes, levelMistakes].slice(-5);
    const newLevelsAtGrid = skillTracker.levelsAtCurrentGrid + 1;

    const updatedTracker: SkillTracker = {
      recentSolveTimes: newSolveTimes,
      recentMistakes: newMistakes,
      currentGridSize: gridSize,
      levelsAtCurrentGrid: newLevelsAtGrid,
    };

    // Check grid upgrade
    if (shouldUpgradeGrid({ ...updatedTracker })) {
      updatedTracker.currentGridSize = Math.min(7, gridSize + 1);
      updatedTracker.levelsAtCurrentGrid = 0;
    }

    // New difficulty formula
    const newLevelsCompleted = levelsCompleted + 1;
    const baseProgress = Math.min(1, newLevelsCompleted / 30);
    const skill = computeSkill(updatedTracker);
    const newDifficulty = Math.min(1, baseProgress * 0.5 + skill * 0.5);

    const now = Date.now();
    set({
      levelsCompleted: newLevelsCompleted,
      totalScore: newTotalScore,
      totalTimeMs: totalTimeMs + levelTimeMs,
      levelStartTime: now,
      lastActivityTime: now,
      levelMistakes: 0,
      totalMistakes: totalMistakes + levelMistakes,
      skillTracker: updatedTracker,
      currentDifficulty: newDifficulty,
      bestScore: Math.max(bestScore, newTotalScore),
    });

    return levelScore;
  },

  recordMistake: () => {
    const now = Date.now();
    set((s) => ({
      levelMistakes: s.levelMistakes + 1,
      totalMistakes: s.totalMistakes + 1,
      lastActivityTime: now,
    }));
  },

  surrender: () => {
    set({ runActive: false, gameOverReason: 'surrender', showGameOver: true });
  },

  bumpActivity: () => set({ lastActivityTime: Date.now() }),

  checkInactivity: () => {
    const { lastActivityTime, runActive } = get();
    if (!runActive) return false;
    if (Date.now() - lastActivityTime > INACTIVITY_MS) {
      set({ runActive: false, gameOverReason: 'timer', showGameOver: true });
      return true;
    }
    return false;
  },

  refreshLeaderboard: async () => {
    const base = getApiBase();
    if (!base) return;
    try {
      const res = await fetch(`${base}/api/leaderboard/endless`);
      if (!res.ok) return;
      const data = await res.json();
      set({ leaderboard: data });
    } catch {}
  },

  submitScore: async (playerName: string) => {
    const { levelsCompleted, totalScore, totalMistakes, totalTimeMs, skillTracker } = get();
    if (levelsCompleted < 1) return;
    const base = getApiBase();
    if (!base) return;
    try {
      await fetch(`${base}/api/leaderboard/endless`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.slice(0, 20),
          totalScore,
          levelsCompleted,
          totalMistakes,
          totalTimeMs,
          highestGrid: skillTracker.currentGridSize,
        }),
      });
      get().refreshLeaderboard();
    } catch {}
  },

  dismissGameOver: () => {
    set({ showGameOver: false });
  },
}));
